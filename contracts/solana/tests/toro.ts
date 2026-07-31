import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Toro } from "../target/types/toro";
import { expect } from "chai";

const { PublicKey, Keypair, LAMPORTS_PER_SOL } = anchor.web3;

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.toro as Program<Toro>;
const provider = anchor.getProvider() as anchor.AnchorProvider;
const authority = provider.wallet;

// ───────── Helpers ─────────

function idToBytes32(id: string): Buffer {
  const buf = Buffer.alloc(32);
  buf.write(id, "utf-8");
  return buf;
}

function configPDA(): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId)[0];
}

function batchPDA(batchId: Buffer): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("batch"), batchId], program.programId)[0];
}

function lotPDA(lotCode: Buffer): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("lot"), lotCode], program.programId)[0];
}

function rolePDA(kind: "factory" | "station", wallet: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from(kind), wallet.toBuffer()], program.programId)[0];
}

async function airdrop(pubkey: PublicKey) {
  const sig = await provider.connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
  await provider.connection.confirmTransaction(sig);
}

async function expectError(promise: Promise<unknown>, code: string) {
  try {
    await promise;
    expect.fail("expected transaction to fail");
  } catch (e: any) {
    const logs: string[] = e?.logs ?? e?.simulationResponse?.logs ?? [];
    const msg = logs.join("\n") + String(e);
    expect(msg).to.include(code);
  }
}

// ───────── Fixtures ─────────

const BATCH_1 = idToBytes32("WILD-CATCH-001");
const BATCH_2 = idToBytes32("FARM-001");
const LOT_1 = idToBytes32("TORO-01");

const factory = Keypair.generate();
const station = Keypair.generate();
const stranger = Keypair.generate();

const dummyData = (label: string) => Buffer.from(label, "utf-8");

describe("toro", () => {
  before(async () => {
    await Promise.all([airdrop(factory.publicKey), airdrop(station.publicKey), airdrop(stranger.publicKey)]);
  });

  it("initializes the config", async () => {
    await program.methods.initialize().rpc();

    const config = await program.account.config.fetch(configPDA());
    expect(config.authority.toString()).to.equal(authority.publicKey.toString());
    expect(config.batchCount.toNumber()).to.equal(0);
    expect(config.lotCount.toNumber()).to.equal(0);
  });

  it("grants factory and station roles", async () => {
    await program.methods
      .addFactorySigner(factory.publicKey)
      .accounts({ role: rolePDA("factory", factory.publicKey) })
      .rpc();
    await program.methods
      .authorizeStation(station.publicKey)
      .accounts({ role: rolePDA("station", station.publicKey) })
      .rpc();

    const fRole = await program.account.role.fetch(rolePDA("factory", factory.publicKey));
    expect(fRole.wallet.toString()).to.equal(factory.publicKey.toString());
  });

  it("rejects role management from non-authority", async () => {
    await expectError(
      program.methods
        .addFactorySigner(stranger.publicKey)
        .accounts({
          authority: stranger.publicKey,
          role: rolePDA("factory", stranger.publicKey),
        })
        .signers([stranger])
        .rpc(),
      "Unauthorized"
    );
  });

  it("mints a batch as factory signer", async () => {
    await program.methods
      .mintBatch(Array.from(BATCH_1), dummyData("source-data-1"))
      .accounts({
        recorder: factory.publicKey,
        role: rolePDA("factory", factory.publicKey),
        batch: batchPDA(BATCH_1),
      })
      .signers([factory])
      .rpc();

    const batch = await program.account.batch.fetch(batchPDA(BATCH_1));
    expect(batch.stage).to.equal(1); // Source

    const config = await program.account.config.fetch(configPDA());
    expect(config.batchCount.toNumber()).to.equal(1);
  });

  it("rejects mint from unauthorized wallet", async () => {
    await expectError(
      program.methods
        .mintBatch(Array.from(BATCH_2), dummyData("x"))
        .accounts({
          recorder: stranger.publicKey,
          role: rolePDA("factory", stranger.publicKey),
          batch: batchPDA(BATCH_2),
        })
        .signers([stranger])
        .rpc(),
      "Error"
    );
  });

  it("rejects duplicate batch mint", async () => {
    await expectError(
      program.methods
        .mintBatch(Array.from(BATCH_1), dummyData("again"))
        .accounts({
          recorder: factory.publicKey,
          role: rolePDA("factory", factory.publicKey),
          batch: batchPDA(BATCH_1),
        })
        .signers([factory])
        .rpc(),
      "Error"
    );
  });

  it("enforces batch stage order", async () => {
    // manufacturing (2->3) before inventory (1->2) must fail
    await expectError(
      program.methods
        .recordManufacturing(dummyData("skip"))
        .accounts({
          recorder: station.publicKey,
          role: rolePDA("station", station.publicKey),
          batch: batchPDA(BATCH_1),
        })
        .signers([station])
        .rpc(),
      "InvalidStage"
    );
  });

  it("records inventory then manufacturing", async () => {
    await program.methods
      .recordInventory(dummyData("inventory-1"))
      .accounts({
        recorder: station.publicKey,
        role: rolePDA("station", station.publicKey),
        batch: batchPDA(BATCH_1),
      })
      .signers([station])
      .rpc();
    await program.methods
      .recordManufacturing(dummyData("manufacturing-1"))
      .accounts({
        recorder: station.publicKey,
        role: rolePDA("station", station.publicKey),
        batch: batchPDA(BATCH_1),
      })
      .signers([station])
      .rpc();

    const batch = await program.account.batch.fetch(batchPDA(BATCH_1));
    expect(batch.stage).to.equal(3); // Manufacturing
  });

  it("authority can mint without a role account", async () => {
    await program.methods
      .mintBatch(Array.from(BATCH_2), dummyData("source-data-2"))
      .accounts({
        recorder: authority.publicKey,
        role: null,
        batch: batchPDA(BATCH_2),
      })
      .rpc();

    const batch = await program.account.batch.fetch(batchPDA(BATCH_2));
    expect(batch.stage).to.equal(1);
  });

  it("rejects lot creation when a batch is not at manufacturing", async () => {
    await expectError(
      program.methods
        .createProductLot(Array.from(LOT_1), new anchor.BN(100), dummyData("lot-data"))
        .accounts({
          recorder: factory.publicKey,
          role: rolePDA("factory", factory.publicKey),
          lot: lotPDA(LOT_1),
        })
        .remainingAccounts([
          { pubkey: batchPDA(BATCH_1), isSigner: false, isWritable: false },
          { pubkey: batchPDA(BATCH_2), isSigner: false, isWritable: false }, // still stage 1
        ])
        .signers([factory])
        .rpc(),
      "BatchNotAtManufacturing"
    );
  });

  it("merges two batches into a product lot", async () => {
    // bring BATCH_2 to manufacturing (authority acts as station)
    await program.methods
      .recordInventory(dummyData("inventory-2"))
      .accounts({ recorder: authority.publicKey, role: null, batch: batchPDA(BATCH_2) })
      .rpc();
    await program.methods
      .recordManufacturing(dummyData("manufacturing-2"))
      .accounts({ recorder: authority.publicKey, role: null, batch: batchPDA(BATCH_2) })
      .rpc();

    await program.methods
      .createProductLot(Array.from(LOT_1), new anchor.BN(8800), dummyData("lot-data"))
      .accounts({
        recorder: factory.publicKey,
        role: rolePDA("factory", factory.publicKey),
        lot: lotPDA(LOT_1),
      })
      .remainingAccounts([
        { pubkey: batchPDA(BATCH_1), isSigner: false, isWritable: false },
        { pubkey: batchPDA(BATCH_2), isSigner: false, isWritable: false },
      ])
      .signers([factory])
      .rpc();

    const lot = await program.account.lot.fetch(lotPDA(LOT_1));
    expect(lot.stage).to.equal(3);
    expect(lot.totalCans.toNumber()).to.equal(8800);
    expect(lot.inputCount).to.equal(2);
    expect(lot.inputBatches[0].toString()).to.equal(batchPDA(BATCH_1).toString());
    expect(lot.inputBatches[1].toString().slice(0, 8)).to.equal(batchPDA(BATCH_2).toString().slice(0, 8));
  });

  it("rejects warehouse recording from non-station", async () => {
    await expectError(
      program.methods
        .recordWarehouse(dummyData("wh"))
        .accounts({
          recorder: stranger.publicKey,
          role: rolePDA("station", stranger.publicKey),
          lot: lotPDA(LOT_1),
        })
        .signers([stranger])
        .rpc(),
      "Error"
    );
  });

  it("records warehouse then distribution on the lot", async () => {
    await program.methods
      .recordWarehouse(dummyData("warehouse-data"))
      .accounts({
        recorder: station.publicKey,
        role: rolePDA("station", station.publicKey),
        lot: lotPDA(LOT_1),
      })
      .signers([station])
      .rpc();
    await program.methods
      .recordDistribution(dummyData("distribution-data"))
      .accounts({
        recorder: station.publicKey,
        role: rolePDA("station", station.publicKey),
        lot: lotPDA(LOT_1),
      })
      .signers([station])
      .rpc();

    const lot = await program.account.lot.fetch(lotPDA(LOT_1));
    expect(lot.stage).to.equal(5); // Distribution
  });

  it("revokes a factory signer and blocks further mints", async () => {
    await program.methods
      .removeFactorySigner()
      .accounts({ role: rolePDA("factory", factory.publicKey) })
      .rpc();

    await expectError(
      program.methods
        .mintBatch(Array.from(idToBytes32("WILD-CATCH-999")), dummyData("x"))
        .accounts({
          recorder: factory.publicKey,
          role: rolePDA("factory", factory.publicKey),
          batch: batchPDA(idToBytes32("WILD-CATCH-999")),
        })
        .signers([factory])
        .rpc(),
      "Error"
    );
  });
});
