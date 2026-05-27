import { publicClient, CONTRACTS, ABIS, DEPLOYMENT_BLOCK } from "./contracts";
import { decodeAbiParameters, parseAbiParameters, keccak256, toHex } from "viem";
import type { Log } from "viem";

// ───────── Types ─────────

export type TraceStage = {
  stage: number;
  stageName: string;
  txHash: string;
  timestamp: number;
  recorder: string;
  details: Record<string, string | number>;
};

export type ProductBatch = {
  batchId: string;
  batchHash: string;
  sourceType: string;
  trace: TraceStage[];
};

export type ProductLot = {
  lotCode: string;
  totalCans: number;
  packagingDate: number;
  batches: ProductBatch[];
};

// ───────── Stage Names ─────────

const STAGE_NAMES: Record<number, string> = {
  1: "Source",
  2: "Inventory",
  3: "Manufacturing",
  4: "Warehouse",
  5: "Distribution",
};

// ───────── Code Registry ─────────

const CODE_LABELS: Record<number, string> = {
  0x100: "Source Type",
  0x101: "Fish Species",
  0x102: "Country",
  0x103: "Catch Date",
  0x104: "Fishing Method",
  0x105: "Catch Area",
  0x106: "Catch Weight (kg)",
  0x107: "Vessel/Farm ID",
  0x108: "Supplier Name",
  0x110: "Inventory Received",
  0x111: "Inventory Location",
  0x200: "Factory Name",
  0x201: "Factory Country",
  0x202: "Factory Lat",
  0x203: "Factory Lng",
  0x204: "Production Date",
  0x205: "Packaging Date",
  0x206: "Batch Code",
  0x207: "Product Lot",
  0x208: "Input Weight (kg)",
  0x209: "Output Cans",
  0x20a: "Wastage (kg)",
  0x300: "Warehouse Name",
  0x301: "Warehouse Country",
  0x302: "Warehouse Lat",
  0x303: "Warehouse Lng",
  0x304: "Storage Date",
  0x305: "Storage Temp (°C)",
  0x306: "Storage Duration (hrs)",
  0x400: "Shipment Code",
  0x401: "Container ID",
  0x402: "From Country",
  0x403: "To Country",
  0x404: "Departure Date",
  0x405: "Arrival Date",
  0x406: "Transit Duration (hrs)",
  0x407: "Checkpoint",
  0x408: "Checkpoint Time",
  0x409: "Transit Temp (°C)",
  0x500: "Final Lot Code",
  0x501: "Product Label",
  0x502: "Total Cans",
  0x503: "Batches Merged",
  0x504: "Packaging Date",
  0x505: "Distribution Center",
  0x600: "HACCP Certified",
  0x601: "FDA Approved",
  0x602: "Lab Test Passed",
  0x603: "MSC Certified",
  0x604: "ASC Certified",
  0x605: "Friend of the Sea",
  0x606: "ISO 22000",
};

const SOURCE_TYPE_MAP: Record<number, string> = { 1: "Vessel", 2: "Farm" };
const SPECIES_MAP: Record<number, string> = { 1: "Yellowfin", 2: "Skipjack", 3: "Bigeye", 4: "Albacore" };
const METHOD_MAP: Record<number, string> = { 1: "Longline", 2: "Purse Seine", 3: "Pole & Line", 4: "Gillnet", 5: "Aquaculture" };
const AREA_MAP: Record<number, string> = { 1: "Pacific Ocean", 2: "Indian Ocean", 3: "Atlantic Ocean" };
const COUNTRY_MAP: Record<number, string> = { 360: "Indonesia", 392: "Japan", 702: "Singapore", 704: "Vietnam", 764: "Thailand" };
const INVENTORY_LOC_MAP: Record<number, string> = { 1: "Port Cold Storage", 2: "Farm Holding Tank" };

// ───────── Decoding ─────────

function decodeTraceData(hexData: string): Record<string, string | number> {
  try {
    const decoded = decodeAbiParameters(
      parseAbiParameters("uint256[] codes, bytes32[] values"),
      hexData as `0x${string}`
    );
    const codes = decoded[0] as bigint[];
    const values = decoded[1] as string[];
    const result: Record<string, string | number> = {};

    for (let i = 0; i < codes.length; i++) {
      const code = Number(codes[i]);
      const label = CODE_LABELS[code] || `0x${code.toString(16)}`;
      const rawValue = values[i];

      if (code === 0x100) {
        result[label] = SOURCE_TYPE_MAP[Number(rawValue)] || rawValue;
      } else if (code === 0x101) {
        result[label] = SPECIES_MAP[Number(rawValue)] || rawValue;
      } else if (code === 0x102 || code === 0x201 || code === 0x301 || code === 0x402 || code === 0x403) {
        result[label] = COUNTRY_MAP[Number(rawValue)] || rawValue;
      } else if (code === 0x104) {
        result[label] = METHOD_MAP[Number(rawValue)] || rawValue;
      } else if (code === 0x105) {
        result[label] = AREA_MAP[Number(rawValue)] || rawValue;
      } else if (code === 0x111) {
        result[label] = INVENTORY_LOC_MAP[Number(rawValue)] || rawValue;
      } else if (code === 0x103 || code === 0x204 || code === 0x205 || code === 0x304 || code === 0x404 || code === 0x405 || code === 0x408 || code === 0x504 || code === 0x110) {
        result[label] = new Date(Number(rawValue) * 1000).toISOString().split("T")[0];
      } else if (code === 0x305 || code === 0x409) {
        result[label] = `${Number(rawValue)}°C`;
      } else if (code >= 0x600 && code <= 0x606) {
        result[label] = Number(rawValue) === 1 ? "✓ Certified" : "✗ Not Certified";
      } else if (code === 0x106 || code === 0x208 || code === 0x209 || code === 0x20a || code === 0x502) {
        result[label] = Number(rawValue).toLocaleString();
      } else if (code === 0x200 || code === 0x300 || code === 0x400 || code === 0x500 || code === 0x505 || code === 0x501) {
        result[label] = `${rawValue.slice(0, 10)}...${rawValue.slice(-8)}`;
      } else {
        result[label] = Number(rawValue).toLocaleString();
      }
    }
    return result;
  } catch {
    return { raw: hexData.slice(0, 40) + "..." };
  }
}

function extractPackagingDate(hexData: string): number {
  try {
    const decoded = decodeAbiParameters(
      parseAbiParameters("uint256[] codes, bytes32[] values"),
      hexData as `0x${string}`
    );
    const codes = decoded[0] as bigint[];
    const values = decoded[1] as string[];
    for (let i = 0; i < codes.length; i++) {
      if (Number(codes[i]) === 0x504) {
        return Number(values[i]);
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

// ───────── Batch name lookup ─────────

const BATCH_NAME_MAP: Record<string, string> = {
  [keccak256(toHex("WILD-CATCH-001"))]: "WILD-CATCH-001",
  [keccak256(toHex("WILD-CATCH-002"))]: "WILD-CATCH-002",
  [keccak256(toHex("FARM-001"))]: "FARM-001",
  [keccak256(toHex("FARM-002"))]: "FARM-002",
  [keccak256(toHex("WILD-CATCH-003"))]: "WILD-CATCH-003",
};

function getBatchName(batchHash: string): string {
  return BATCH_NAME_MAP[batchHash] || batchHash.slice(0, 14) + "...";
}

// ───────── Event Fetching ─────────

type TraceEvent = {
  id: `0x${string}`;
  stage: number;
  data: `0x${string}`;
  timestamp: bigint;
  recorder: `0x${string}`;
};

type LotCreatedEvent = {
  lotCode: `0x${string}`;
  inputBatchIds: `0x${string}`[];
  totalCans: bigint;
  data: `0x${string}`;
  timestamp: bigint;
  recorder: `0x${string}`;
};

async function fetchTraceEvents(id: `0x${string}`): Promise<TraceStage[]> {
  const logs = await publicClient.getContractEvents({
    address: CONTRACTS.registry as `0x${string}`,
    abi: ABIS.registry,
    eventName: "TraceRecorded",
    args: { id },
    fromBlock: DEPLOYMENT_BLOCK,
    toBlock: "latest",
  });

  return logs
    .map((log) => {
      const args = (log as any).args as TraceEvent;
      return {
        stage: args.stage,
        stageName: STAGE_NAMES[args.stage] || `Stage ${args.stage}`,
        txHash: log.transactionHash,
        timestamp: Number(args.timestamp),
        recorder: args.recorder,
        details: decodeTraceData(args.data),
      };
    })
    .sort((a, b) => a.stage - b.stage);
}

async function fetchLotCreatedEvent(lotCodeHash: `0x${string}`): Promise<LotCreatedEvent | null> {
  const logs = await publicClient.getContractEvents({
    address: CONTRACTS.registry as `0x${string}`,
    abi: ABIS.registry,
    eventName: "LotCreated",
    args: { lotCode: lotCodeHash },
    fromBlock: DEPLOYMENT_BLOCK,
    toBlock: "latest",
  });

  if (logs.length === 0) return null;
  return (logs[0] as any).args as LotCreatedEvent;
}

// ───────── Contract Reads ─────────

export async function fetchProductLot(lotCode: string): Promise<ProductLot | null> {
  const lotCodeHash = keccak256(toHex(lotCode));

  const lotEvent = await fetchLotCreatedEvent(lotCodeHash as `0x${string}`);
  if (!lotEvent) return null;

  // Fetch traces for each input batch
  const batches: ProductBatch[] = [];
  for (const batchHash of lotEvent.inputBatchIds) {
    const trace = await fetchTraceEvents(batchHash);
    const sourceType = trace[0]?.details["Source Type"] as string || "Unknown";
    batches.push({
      batchId: getBatchName(batchHash),
      batchHash,
      sourceType,
      trace,
    });
  }

  // Fetch lot-level traces (manufacturing, warehouse, distribution)
  // These are merged into each batch's trace for display
  const lotTraces = await fetchTraceEvents(lotCodeHash as `0x${string}`);

  // For display compatibility: append lot traces to the first batch
  // In single-batch lots, this shows the full flow on one timeline
  // In multi-batch lots, each batch shows its own traces + lot traces
  if (batches.length > 0) {
    batches[0].trace = [...batches[0].trace, ...lotTraces];
  }

  // Extract packaging date from lot data
  const packagingDate = extractPackagingDate(lotEvent.data);

  return {
    lotCode,
    totalCans: Number(lotEvent.totalCans),
    packagingDate,
    batches,
  };
}

// ───────── Explorer URL ─────────

export function explorerUrl(txHash: string): string {
  return `https://sepolia.arbiscan.io/tx/${txHash}`;
}
