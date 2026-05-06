#!/usr/bin/env node
/**
 * TORO — Query and decode all TraceDatum from the script address
 *
 * Usage:
 *   export BLOCKFROST_KEY="preview..."
 *   npx tsx scripts/query-datums.ts
 */

import { Lucid, Blockfrost, Data, Constr } from "@lucid-evolution/lucid";
import * as fs from "fs";
import * as path from "path";

const NETWORK = "Preview" as const;
const SCRIPT_ADDR = "addr_test1wpunlryvl7aqsxe22erzlsseej87v5kk5vutvtrmzdy8dect48z0w";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadManifest(): any {
  const p = path.join(__dirname, "..", "deploy-manifest.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function hexToUtf8(hex: string): string {
  try {
    return Buffer.from(hex, "hex").toString("utf8");
  } catch {
    return hex;
  }
}

function fmtTx(hash: string): string {
  return hash.slice(0, 16) + "…";
}

// ---------------------------------------------------------------------------
// Decode any TraceDatum
// ---------------------------------------------------------------------------

function describeDatum(d: Constr<Data>, txHash: string): string {
  switch (d.index) {
    case 0: {
      const [batch, w, loc, date, sup] = d.fields as [string, bigint, string, string, string];
      return `HATCHERY          batch=${hexToUtf8(batch)} | ${w}kg eggs | loc=${hexToUtf8(loc)} | date=${hexToUtf8(date)}`;
    }
    case 1: {
      const [prev, w, rate, pond, feed] = d.fields as [string, bigint, bigint, string, string];
      return `NURSERY           prev=${fmtTx(hexToUtf8(prev))} | ${w}kg fry | survival=${rate}% | pond=${hexToUtf8(pond)}`;
    }
    case 2: {
      const [prev, w, dens, date, cert] = d.fields as [string, bigint, bigint, string, string];
      return `GROWOUT           prev=${fmtTx(hexToUtf8(prev))} | ${w}kg fish | density=${dens}/m³ | date=${hexToUtf8(date)}`;
    }
    case 3: {
      const [prev, w, temp, truck, arrival] = d.fields as [string, bigint, bigint, string, string];
      return `HARVEST+TRANSPORT prev=${fmtTx(hexToUtf8(prev))} | ${w}kg shipped | ice=${temp}°C | truck=${hexToUtf8(truck)}`;
    }
    case 4: {
      const [prev, input, cans, waste, sup] = d.fields as [string, bigint, bigint, bigint, string];
      return `FARM-PROCESSING   prev=${fmtTx(hexToUtf8(prev))} | ${input}kg in | ${cans}cans out | waste=${waste}kg | sup=${hexToUtf8(sup)}`;
    }
    case 5: {
      const [batch, w, loc, method, vessel, date] = d.fields as [string, bigint, string, string, string, string];
      return `CATCH+ICE         batch=${hexToUtf8(batch)} | ${w}kg catch | method=${hexToUtf8(method)} | vessel=${hexToUtf8(vessel)} | date=${hexToUtf8(date)}`;
    }
    case 6: {
      const [prev, w, port, temp, cert] = d.fields as [string, bigint, string, bigint, string];
      return `PORT-LANDING      prev=${fmtTx(hexToUtf8(prev))} | ${w}kg landed | port=${hexToUtf8(port)} | temp=${temp}°C`;
    }
    case 7: {
      const [prev, w, container, hours, cond] = d.fields as [string, bigint, string, bigint, string];
      return `TRANSPORT-PLANT   prev=${fmtTx(hexToUtf8(prev))} | ${w}kg shipped | container=${hexToUtf8(container)} | ${hours}h transit`;
    }
    case 8: {
      const [prev, input, cans, waste, sup] = d.fields as [string, bigint, bigint, bigint, string];
      return `CATCH-PROCESSING  prev=${fmtTx(hexToUtf8(prev))} | ${input}kg in | ${cans}cans out | waste=${waste}kg | sup=${hexToUtf8(sup)}`;
    }
    case 9: {
      const [prevA, prevB, total, farm, catchCans, label, date, center] = d.fields as [string, string, bigint, bigint, bigint, string, string, string];
      return `FINAL-PRODUCT     total=${total}cans (farm=${farm} + catch=${catchCans}) | label=${hexToUtf8(label)} | date=${hexToUtf8(date)} | dist=${hexToUtf8(center)}`;
    }
    default:
      return `UNKNOWN constructor ${d.index}`;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const blockfrostKey = process.env.BLOCKFROST_KEY;
  if (!blockfrostKey) {
    console.error("❌ Set BLOCKFROST_KEY env var");
    process.exit(1);
  }

  const lucid = await Lucid(
    new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", blockfrostKey),
    NETWORK
  );

  const manifest = loadManifest();
  if (manifest) {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  TORO — On-Chain Trace Data Query");
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("Policy:   ", manifest.policyId);
    console.log("Network:  ", manifest.network);
    console.log("Script:   ", manifest.traceScriptAddress);
    console.log("");
  }

  console.log("Fetching UTxOs at script address...\n");
  const utxos = await lucid.utxosAt(SCRIPT_ADDR);

  if (utxos.length === 0) {
    console.log("No UTxOs found at script address.");
    return;
  }

  // Filter UTxOs that have ref tokens (000643b0 prefix) and inline datums
  // Only show UTxOs matching the deployed manifest policy (latest deploy)
  const policyId = manifest?.policyId;
  const refUtxos = utxos.filter((u) => {
    const hasRef = Object.keys(u.assets).some(
      (asset) => asset.includes("000643b0") && (policyId ? asset.startsWith(policyId) : true)
    );
    return hasRef && u.datum;
  });

  console.log(`Found ${refUtxos.length} ref-token UTxO(s) with inline datums:\n`);

  for (const utxo of refUtxos) {
    const refAsset = Object.keys(utxo.assets).find(
      (a) => a.includes("000643b0") && (policyId ? a.startsWith(policyId) : true)
    );
    const datum = Data.from(utxo.datum!) as Constr<Data>;
    const assetNameHex = refAsset ? refAsset.slice(56 + 8) : "";
    const assetName = hexToUtf8(assetNameHex);
    console.log(`Tx: ${fmtTx(utxo.txHash)} | Asset: ${assetName}`);
    console.log(`  → ${describeDatum(datum, utxo.txHash)}`);
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Tip: Paste the full tx hash into preview.cardanoscan.io");
  console.log("       to see the full UTxO with inline datum.");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
