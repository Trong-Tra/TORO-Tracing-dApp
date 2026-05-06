#!/usr/bin/env node
/**
 * TORO — Testnet Deploy Script (Preview)
 *
 * Uses your Lace wallet seed phrase + Blockfrost to deploy
 * the full TORO trace flow to Cardano Preview testnet.
 *
 * Two independent trace chains converge at final product:
 *   Station A (Farm):   Hatchery → Nursery → Growout → HarvestTransport → FarmProcessing
 *   Station B (Catch):  CatchIce → PortLanding → TransportPlant → CatchProcessing
 *   Final:              Product merge of both chains
 *
 * Required env vars:
 *   LACE_SEED="abandon abandon ..."   (24 words)
 *   BLOCKFROST_KEY="preview..."        (from blockfrost.io)
 */

import {
  Lucid,
  Blockfrost,
  Data,
  Constr,
  fromText,
  MintingPolicy,
  Script,
} from "@lucid-evolution/lucid";
import {
  validatorToAddress,
  mintingPolicyToId,
  getAddressDetails,
} from "@lucid-evolution/utils";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const NETWORK = "Preview" as const;
const MIN_ADA = 2_000_000n; // 2 ADA per script UTxO

// PlutusV2 always-succeeds script CBOR
const ALWAYS_TRUE_CBOR = "4e4d01000033222220051200120011";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Blueprint = {
  validators: Array<{
    title: string;
    compiledCode: string;
    hash: string;
  }>;
};

type DeployManifest = {
  network: string;
  timestamp: string;
  walletAddress: string;
  policyId: string;
  farmUsr: string;
  catchUsr: string;
  productUsr: string;
  traceScriptAddress: string;
  transactions: {
    mint: string;
    final: string;
  };
  explorerLinks: {
    policy: string;
    farmToken: string;
    catchToken: string;
    productToken: string;
    traceAddress: string;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadBlueprint(): Blueprint {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "plutus.json"), "utf8")
  );
}

function fmtTx(hash: string): string {
  return hash.slice(0, 16) + "…";
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForTx(
  lucid: { awaitTx: (txHash: string, checkInterval?: number) => Promise<boolean> },
  txHash: string,
  label: string
): Promise<void> {
  process.stdout.write(`  Waiting for ${label} (${fmtTx(txHash)}) …`);
  const start = Date.now();
  while (true) {
    try {
      await Promise.race([
        lucid.awaitTx(txHash, 1000),
        sleep(3000).then(() => {
          process.stdout.write(".");
          throw new Error("poll");
        }),
      ]);
      process.stdout.write(" ✓\n");
      await sleep(5000);
      return;
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "poll") throw e;
    }
    if (Date.now() - start > 300_000) {
      throw new Error(`Timeout waiting for ${label}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Datum constructors — match Aiken union constructor order
//   0 Hatchery | 1 Nursery | 2 Growout | 3 HarvestTransport | 4 FarmProcessing
//   5 CatchIce | 6 PortLanding | 7 TransportPlant | 8 CatchProcessing
//   9 FinalProduct
// ---------------------------------------------------------------------------

function mkHatchery(
  batchId: string,
  eggWeightKg: number,
  location: string,
  spawnDate: string,
  supplierHash: string
): Constr<Data> {
  return new Constr(0, [
    fromText(batchId),
    BigInt(eggWeightKg),
    fromText(location),
    fromText(spawnDate),
    fromText(supplierHash),
  ]);
}

function mkNursery(
  prevTx: string,
  fryWeightKg: number,
  survivalRatePct: number,
  pondId: string,
  feedTypeHash: string
): Constr<Data> {
  return new Constr(1, [
    fromText(prevTx),
    BigInt(fryWeightKg),
    BigInt(survivalRatePct),
    fromText(pondId),
    fromText(feedTypeHash),
  ]);
}

function mkGrowout(
  prevTx: string,
  fishWeightKg: number,
  densityPerM3: number,
  harvestDate: string,
  antibioticFreeCertHash: string
): Constr<Data> {
  return new Constr(2, [
    fromText(prevTx),
    BigInt(fishWeightKg),
    BigInt(densityPerM3),
    fromText(harvestDate),
    fromText(antibioticFreeCertHash),
  ]);
}

function mkHarvestTransport(
  prevTx: string,
  shippedWeightKg: number,
  iceTempC: number,
  truckId: string,
  arrivalTime: string
): Constr<Data> {
  return new Constr(3, [
    fromText(prevTx),
    BigInt(shippedWeightKg),
    BigInt(iceTempC),
    fromText(truckId),
    fromText(arrivalTime),
  ]);
}

function mkFarmProcessing(
  prevTx: string,
  inputWeightKg: number,
  outputCans: number,
  wastageKg: number,
  supervisorId: string
): Constr<Data> {
  return new Constr(4, [
    fromText(prevTx),
    BigInt(inputWeightKg),
    BigInt(outputCans),
    BigInt(wastageKg),
    fromText(supervisorId),
  ]);
}

function mkCatchIce(
  batchId: string,
  catchWeightKg: number,
  locationHash: string,
  fishingMethod: string,
  vesselId: string,
  catchDate: string
): Constr<Data> {
  return new Constr(5, [
    fromText(batchId),
    BigInt(catchWeightKg),
    fromText(locationHash),
    fromText(fishingMethod),
    fromText(vesselId),
    fromText(catchDate),
  ]);
}

function mkPortLanding(
  prevTx: string,
  landedWeightKg: number,
  portName: string,
  coldStorageTemp: number,
  qualityCertHash: string
): Constr<Data> {
  return new Constr(6, [
    fromText(prevTx),
    BigInt(landedWeightKg),
    fromText(portName),
    BigInt(coldStorageTemp),
    fromText(qualityCertHash),
  ]);
}

function mkTransportPlant(
  prevTx: string,
  shippedWeightKg: number,
  containerId: string,
  transitTimeHours: number,
  storageConditionHash: string
): Constr<Data> {
  return new Constr(7, [
    fromText(prevTx),
    BigInt(shippedWeightKg),
    fromText(containerId),
    BigInt(transitTimeHours),
    fromText(storageConditionHash),
  ]);
}

function mkCatchProcessing(
  prevTx: string,
  inputWeightKg: number,
  outputCans: number,
  wastageKg: number,
  supervisorId: string
): Constr<Data> {
  return new Constr(8, [
    fromText(prevTx),
    BigInt(inputWeightKg),
    BigInt(outputCans),
    BigInt(wastageKg),
    fromText(supervisorId),
  ]);
}

function mkFinalProduct(
  prevTxA: string,
  prevTxB: string,
  totalCans: number,
  farmCans: number,
  catchCans: number,
  batchLabel: string,
  packagingDate: string,
  distributionCenter: string
): Constr<Data> {
  return new Constr(9, [
    fromText(prevTxA),
    fromText(prevTxB),
    BigInt(totalCans),
    BigInt(farmCans),
    BigInt(catchCans),
    fromText(batchLabel),
    fromText(packagingDate),
    fromText(distributionCenter),
  ]);
}

// ---------------------------------------------------------------------------
// Pretty-print any TraceDatum
// ---------------------------------------------------------------------------

function describeDatum(d: Constr<Data>): string {
  switch (d.index) {
    case 0: {
      const [batch, w, loc, date, sup] = d.fields as [string, bigint, string, string, string];
      return `HATCHERY batch=${Buffer.from(batch, "hex").toString("utf8")} eggs=${w}kg loc=${Buffer.from(loc, "hex").toString("utf8")} date=${Buffer.from(date, "hex").toString("utf8")}`;
    }
    case 1: {
      const [prev, w, rate, pond, feed] = d.fields as [string, bigint, bigint, string, string];
      return `NURSERY prev=${fmtTx(Buffer.from(prev, "hex").toString("utf8"))} fry=${w}kg survival=${rate}% pond=${Buffer.from(pond, "hex").toString("utf8")}`;
    }
    case 2: {
      const [prev, w, dens, date, cert] = d.fields as [string, bigint, bigint, string, string];
      return `GROWOUT prev=${fmtTx(Buffer.from(prev, "hex").toString("utf8"))} fish=${w}kg density=${dens}/m³ date=${Buffer.from(date, "hex").toString("utf8")}`;
    }
    case 3: {
      const [prev, w, temp, truck, arrival] = d.fields as [string, bigint, bigint, string, string];
      return `HARVEST+TRANSPORT prev=${fmtTx(Buffer.from(prev, "hex").toString("utf8"))} shipped=${w}kg ice=${temp}°C truck=${Buffer.from(truck, "hex").toString("utf8")}`;
    }
    case 4: {
      const [prev, input, cans, waste, sup] = d.fields as [string, bigint, bigint, bigint, string];
      return `FARM-PROCESS prev=${fmtTx(Buffer.from(prev, "hex").toString("utf8"))} in=${input}kg out=${cans}cans waste=${waste}kg sup=${Buffer.from(sup, "hex").toString("utf8")}`;
    }
    case 5: {
      const [batch, w, loc, method, vessel, date] = d.fields as [string, bigint, string, string, string, string];
      return `CATCH+ICE batch=${Buffer.from(batch, "hex").toString("utf8")} catch=${w}kg method=${Buffer.from(method, "hex").toString("utf8")} vessel=${Buffer.from(vessel, "hex").toString("utf8")} date=${Buffer.from(date, "hex").toString("utf8")}`;
    }
    case 6: {
      const [prev, w, port, temp, cert] = d.fields as [string, bigint, string, bigint, string];
      return `PORT-LANDING prev=${fmtTx(Buffer.from(prev, "hex").toString("utf8"))} landed=${w}kg port=${Buffer.from(port, "hex").toString("utf8")} temp=${temp}°C`;
    }
    case 7: {
      const [prev, w, container, hours, cond] = d.fields as [string, bigint, string, bigint, string];
      return `TRANSPORT-PLANT prev=${fmtTx(Buffer.from(prev, "hex").toString("utf8"))} shipped=${w}kg container=${Buffer.from(container, "hex").toString("utf8")} time=${hours}h`;
    }
    case 8: {
      const [prev, input, cans, waste, sup] = d.fields as [string, bigint, bigint, bigint, string];
      return `CATCH-PROCESS prev=${fmtTx(Buffer.from(prev, "hex").toString("utf8"))} in=${input}kg out=${cans}cans waste=${waste}kg sup=${Buffer.from(sup, "hex").toString("utf8")}`;
    }
    case 9: {
      const [prevA, prevB, total, farm, catchCans, label, date, center] = d.fields as [string, string, bigint, bigint, bigint, string, string, string];
      return `FINAL-PRODUCT total=${total}cans (farm=${farm} + catch=${catchCans}) label=${Buffer.from(label, "hex").toString("utf8")} date=${Buffer.from(date, "hex").toString("utf8")} dist=${Buffer.from(center, "hex").toString("utf8")}`;
    }
    default:
      return `Unknown constructor ${d.index}`;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  TORO — Preview Testnet Deploy");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const seedPhrase = process.env.LACE_SEED;
  const blockfrostKey = process.env.BLOCKFROST_KEY;

  if (!seedPhrase) {
    console.error(
      "❌ Set LACE_SEED env var (24 words from Lace Settings → Show Recovery Phrase)"
    );
    process.exit(1);
  }
  if (!blockfrostKey) {
    console.error(
      "❌ Set BLOCKFROST_KEY env var (get free at https://blockfrost.io)"
    );
    process.exit(1);
  }

  // --- Lucid setup ----------------------------------------------------------
  const lucid = await Lucid(
    new Blockfrost(
      `https://cardano-preview.blockfrost.io/api/v0`,
      blockfrostKey
    ),
    NETWORK
  );
  lucid.selectWallet.fromSeed(seedPhrase);

  const walletAddr = await lucid.wallet().address();
  const walletPkh = getAddressDetails(walletAddr).paymentCredential!.hash;
  console.log("Wallet address:", walletAddr);
  console.log("Wallet PKH:    ", walletPkh);

  const utxos = await lucid.wallet().getUtxos();
  const lovelace = utxos.reduce((sum, u) => sum + u.assets.lovelace, 0n);
  console.log("Wallet balance:", Number(lovelace / 1_000_000n), "ADA\n");

  if (lovelace < 30_000_000n) {
    console.error("❌ Need at least 30 ADA for fees + script deposits");
    process.exit(1);
  }

  // --- Ensure collateral UTxO exists (pure ADA, required for PlutusV3) -------
  const hasCollateral = utxos.some(
    (u) => u.assets.lovelace >= 5_000_000n && Object.keys(u.assets).length === 1
  );
  if (!hasCollateral) {
    console.log("▶ Creating collateral UTxO (5 ADA) ────────────────────────────");
    const txCol = await lucid
      .newTx()
      .pay.ToAddress(walletAddr, { lovelace: 5_000_000n })
      .complete();
    const signedCol = await txCol.sign.withWallet().complete();
    const colHash = await signedCol.submit();
    await waitForTx(lucid, colHash, "collateral");
    console.log("  Collateral tx", fmtTx(colHash), " — 5 ADA UTxO ready\n");
  }

  // --- Load minting policy --------------------------------------------------
  const blueprint = loadBlueprint();
  const mintV = blueprint.validators.find((v) => v.title === "toro.toro.mint");
  if (!mintV) {
    console.error("❌ Mint validator not found. Run ./build.sh first.");
    process.exit(1);
  }

  const mintScript: MintingPolicy = { type: "PlutusV3", script: mintV.compiledCode };
  const policyId = mintingPolicyToId(mintScript);

  // --- Asset names ----------------------------------------------------------
  // Unique nonce per deploy to avoid UTxO collisions from previous attempts
  const nonce = Date.now().toString(36).toUpperCase();
  const farmBatch = fromText(`TORO-FARM-${nonce}`);
  const catchBatch = fromText(`TORO-CATCH-${nonce}`);
  const productBatch = fromText(`TORO-PRODUCT-${nonce}`);

  const farmRef = policyId + "000643b0" + farmBatch;
  const farmUsr = policyId + "000de140" + farmBatch;
  const catchRef = policyId + "000643b0" + catchBatch;
  const catchUsr = policyId + "000de140" + catchBatch;
  const productRef = policyId + "000643b0" + productBatch;
  const productUsr = policyId + "000de140" + productBatch;

  console.log("Policy ID:", policyId);
  console.log("Farm:     TORO-FARM-" + nonce);
  console.log("Catch:    TORO-CATCH-" + nonce);
  console.log("Product:  TORO-PRODUCT-" + nonce + "\n");

  // --- Script address -------------------------------------------------------
  const traceScript: Script = { type: "PlutusV2", script: ALWAYS_TRUE_CBOR };
  const traceAddr = validatorToAddress(NETWORK, traceScript);
  console.log("Trace script address:", traceAddr, "\n");

  // --- Stage helper (testnet version) ---------------------------------------
  async function advanceTrace(
    asset: string,
    prevHash: string,
    datum: Constr<Data>,
    label: string
  ): Promise<string> {
    // Retry UTxO lookup until Blockfrost indexes it
    let prevUtxo;
    for (let i = 0; i < 20; i++) {
      const utxosAtScript = await lucid.utxosAt(traceAddr);
      prevUtxo = utxosAtScript.find((u) => u.assets[asset] === 1n);
      if (prevUtxo) break;
      process.stdout.write(".");
      await sleep(3000);
    }
    if (!prevUtxo) {
      throw new Error(`Could not find UTxO with asset ${asset.slice(0, 20)}… at script address`);
    }

    const tx = await lucid
      .newTx()
      .collectFrom([prevUtxo], Data.void())
      .pay.ToContract(
        traceAddr,
        { kind: "inline", value: Data.to(datum) },
        { lovelace: MIN_ADA, [asset]: 1n }
      )
      .attach.SpendingValidator(traceScript)
      .complete();
    const signed = await tx.sign.withWallet().complete();
    const hash = await signed.submit();
    await waitForTx(lucid, hash, label);
    console.log(`  ${label.padEnd(14)} ${fmtTx(hash)} — ${describeDatum(datum)}`);
    return hash;
  }

  // -------------------------------------------------------------------------
  // 1. FACTORY — Mint Farm + Catch CIP-68 pairs
  // -------------------------------------------------------------------------
  console.log("▶ 1. FACTORY — Mint Farm + Catch pairs ────────────────────────");

  const txMint = await lucid
    .newTx()
    .mintAssets(
      {
        [farmRef]: 1n,
        [farmUsr]: 1n,
        [catchRef]: 1n,
        [catchUsr]: 1n,
      },
      Data.void()
    )
    .attach.MintingPolicy(mintScript)
    .pay.ToContract(
      traceAddr,
      {
        kind: "inline",
        value: Data.to(
          mkHatchery("TORO-FARM-001", 500, "Thailand Hatchery 01", "2026-05-01", "QmSupplierProfile123")
        ),
      },
      { lovelace: MIN_ADA, [farmRef]: 1n }
    )
    .pay.ToContract(
      traceAddr,
      {
        kind: "inline",
        value: Data.to(
          mkCatchIce("TORO-CATCH-001", 800, "QmLatLonHash789", "long-line", "FV-Pacific-07", "2026-05-02")
        ),
      },
      { lovelace: MIN_ADA, [catchRef]: 1n }
    )
    .pay.ToAddress(walletAddr, { [farmUsr]: 1n, [catchUsr]: 1n })
    .complete();
  const signedMint = await txMint.sign.withWallet().complete();
  const mintHash = await signedMint.submit();
  await waitForTx(lucid, mintHash, "mint");
  console.log("  Mint tx      ", fmtTx(mintHash), " — Farm + Catch pairs created\n");

  // -------------------------------------------------------------------------
  // 2. STATION A — Farm trace
  // -------------------------------------------------------------------------
  console.log("▶ 2. STATION A — Farm trace chain ─────────────────────────────");

  let a = await advanceTrace(
    farmRef,
    mintHash,
    mkNursery(mintHash, 450, 90, "Pond-A-07", "QmFeedType456"),
    "A2 Nursery"
  );

  a = await advanceTrace(
    farmRef,
    a,
    mkGrowout(a, 2000, 25, "2026-08-15", "QmAntibioticFreeCert"),
    "A3 Growout"
  );

  a = await advanceTrace(
    farmRef,
    a,
    mkHarvestTransport(a, 1950, 0, "TRUCK-A-42", "2026-08-16T06:00:00Z"),
    "A4 Harvest"
  );

  a = await advanceTrace(
    farmRef,
    a,
    mkFarmProcessing(a, 1950, 3900, 50, "SUPER-A-01"),
    "A5 Process"
  );

  // -------------------------------------------------------------------------
  // 3. STATION B — Catch trace
  // -------------------------------------------------------------------------
  console.log("\n▶ 3. STATION B — Catch trace chain ────────────────────────────");

  let b = await advanceTrace(
    catchRef,
    mintHash,
    mkPortLanding(mintHash, 780, "Songkhla Port", 2, "QmQualityCertABC"),
    "B2 Port"
  );

  b = await advanceTrace(
    catchRef,
    b,
    mkTransportPlant(b, 770, "CONT-B-99", 12, "QmStorageCondXYZ"),
    "B3 Transport"
  );

  b = await advanceTrace(
    catchRef,
    b,
    mkCatchProcessing(b, 770, 1540, 30, "SUPER-B-02"),
    "B4 Process"
  );

  // -------------------------------------------------------------------------
  // 4. FINAL — Merge + Product mint
  // -------------------------------------------------------------------------
  console.log("\n▶ 4. FINAL — Merge Farm + Catch → Product ─────────────────────");

  // Retry UTxO lookup for final merge
  let farmUtxo, catchUtxo;
  for (let i = 0; i < 20; i++) {
    const scriptUtxos = await lucid.utxosAt(traceAddr);
    farmUtxo = scriptUtxos.find((u) => u.assets[farmRef] === 1n);
    catchUtxo = scriptUtxos.find((u) => u.assets[catchRef] === 1n);
    if (farmUtxo && catchUtxo) break;
    process.stdout.write(".");
    await sleep(3000);
  }
  if (!farmUtxo || !catchUtxo) {
    throw new Error("Could not find farm or catch UTxOs for final merge");
  }

  const finalDatum = mkFinalProduct(
    a,
    b,
    5440,
    3900,
    1540,
    "TORO-PREMIUM-TUNA-001",
    "2026-08-17",
    "Bangkok Distribution Center"
  );

  const txFinal = await lucid
    .newTx()
    .mintAssets({ [productRef]: 1n, [productUsr]: 1n }, Data.void())
    .attach.MintingPolicy(mintScript)
    .collectFrom(farmUtxo ? [farmUtxo] : [], Data.void())
    .collectFrom(catchUtxo ? [catchUtxo] : [], Data.void())
    .pay.ToContract(
      traceAddr,
      { kind: "inline", value: Data.to(finalDatum) },
      { lovelace: MIN_ADA, [productRef]: 1n }
    )
    .pay.ToAddress(walletAddr, { [productUsr]: 1n })
    .attach.SpendingValidator(traceScript)
    .complete();
  const signedFinal = await txFinal.sign.withWallet().complete();
  const finalHash = await signedFinal.submit();
  await waitForTx(lucid, finalHash, "final");
  console.log("  FINAL        ", fmtTx(finalHash), " — ", describeDatum(finalDatum));

  // -------------------------------------------------------------------------
  // Save deployment manifest
  // -------------------------------------------------------------------------
  const manifest: DeployManifest = {
    network: NETWORK,
    timestamp: new Date().toISOString(),
    walletAddress: walletAddr,
    policyId,
    farmUsr,
    catchUsr,
    productUsr,
    traceScriptAddress: traceAddr,
    transactions: {
      mint: mintHash,
      final: finalHash,
    },
    explorerLinks: {
      policy: `https://preview.cardanoscan.io/tokenPolicy/${policyId}`,
      farmToken: `https://preview.cardanoscan.io/token/${farmUsr}`,
      catchToken: `https://preview.cardanoscan.io/token/${catchUsr}`,
      productToken: `https://preview.cardanoscan.io/token/${productUsr}`,
      traceAddress: `https://preview.cardanoscan.io/address/${traceAddr}`,
    },
  };

  const manifestPath = path.join(__dirname, "..", "deploy-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Testnet Deploy Complete");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("  Manifest saved to: deploy-manifest.json");
  console.log("");
  console.log("  Block Explorer (Preview):");
  console.log("    Policy:      https://preview.cardanoscan.io/tokenPolicy/" + policyId);
  console.log("    Farm Token:  https://preview.cardanoscan.io/token/" + farmUsr);
  console.log("    Catch Token: https://preview.cardanoscan.io/token/" + catchUsr);
  console.log("    Product:     https://preview.cardanoscan.io/token/" + productUsr);
  console.log("    Script:      https://preview.cardanoscan.io/address/" + traceAddr);
  console.log("");
  console.log("  Trace History (9 transactions):");
  console.log("    1. Mint      — Factory: Hatchery + Catch&Ice pairs created");
  console.log("    2. A2        — Nursery: 450 kg fry (90% survival)");
  console.log("    3. A3        — Growout: 2,000 kg adult fish");
  console.log("    4. A4        — Harvest+Transport: 1,950 kg shipped");
  console.log("    5. A5        — Farm Processing: 3,900 cans");
  console.log("    6. B2        — Port Landing: 780 kg at Songkhla");
  console.log("    7. B3        — Transport to Plant: 770 kg, 12h");
  console.log("    8. B4        — Catch Processing: 1,540 cans");
  console.log("    9. FINAL     — Merge: 5,440 cans total product");
  console.log("");
  console.log("  ✓ All transactions submitted and confirmed on Preview testnet");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((e: unknown) => {
  console.error("\n❌ Deploy failed:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
