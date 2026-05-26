#!/usr/bin/env node
/**
 * TORO — CIP-68 Traceable Supply Chain Mock Flow
 *
 * Two independent trace chains converge at final product:
 *   Station A (Farm):   Hatchery → Nursery → Growout → HarvestTransport → FarmProcessing
 *   Station B (Catch):  CatchIce → PortLanding → TransportPlant → CatchProcessing
 *   Final:              Product merge of both chains
 *
 * Uses Lucid emulator. Each stage writes a typed TraceDatum as inline datum.
 */

import {
  Lucid,
  Emulator,
  Data,
  Constr,
  fromText,
  generateEmulatorAccount,
  UTxO,
  Script,
  MintingPolicy,
} from "@lucid-evolution/lucid";
import {
  validatorToAddress,
  mintingPolicyToId,
  getAddressDetails,
} from "@lucid-evolution/utils";
import * as fs from "fs";
import * as path from "path";

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
  console.log("  TORO — CIP-68 Traceable Supply Chain Mock Flow");
  console.log("  Farm + Catch → Final Product");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // --- Setup ----------------------------------------------------------------
  const deployer = generateEmulatorAccount({ lovelace: 100_000_000_000n });
  const emu = new Emulator([deployer]);
  const lucid = await Lucid(emu, "Custom");
  lucid.selectWallet.fromSeed(deployer.seedPhrase);

  const deployerAddr = await lucid.wallet().address();
  const deployerPkh = getAddressDetails(deployerAddr).paymentCredential!.hash;
  console.log("Deployer:", deployerAddr);
  console.log("PKH:     ", deployerPkh, "\n");

  // --- Load Aiken minting policy --------------------------------------------
  const blueprint = loadBlueprint();
  const mintV = blueprint.validators.find((v) => v.title === "toro.toro.mint");
  if (!mintV) {
    console.error("Mint validator not found. Run ./build.sh first.");
    process.exit(1);
  }

  const mintScript: MintingPolicy = { type: "PlutusV3", script: mintV.compiledCode };
  const policyId = mintingPolicyToId(mintScript);

  // --- Asset names ----------------------------------------------------------
  const farmBatch = fromText("TORO-FARM-001");
  const catchBatch = fromText("TORO-CATCH-001");
  const productBatch = fromText("TORO-PRODUCT-001");

  const farmRef = policyId + "000643b0" + farmBatch;
  const farmUsr = policyId + "000de140" + farmBatch;
  const catchRef = policyId + "000643b0" + catchBatch;
  const catchUsr = policyId + "000de140" + catchBatch;
  const productRef = policyId + "000643b0" + productBatch;
  const productUsr = policyId + "000de140" + productBatch;

  console.log("Policy ID:", policyId);
  console.log("Farm:     ", "TORO-FARM-001");
  console.log("Catch:    ", "TORO-CATCH-001");
  console.log("Product:  ", "TORO-PRODUCT-001\n");

  // --- Script address -------------------------------------------------------
  const alwaysTrueCbor = "4e4d01000033222220051200120011";
  const traceScript: Script = { type: "PlutusV2", script: alwaysTrueCbor };
  const traceAddr = validatorToAddress("Custom", traceScript);
  console.log("Trace script address:", traceAddr, "\n");

  // --- Stage helper ---------------------------------------------------------
  async function advanceTrace(
    asset: string,
    prevHash: string,
    datum: Constr<Data>,
    label: string
  ): Promise<string> {
    const utxos = await lucid.utxosAt(traceAddr);
    const prevUtxo = utxos.find((u) => u.assets[asset] === 1n);

    const tx = await lucid
      .newTx()
      .collectFrom(prevUtxo ? [prevUtxo] : [], Data.void())
      .pay.ToContract(
        traceAddr,
        { kind: "inline", value: Data.to(datum) },
        { lovelace: 2_000_000n, [asset]: 1n }
      )
      .attach.SpendingValidator(traceScript)
      .complete();
    const signed = await tx.sign.withWallet().complete();
    const hash = await signed.submit();
    emu.awaitBlock(1);
    console.log(`  ${label.padEnd(14)} ${fmtTx(hash)} — ${describeDatum(datum)}`);
    return hash;
  }

  // -------------------------------------------------------------------------
  // 1. FACTORY — Mint Farm + Catch CIP-68 pairs
  // -------------------------------------------------------------------------
  console.log("▶ FACTORY — Mint Farm + Catch pairs ───────────────────────────");

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
      { lovelace: 2_000_000n, [farmRef]: 1n }
    )
    .pay.ToContract(
      traceAddr,
      {
        kind: "inline",
        value: Data.to(
          mkCatchIce("TORO-CATCH-001", 800, "QmLatLonHash789", "long-line", "FV-Pacific-07", "2026-05-02")
        ),
      },
      { lovelace: 2_000_000n, [catchRef]: 1n }
    )
    .pay.ToAddress(deployerAddr, { [farmUsr]: 1n, [catchUsr]: 1n })
    .complete();
  const signedMint = await txMint.sign.withWallet().complete();
  const mintHash = await signedMint.submit();
  emu.awaitBlock(1);
  console.log("  Mint tx      ", fmtTx(mintHash), " — Farm + Catch pairs created\n");

  // -------------------------------------------------------------------------
  // 2. STATION A — Farm trace
  // -------------------------------------------------------------------------
  console.log("▶ STATION A — Farm trace chain ────────────────────────────────");

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
  console.log("\n▶ STATION B — Catch trace chain ───────────────────────────────");

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
  console.log("\n▶ FINAL — Merge Farm + Catch → Product ────────────────────────");

  const farmUtxos = await lucid.utxosAt(traceAddr);
  const farmUtxo = farmUtxos.find((u) => u.assets[farmRef] === 1n);
  const catchUtxo = farmUtxos.find((u) => u.assets[catchRef] === 1n);

  const finalDatum = mkFinalProduct(
    a,
    b,
    5440, // 3900 + 1540
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
      { lovelace: 2_000_000n, [productRef]: 1n }
    )
    .pay.ToAddress(deployerAddr, { [productUsr]: 1n })
    .attach.SpendingValidator(traceScript)
    .complete();
  const signedFinal = await txFinal.sign.withWallet().complete();
  const finalHash = await signedFinal.submit();
  emu.awaitBlock(1);
  console.log("  FINAL        ", fmtTx(finalHash), " — ", describeDatum(finalDatum));

  // -------------------------------------------------------------------------
  // Verification
  // -------------------------------------------------------------------------
  console.log("\n▶ Verification ────────────────────────────────────────────────");

  const traceUtxos = await lucid.utxosAt(traceAddr);
  console.log("  Ref-token UTxOs at trace address:", traceUtxos.length);

  const walletUtxos = await lucid.wallet().getUtxos();
  const farmQty = walletUtxos.reduce((sum, u) => sum + (u.assets[farmUsr] || 0n), 0n);
  const catchQty = walletUtxos.reduce((sum, u) => sum + (u.assets[catchUsr] || 0n), 0n);
  const productQty = walletUtxos.reduce((sum, u) => sum + (u.assets[productUsr] || 0n), 0n);
  console.log("  Farm user tokens:   ", Number(farmQty));
  console.log("  Catch user tokens:  ", Number(catchQty));
  console.log("  Product user tokens:", Number(productQty));

  const finalUtxo = traceUtxos.find((u) => u.assets[productRef] === 1n);
  if (finalUtxo && finalUtxo.datum) {
    const d = Data.from(finalUtxo.datum) as Constr<Data>;
    console.log("  Final datum:        ", describeDatum(d));
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Investor Demo Summary");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("  Assets:");
  console.log("    Farm user:   ", farmUsr);
  console.log("    Catch user:  ", catchUsr);
  console.log("    Product user:", productUsr);
  console.log("    Policy:      ", policyId);
  console.log("");
  console.log("  Trace History (10 transactions):");
  console.log("    1.  Mint      — Factory: Hatchery + Catch&Ice pairs created");
  console.log("    2.  A2        — Nursery: 450 kg fry (90% survival)");
  console.log("    3.  A3        — Growout: 2,000 kg adult fish");
  console.log("    4.  A4        — Harvest+Transport: 1,950 kg shipped");
  console.log("    5.  A5        — Farm Processing: 3,900 cans");
  console.log("    6.  B2        — Port Landing: 780 kg at Songkhla");
  console.log("    7.  B3        — Transport to Plant: 770 kg, 12h");
  console.log("    8.  B4        — Catch Processing: 1,540 cans");
  console.log("    9.  FINAL     — Merge: 5,440 cans total product");
  console.log("");
  console.log("  Each ref-token UTxO carries a typed TraceDatum as inline datum.");
  console.log("");
  console.log("  ✓ Flow complete — ready for UI design");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
