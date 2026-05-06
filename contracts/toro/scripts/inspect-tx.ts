#!/usr/bin/env node
/**
 * TORO — Inspect any transaction and decode its inline datums
 *
 * Usage:
 *   export BLOCKFROST_KEY="preview..."
 *   npx tsx scripts/inspect-tx.ts <txHash>
 *
 * Example:
 *   npx tsx scripts/inspect-tx.ts eca789f0602d513ca78c1154d406ac96404d4e224d084e778a80fa2769d0065b
 */

import { Data, Constr } from "@lucid-evolution/lucid";

const NETWORK = "preview";

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

function describeDatum(d: Constr<Data>): string {
  switch (d.index) {
    case 0: {
      const [batch, w, loc, date, sup] = d.fields as [string, bigint, string, string, string];
      return `HATCHERY          batch=${hexToUtf8(batch)} | ${w}kg eggs | loc=${hexToUtf8(loc)} | date=${hexToUtf8(date)} | sup=${hexToUtf8(sup)}`;
    }
    case 1: {
      const [prev, w, rate, pond, feed] = d.fields as [string, bigint, bigint, string, string];
      return `NURSERY           prev=${fmtTx(hexToUtf8(prev))} | ${w}kg fry | survival=${rate}% | pond=${hexToUtf8(pond)} | feed=${hexToUtf8(feed)}`;
    }
    case 2: {
      const [prev, w, dens, date, cert] = d.fields as [string, bigint, bigint, string, string];
      return `GROWOUT           prev=${fmtTx(hexToUtf8(prev))} | ${w}kg fish | density=${dens}/m³ | date=${hexToUtf8(date)} | cert=${hexToUtf8(cert)}`;
    }
    case 3: {
      const [prev, w, temp, truck, arrival] = d.fields as [string, bigint, bigint, string, string];
      return `HARVEST+TRANSPORT prev=${fmtTx(hexToUtf8(prev))} | ${w}kg shipped | ice=${temp}°C | truck=${hexToUtf8(truck)} | arrival=${hexToUtf8(arrival)}`;
    }
    case 4: {
      const [prev, input, cans, waste, sup] = d.fields as [string, bigint, bigint, bigint, string];
      return `FARM-PROCESSING   prev=${fmtTx(hexToUtf8(prev))} | ${input}kg in | ${cans}cans out | waste=${waste}kg | sup=${hexToUtf8(sup)}`;
    }
    case 5: {
      const [batch, w, loc, method, vessel, date] = d.fields as [string, bigint, string, string, string, string];
      return `CATCH+ICE         batch=${hexToUtf8(batch)} | ${w}kg catch | loc=${hexToUtf8(loc)} | method=${hexToUtf8(method)} | vessel=${hexToUtf8(vessel)} | date=${hexToUtf8(date)}`;
    }
    case 6: {
      const [prev, w, port, temp, cert] = d.fields as [string, bigint, string, bigint, string];
      return `PORT-LANDING      prev=${fmtTx(hexToUtf8(prev))} | ${w}kg landed | port=${hexToUtf8(port)} | temp=${temp}°C | cert=${hexToUtf8(cert)}`;
    }
    case 7: {
      const [prev, w, container, hours, cond] = d.fields as [string, bigint, string, bigint, string];
      return `TRANSPORT-PLANT   prev=${fmtTx(hexToUtf8(prev))} | ${w}kg shipped | container=${hexToUtf8(container)} | ${hours}h | cond=${hexToUtf8(cond)}`;
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

async function main() {
  const txHash = process.argv[2];
  const blockfrostKey = process.env.BLOCKFROST_KEY;

  if (!txHash || txHash.length !== 64) {
    console.error("Usage: npx tsx scripts/inspect-tx.ts <64-char txHash>");
    process.exit(1);
  }
  if (!blockfrostKey) {
    console.error("❌ Set BLOCKFROST_KEY env var");
    process.exit(1);
  }

  console.log(`Fetching tx ${txHash.slice(0, 16)}… from Blockfrost\n`);

  const url = `https://cardano-${NETWORK}.blockfrost.io/api/v0/txs/${txHash}/utxos`;
  const res = await fetch(url, { headers: { project_id: blockfrostKey } });

  if (!res.ok) {
    console.error(`❌ Blockfrost error: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();

  // Outputs with inline datums
  const outputsWithDatum = data.outputs?.filter((o: any) => o.inline_datum) || [];

  if (outputsWithDatum.length === 0) {
    console.log("No outputs with inline datum found in this transaction.");
    return;
  }

  console.log(`Found ${outputsWithDatum.length} output(s) with inline datum:\n`);

  for (const out of outputsWithDatum) {
    console.log(`─────────────────────────────────────────────────────────────`);
    console.log(`Address: ${out.address}`);
    console.log(`Amount:  ${JSON.stringify(out.amount)}`);

    const datumHex = out.inline_datum;
    console.log(`Datum (hex): ${datumHex.slice(0, 60)}…`);

    try {
      const decoded = Data.from(datumHex) as Constr<Data>;
      console.log(`\nDecoded:`);
      console.log(`  ${describeDatum(decoded)}`);
    } catch (e) {
      console.log(`\n⚠️ Could not decode datum: ${e}`);
    }
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
