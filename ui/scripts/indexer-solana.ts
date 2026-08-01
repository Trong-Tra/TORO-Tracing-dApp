/**
 * Solana indexer: reads TORO program events from devnet
 * and generates ui/src/data/traceIndex.json (same shape as the EVM indexer).
 *
 * Usage: npx tsx scripts/indexer-solana.ts [program-id] [rpc-url]
 * Defaults: program id from contracts/solana/target/idl/toro.json, devnet RPC.
 */

import * as anchor from "@anchor-lang/core";
import { decodeAbiParameters, parseAbiParameters } from "viem";
import * as fs from "fs";
import * as path from "path";

const { Connection, PublicKey } = anchor.web3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry an RPC call on 429 rate-limit with backoff, then pace subsequent calls. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const result = await fn();
      await sleep(800);
      return result;
    } catch (e: any) {
      if (attempt >= 10 || !String(e).includes("429")) throw e;
      const wait = 3000 * attempt;
      console.log(`  rate limited, retrying in ${wait}ms...`);
      await sleep(wait);
    }
  }
}

// ───────── Code Label Maps (identical to the EVM indexer) ─────────

const SOURCE_TYPE: Record<number, string> = { 1: "Vessel", 2: "Farm" };
const FISH_SPECIES: Record<number, string> = { 1: "Yellowfin", 2: "Skipjack", 3: "Bigeye" };
const FISHING_METHOD: Record<number, string> = {
  1: "Longline",
  2: "Purse Seine",
  3: "Handline",
  4: "Pole & Line",
  5: "Aquaculture",
};
const CATCH_AREA: Record<number, string> = {
  1: "Pacific Ocean",
  2: "Indian Ocean",
  3: "South China Sea",
};
const INVENTORY_LOC: Record<number, string> = {
  1: "Port Cold Storage",
  2: "Farm Holding Tank",
};

const CODE_LABELS: Record<number, string> = {
  0x100: "Source Type",
  0x101: "Fish Species",
  0x102: "Region",
  0x103: "Catch Date",
  0x104: "Fishing Method",
  0x105: "Catch Area",
  0x106: "Catch Weight (kg)",
  0x110: "Inventory Received",
  0x111: "Inventory Location",
  0x200: "Factory Name",
  0x204: "Production Date",
  0x205: "Packaging Date",
  0x208: "Input Weight (kg)",
  0x209: "Output Cans",
  0x20a: "Wastage (kg)",
  0x300: "Warehouse Name",
  0x304: "Storage Start",
  0x305: "Storage End",
  0x306: "Storage Temp (°C)",
  0x400: "Shipment Code",
  0x404: "Departure Date",
  0x405: "Arrival Date",
  0x501: "Product Label",
  0x504: "Packaging Date",
  0x600: "HACCP Certified",
};

const LOOKUP_MAPS: Record<number, Record<number, string>> = {
  0x100: SOURCE_TYPE,
  0x101: FISH_SPECIES,
  0x104: FISHING_METHOD,
  0x105: CATCH_AREA,
  0x111: INVENTORY_LOC,
};

// ───────── Decoding (identical to the EVM indexer) ─────────

function bytes32ToString(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const buf = Buffer.from(clean, "hex");
  let start = 0;
  while (start < buf.length && buf[start] === 0) start++;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf.slice(start)).replace(/\0/g, "");
  } catch {
    return "";
  }
}

function decodeValue(code: number, hex: string): string | number {
  const lookup = LOOKUP_MAPS[code];
  if (lookup) {
    const num = BigInt(hex);
    return lookup[Number(num)] || String(num);
  }

  if (code === 0x600) return "✓ Certified";

  // String fields
  if ([0x102, 0x200, 0x300, 0x400, 0x501].includes(code)) {
    const s = bytes32ToString(hex);
    if (s) return s;
  }

  // Dates
  if ([0x103, 0x110, 0x204, 0x205, 0x304, 0x305, 0x404, 0x405, 0x504].includes(code)) {
    const ts = Number(BigInt(hex));
    const d = new Date(ts * 1000);
    return d.toLocaleDateString("vi-VN");
  }

  // Signed temperature fields
  if (code === 0x306) {
    const n = BigInt(hex);
    const MAX = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    const signed = n > MAX ? n - BigInt("0x10000000000000000000000000000000000000000000000000000000000000000") : n;
    return Number(signed);
  }

  // Numbers
  const num = BigInt(hex);
  if (num > BigInt(1_000_000_000_000)) {
    return hex.slice(0, 10) + "..." + hex.slice(-8);
  }
  return Number(num).toLocaleString("en-US");
}

function decodeTraceData(hex: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  try {
    const decoded = decodeAbiParameters(
      parseAbiParameters("uint256[] codes, bytes32[] values"),
      hex as `0x${string}`
    );
    const codes = decoded[0] as bigint[];
    const values = decoded[1] as string[];
    for (let i = 0; i < codes.length; i++) {
      const code = Number(codes[i]);
      const label = CODE_LABELS[code] || `Code_0x${code.toString(16)}`;
      result[label] = decodeValue(code, values[i]);
    }
  } catch {
    // Fallback
  }
  return result;
}

function extractPackagingDate(hex: string): number {
  try {
    const decoded = decodeAbiParameters(
      parseAbiParameters("uint256[] codes, bytes32[] values"),
      hex as `0x${string}`
    );
    const codes = decoded[0] as bigint[];
    const values = decoded[1] as string[];
    for (let i = 0; i < codes.length; i++) {
      if (Number(codes[i]) === 0x504) return Number(BigInt(values[i]));
    }
  } catch {
    // ignore
  }
  return 0;
}

// ───────── Event → trace assembly ─────────

const bytes32ToUtf8 = (bytes: number[] | Uint8Array): string =>
  Buffer.from(bytes).toString("utf-8").replace(/\0/g, "");

const toHexBlob = (bytes: number[] | Uint8Array): string =>
  "0x" + Buffer.from(bytes).toString("hex");

const STAGE_NAMES_BATCH: Record<number, string> = { 1: "Source", 2: "Inventory", 3: "Manufacturing" };
const STAGE_NAMES_LOT: Record<number, string> = { 3: "Manufacturing", 4: "Warehouse", 5: "Distribution" };

type BatchEntry = { batchId: string; batchHash: string; sourceType: string; trace: any[] };
type LotEntry = {
  lotCode: string;
  totalCans: number;
  packagingDate: number;
  productLabel: string;
  batches: string[];
  lotTraces: any[];
};

async function main() {
  const idlPath = path.join(__dirname, "../../contracts/solana/target/idl/toro.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const programId = new PublicKey(process.argv[2] ?? idl.address);
  const rpcUrl = process.argv[3] ?? "https://api.devnet.solana.com";

  const connection = new Connection(rpcUrl, "confirmed");
  const coder = new anchor.BorshEventCoder(idl);

  console.log(`Indexing TORO program ${programId.toBase58()} on ${rpcUrl}...`);

  const sigs = await connection.getSignaturesForAddress(programId, { limit: 1000 });
  sigs.reverse(); // oldest first
  console.log(`Found ${sigs.length} transactions`);

  const batches = new Map<string, BatchEntry>(); // keyed by utf8 batch id
  const lots = new Map<string, LotEntry>(); // keyed by utf8 lot code

  for (const sigInfo of sigs) {
    const tx = await withRetry(() =>
      connection.getTransaction(sigInfo.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      })
    );
    if (!tx?.meta?.logMessages) continue;

    for (const log of tx.meta.logMessages) {
      if (!log.startsWith("Program data: ")) continue;
      let event: any;
      try {
        event = coder.decode(log.slice("Program data: ".length));
      } catch {
        continue;
      }
      if (!event) continue;

      const base = {
        txHash: sigInfo.signature,
        timestamp: Number(event.data.timestamp ?? tx.blockTime ?? 0),
        recorder: event.data.recorder?.toBase58?.() ?? String(event.data.recorder),
        blockNumber: tx.slot,
      };

      if (event.name === "BatchMinted") {
        const batchIdHex = toHexBlob(event.data.batch_id);
        const batchId = bytes32ToUtf8(event.data.batch_id);
        const dataHex = toHexBlob(event.data.data);
        const details = decodeTraceData(dataHex);
        batches.set(batchId, {
          batchId,
          batchHash: batchIdHex,
          sourceType: (details["Source Type"] as string) || "Unknown",
          trace: [{ stage: 1, stageName: "Source", ...base, details }],
        });
      } else if (event.name === "TraceRecorded") {
        const id = bytes32ToUtf8(event.data.id);
        const stage = Number(event.data.stage);
        const dataHex = toHexBlob(event.data.data);
        const details = decodeTraceData(dataHex);

        const batch = batches.get(id);
        if (batch) {
          if (stage === 1) continue; // mint already recorded via batchMinted
          batch.trace.push({
            stage,
            stageName: STAGE_NAMES_BATCH[stage] || `Stage ${stage}`,
            ...base,
            details,
          });
        } else {
          const lot = lots.get(id);
          if (lot && stage !== 3) {
            lot.lotTraces.push({
              stage,
              stageName: STAGE_NAMES_LOT[stage] || `Stage ${stage}`,
              ...base,
              details,
            });
          }
        }
      } else if (event.name === "LotCreated") {
        const lotCode = bytes32ToUtf8(event.data.lot_code);
        const dataHex = toHexBlob(event.data.data);
        const inputBatchIds = (event.data.input_batch_ids as number[][]).map(bytes32ToUtf8);
        lots.set(lotCode, {
          lotCode,
          totalCans: Number(event.data.total_cans),
          packagingDate: extractPackagingDate(dataHex),
          productLabel: dataHex,
          batches: inputBatchIds,
          lotTraces: [],
        });
      }
    }
  }

  const index: any = { lots: {}, batches: {} };
  for (const [code, lot] of lots) {
    index.lots[code] = {
      lotCode: lot.lotCode,
      totalCans: lot.totalCans,
      packagingDate: lot.packagingDate,
      productLabel: lot.productLabel,
      batches: lot.batches.map(
        (bId) => batches.get(bId) || { batchId: bId, batchHash: "", sourceType: "Unknown", trace: [] }
      ),
      lotTraces: lot.lotTraces.sort((a, b) => a.stage - b.stage),
    };
  }

  const outPath = path.join(__dirname, "../src/data/traceIndex.json");
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Lots: ${Object.keys(index.lots).length}, Batches: ${batches.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
