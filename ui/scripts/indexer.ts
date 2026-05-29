/**
 * Indexer script: reads ToroRegistry events from Arbitrum Sepolia
 * and generates ui/src/data/traceIndex.json
 *
 * Usage: npx tsx scripts/indexer.ts <contract-address> [from-block]
 */

import { createPublicClient, http, decodeAbiParameters, parseAbiParameters } from "viem";

const arbitrumSepolia = {
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arbitrum-sepolia-rpc.publicnode.com"] },
    public: { http: ["https://arbitrum-sepolia-rpc.publicnode.com"] },
  },
} as const;

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

// ───────── Code Label Maps ─────────

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

// ───────── Decoding ─────────

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

// ───────── Event Fetching ─────────

const REGISTRY_ABI = [
  {
    name: "BatchMinted",
    type: "event",
    inputs: [
      { indexed: true, name: "batchId", type: "bytes32" },
      { name: "data", type: "bytes" },
      { name: "timestamp", type: "uint256" },
      { indexed: true, name: "recorder", type: "address" },
    ],
  },
  {
    name: "TraceRecorded",
    type: "event",
    inputs: [
      { indexed: true, name: "id", type: "bytes32" },
      { indexed: true, name: "stage", type: "uint8" },
      { name: "data", type: "bytes" },
      { name: "timestamp", type: "uint256" },
      { indexed: true, name: "recorder", type: "address" },
    ],
  },
  {
    name: "LotCreated",
    type: "event",
    inputs: [
      { indexed: true, name: "lotCode", type: "bytes32" },
      { name: "inputBatchIds", type: "bytes32[]" },
      { name: "totalCans", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "timestamp", type: "uint256" },
      { indexed: true, name: "recorder", type: "address" },
    ],
  },
];

const CHUNK = BigInt(40000);

async function fetchEvents(contract: `0x${string}`, fromBlock: bigint) {
  const latest = await client.getBlockNumber();
  console.log(`Indexing from block ${fromBlock} to ${latest}...`);

  const allLogs: any[] = [];
  let from = fromBlock;
  while (from <= latest) {
    const to = from + CHUNK < latest ? from + CHUNK : latest;
    const chunk = await client.getContractEvents({
      address: contract,
      abi: REGISTRY_ABI,
      fromBlock: from,
      toBlock: to,
    });
    allLogs.push(...chunk);
    console.log(`  Chunk ${from}-${to}: ${chunk.length} events`);
    from = to + BigInt(1);
  }
  const logs = allLogs;
  console.log(`Total events: ${logs.length}`);

  const txs = new Map<string, { blockNumber: bigint; timestamp: number; recorder: string }>();
  for (const log of logs) {
    const txHash = log.transactionHash!;
    if (!txs.has(txHash)) {
      const receipt = await client.getTransactionReceipt({ hash: txHash });
      const block = await client.getBlock({ blockHash: receipt.blockHash });
      txs.set(txHash, {
        blockNumber: receipt.blockNumber,
        timestamp: Number(block.timestamp),
        recorder: receipt.from,
      });
    }
  }

  const batches = new Map<string, { batchId: string; batchHash: string; sourceType: string; trace: any[] }>();
  const lots = new Map<string, { lotCode: string; totalCans: number; packagingDate: number; productLabel: string; batches: string[]; lotTraces: any[] }>();

  for (const log of logs) {
    const txInfo = txs.get(log.transactionHash!)!;
    const base = {
      txHash: log.transactionHash!,
      timestamp: txInfo.timestamp,
      recorder: txInfo.recorder,
      blockNumber: Number(txInfo.blockNumber),
    };

    if (log.eventName === "BatchMinted") {
      const batchIdHex = log.args.batchId as string;
      const batchId = Buffer.from(batchIdHex.slice(2), "hex").toString("utf-8").replace(/\0/g, "");
      const details = decodeTraceData(log.args.data as string);
      const sourceType = (details["Source Type"] as string) || "Unknown";
      batches.set(batchIdHex, {
        batchId,
        batchHash: batchIdHex,
        sourceType,
        trace: [{ stage: 1, stageName: "Source", ...base, details }],
      });
    } else if (log.eventName === "TraceRecorded") {
      const idHex = log.args.id as string;
      const stage = Number(log.args.stage);
      const details = decodeTraceData(log.args.data as string);

      const batch = Array.from(batches.values()).find((b) => b.batchHash === idHex);
      if (batch) {
        if (stage === 1) continue;
        const stageNames: Record<number, string> = { 2: "Inventory", 3: "Manufacturing" };
        batch.trace.push({ stage, stageName: stageNames[stage] || `Stage ${stage}`, ...base, details });
      } else {
        const lot = Array.from(lots.values()).find((l) => {
          const lotHash = "0x" + Buffer.from(l.lotCode).toString("hex").padEnd(64, "0");
          return lotHash.toLowerCase() === idHex.toLowerCase();
        });
        if (lot) {
          const stageNames: Record<number, string> = { 3: "Manufacturing", 4: "Warehouse", 5: "Distribution" };
          lot.lotTraces.push({ stage, stageName: stageNames[stage] || `Stage ${stage}`, ...base, details });
        }
      }
    } else if (log.eventName === "LotCreated") {
      const lotCodeHex = log.args.lotCode as string;
      const lotCode = Buffer.from(lotCodeHex.slice(2), "hex").toString("utf-8").replace(/\0/g, "");
      const inputBatchIds = (log.args.inputBatchIds as string[]).map((h) => {
        const id = Buffer.from(h.slice(2), "hex").toString("utf-8").replace(/\0/g, "");
        return id || h;
      });
      const totalCans = Number(log.args.totalCans as bigint);
      const data = log.args.data as string;
      lots.set(lotCode, {
        lotCode,
        totalCans,
        packagingDate: extractPackagingDate(data),
        productLabel: data,
        batches: inputBatchIds,
        lotTraces: [],
      });
    }
  }

  const index: any = { lots: {}, batches: {} };
  for (const [code, lot] of lots) {
    index.lots[code] = {
      lotCode: lot.lotCode,
      totalCans: lot.totalCans,
      packagingDate: lot.packagingDate,
      productLabel: lot.productLabel,
      batches: lot.batches.map((bId) => {
        const b = Array.from(batches.values()).find((x) => x.batchId === bId);
        return b || { batchId: bId, batchHash: "", sourceType: "Unknown", trace: [] };
      }),
      lotTraces: lot.lotTraces.sort((a, b) => a.stage - b.stage),
    };
  }
  return index;
}

// ───────── Main ─────────

async function main() {
  const contract = process.argv[2] as `0x${string}`;
  const fromBlock = process.argv[3] ? BigInt(process.argv[3]) : BigInt(0);

  if (!contract) {
    console.error("Usage: npx tsx scripts/indexer.ts <contract-address> [from-block]");
    process.exit(1);
  }

  console.log(`Indexing ToroRegistry at ${contract}`);
  const index = await fetchEvents(contract, fromBlock);

  const fs = await import("fs");
  const outPath = "./src/data/traceIndex.json";
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Lots: ${Object.keys(index.lots).length}`);
}

main().catch(console.error);
