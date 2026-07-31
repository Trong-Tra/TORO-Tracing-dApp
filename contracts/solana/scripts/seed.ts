/**
 * Devnet seed script: ports contracts/evm/script/DeployAndDemo.s.sol + SeedLot05.s.sol
 * Initializes the program, grants roles to the deployer, and records the 5 demo
 * traces (TORO-01..TORO-05) with the exact same code/value payloads as EVM.
 *
 * Usage: yarn seed   (from contracts/solana)
 */

import * as anchor from "@anchor-lang/core";
import { encodeAbiParameters, parseAbiParameters, toHex, pad } from "viem";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const { PublicKey, Keypair, Connection } = anchor.web3;

// ───────── Setup ─────────

const RPC_URL = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";
const WALLET_PATH =
  process.env.ANCHOR_WALLET ?? path.join(os.homedir(), ".config/solana/id.json");

const keypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8")))
);
const connection = new Connection(RPC_URL, "confirmed");
const wallet = new anchor.Wallet(keypair);
const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });

const idl = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../target/idl/toro.json"), "utf-8")
);
const program = new anchor.Program(idl as any, provider) as any;
const PROGRAM_ID: InstanceType<typeof PublicKey> = program.programId;

// ───────── PDA helpers ─────────

const idToBytes32 = (id: string): Buffer => {
  const buf = Buffer.alloc(32);
  buf.write(id, "utf-8");
  return buf;
};

const pda = (seeds: Buffer[]) =>
  PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];

const configPDA = () => pda([Buffer.from("config")]);
const batchPDA = (id: Buffer) => pda([Buffer.from("batch"), id]);
const lotPDA = (code: Buffer) => pda([Buffer.from("lot"), code]);
const rolePDA = (kind: "factory" | "station", w: anchor.web3.PublicKey) =>
  pda([Buffer.from(kind), w.toBuffer()]);

// ───────── Data builders (mirror the Solidity _str32 / abi.encode payloads) ─────────

type Hex = `0x${string}`;

const u256 = (n: number | bigint): Hex => pad(toHex(n), { size: 32 });
const i256 = (n: number): Hex =>
  pad(toHex(n < 0 ? BigInt(2) ** BigInt(256) + BigInt(n) : BigInt(n)), { size: 32 });
const str32 = (s: string): Hex =>
  ("0x" + Buffer.from(s, "utf-8").toString("hex").padEnd(64, "0")) as Hex;

function encodeData(codes: number[], values: Hex[]): Buffer {
  const hex = encodeAbiParameters(parseAbiParameters("uint256[] codes, bytes32[] values"), [
    codes.map(BigInt),
    values,
  ]);
  return Buffer.from(hex.slice(2), "hex");
}

const sourceData = (
  sourceType: number, species: number, region: string,
  catchDate: number, method: number, area: number, weightKg: number
) =>
  encodeData(
    [0x100, 0x101, 0x102, 0x103, 0x104, 0x105, 0x106, 0x600],
    [u256(sourceType), u256(species), str32(region), u256(catchDate), u256(method), u256(area), u256(weightKg), u256(1)]
  );

const inventoryData = (receivedDate: number, locationId: number) =>
  encodeData([0x110, 0x111], [u256(receivedDate), u256(locationId)]);

const manufData = (
  factoryName: string, prodDate: number, packDate: number,
  inputKg: number, outputCans: number, wastageKg: number
) =>
  encodeData(
    [0x200, 0x204, 0x205, 0x208, 0x209, 0x20a],
    [str32(factoryName), u256(prodDate), u256(packDate), u256(inputKg), u256(outputCans), u256(wastageKg)]
  );

const lotData = (productLabel: string, packagingDate: number) =>
  encodeData([0x501, 0x504], [str32(productLabel), u256(packagingDate)]);

const warehouseData = (name: string, start: number, end: number, tempC: number) =>
  encodeData([0x300, 0x304, 0x305, 0x306], [str32(name), u256(start), u256(end), i256(tempC)]);

const distData = (shipmentCode: string, departure: number, arrival: number) =>
  encodeData([0x400, 0x404, 0x405], [str32(shipmentCode), u256(departure), u256(arrival)]);

// ───────── Chain ops ─────────

async function exists(addr: anchor.web3.PublicKey): Promise<boolean> {
  return (await connection.getAccountInfo(addr)) !== null;
}

async function initializeIfNeeded() {
  if (await exists(configPDA())) {
    console.log("Config already initialized, skipping");
    return;
  }
  await program.methods.initialize().rpc();
  console.log("Initialized config");
}

async function grantRoleIfNeeded(kind: "factory" | "station") {
  const role = rolePDA(kind, keypair.publicKey);
  if (await exists(role)) {
    console.log(`Role ${kind} already granted, skipping`);
    return;
  }
  if (kind === "factory") {
    await program.methods.addFactorySigner(keypair.publicKey).accounts({ role }).rpc();
  } else {
    await program.methods.authorizeStation(keypair.publicKey).accounts({ role }).rpc();
  }
  console.log(`Granted ${kind} role to deployer`);
}

async function mintBatch(id: string, data: Buffer) {
  const batchId = idToBytes32(id);
  await program.methods
    .mintBatch(Array.from(batchId), data)
    .accounts({
      recorder: keypair.publicKey,
      role: rolePDA("factory", keypair.publicKey),
      batch: batchPDA(batchId),
    })
    .rpc();
  console.log(`  minted batch ${id}`);
}

async function recordBatchStage(method: "recordInventory" | "recordManufacturing", id: string, data: Buffer) {
  const batchId = idToBytes32(id);
  await program.methods[method](data)
    .accounts({
      recorder: keypair.publicKey,
      role: rolePDA("station", keypair.publicKey),
      batch: batchPDA(batchId),
    })
    .rpc();
  console.log(`  ${method} ${id}`);
}

async function createLot(code: string, batchIds: string[], totalCans: number, data: Buffer) {
  const lotCode = idToBytes32(code);
  await program.methods
    .createProductLot(Array.from(lotCode), new anchor.BN(totalCans), data)
    .accounts({
      recorder: keypair.publicKey,
      role: rolePDA("factory", keypair.publicKey),
      lot: lotPDA(lotCode),
    })
    .remainingAccounts(
      batchIds.map((id) => ({
        pubkey: batchPDA(idToBytes32(id)),
        isSigner: false,
        isWritable: false,
      }))
    )
    .rpc();
  console.log(`  created lot ${code} from [${batchIds.join(", ")}]`);
}

async function recordLotStage(method: "recordWarehouse" | "recordDistribution", code: string, data: Buffer) {
  const lotCode = idToBytes32(code);
  await program.methods[method](data)
    .accounts({
      recorder: keypair.publicKey,
      role: rolePDA("station", keypair.publicKey),
      lot: lotPDA(lotCode),
    })
    .rpc();
  console.log(`  ${method} ${code}`);
}

// ───────── Demo traces (identical to the EVM seed scripts) ─────────

async function main() {
  console.log(`Program:  ${PROGRAM_ID.toBase58()}`);
  console.log(`Deployer: ${keypair.publicKey.toBase58()}`);
  console.log(`Cluster:  ${RPC_URL}`);

  await initializeIfNeeded();
  await grantRoleIfNeeded("factory");
  await grantRoleIfNeeded("station");

  console.log("=== TRACE 1: WILD-CATCH-001 -> TORO-01 ===");
  await mintBatch("WILD-CATCH-001", sourceData(1, 1, "Bình Định", 1715731200, 1, 1, 800));
  await recordBatchStage("recordInventory", "WILD-CATCH-001", inventoryData(1716000000, 1));
  await recordBatchStage("recordManufacturing", "WILD-CATCH-001", manufData("TORO-Seafood Processing 1", 1717200000, 1718400000, 1950, 3900, 50));
  await createLot("TORO-01", ["WILD-CATCH-001"], 3900, lotData("cá ngừ đóng hộp", 1719800000));
  await recordLotStage("recordWarehouse", "TORO-01", warehouseData("TORO-Cold Storage 1", 1719000000, 1719700000, 2));
  await recordLotStage("recordDistribution", "TORO-01", distData("TORO-Shipping 1", 1719500000, 1719700000));

  console.log("=== TRACE 2: WILD-CATCH-002 + FARM-001 -> TORO-02 ===");
  await mintBatch("WILD-CATCH-002", sourceData(1, 1, "Phú Yên", 1715800000, 1, 1, 850));
  await recordBatchStage("recordInventory", "WILD-CATCH-002", inventoryData(1716100000, 1));
  await recordBatchStage("recordManufacturing", "WILD-CATCH-002", manufData("TORO-Seafood Processing 1", 1717300000, 1718500000, 2000, 4000, 60));
  await mintBatch("FARM-001", sourceData(2, 1, "Khánh Hòa", 1715900000, 5, 1, 2500));
  await recordBatchStage("recordInventory", "FARM-001", inventoryData(1716200000, 2));
  await recordBatchStage("recordManufacturing", "FARM-001", manufData("TORO-Seafood Processing 2", 1717400000, 1718600000, 2400, 4800, 80));
  await createLot("TORO-02", ["WILD-CATCH-002", "FARM-001"], 8800, lotData("cá ngừ đóng hộp", 1720000000));
  await recordLotStage("recordWarehouse", "TORO-02", warehouseData("TORO-Cold Storage 2", 1719100000, 1719800000, 2));
  await recordLotStage("recordDistribution", "TORO-02", distData("TORO-Shipping 2", 1719600000, 1719800000));

  console.log("=== TRACE 3: FARM-002 -> TORO-03 ===");
  await mintBatch("FARM-002", sourceData(2, 2, "Bình Định", 1716000000, 5, 2, 3000));
  await recordBatchStage("recordInventory", "FARM-002", inventoryData(1716300000, 2));
  await recordBatchStage("recordManufacturing", "FARM-002", manufData("TORO-Seafood Processing 3", 1717500000, 1718700000, 2900, 5800, 100));
  await createLot("TORO-03", ["FARM-002"], 5800, lotData("cá ngừ đóng hộp", 1720100000));
  await recordLotStage("recordWarehouse", "TORO-03", warehouseData("TORO-Cold Storage 1", 1719300000, 1720000000, 1));
  await recordLotStage("recordDistribution", "TORO-03", distData("TORO-Shipping 3", 1719800000, 1720000000));

  console.log("=== TRACE 4: WILD-CATCH-003 -> TORO-04 ===");
  await mintBatch("WILD-CATCH-003", sourceData(1, 3, "Phú Yên", 1716100000, 2, 1, 1200));
  await recordBatchStage("recordInventory", "WILD-CATCH-003", inventoryData(1716400000, 1));
  await recordBatchStage("recordManufacturing", "WILD-CATCH-003", manufData("TORO-Seafood Processing 1", 1717600000, 1718800000, 1150, 2300, 40));
  await createLot("TORO-04", ["WILD-CATCH-003"], 2300, lotData("cá ngừ", 1720200000));
  await recordLotStage("recordWarehouse", "TORO-04", warehouseData("TORO-Cold Storage 3", 1719400000, 1719900000, 3));
  await recordLotStage("recordDistribution", "TORO-04", distData("TORO-Shipping 1", 1719900000, 1720100000));

  console.log("=== TRACE 5: WILD-CATCH-005 -> TORO-05 ===");
  await mintBatch("WILD-CATCH-005", sourceData(1, 1, "Bình Định", 1716336000, 1, 1, 1500));
  await recordBatchStage("recordInventory", "WILD-CATCH-005", inventoryData(1716595200, 1));
  await recordBatchStage("recordManufacturing", "WILD-CATCH-005", manufData("TORO-Seafood Processing 1", 1717977600, 1718841600, 1450, 2900, 45));
  await createLot("TORO-05", ["WILD-CATCH-005"], 2900, lotData("cá ngừ đóng hộp", 1719273600));
  await recordLotStage("recordWarehouse", "TORO-05", warehouseData("TORO-Cold Storage 2", 1718841600, 1719532800, -2));
  await recordLotStage("recordDistribution", "TORO-05", distData("TORO-Shipping 2", 1719532800, 1719705600));

  console.log("========================================");
  console.log("SEED COMPLETE");
  console.log(`Program: ${PROGRAM_ID.toBase58()}`);
  console.log("========================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
