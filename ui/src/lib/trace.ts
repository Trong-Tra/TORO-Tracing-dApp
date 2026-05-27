import { publicClient, CONTRACTS, ABIS } from "./contracts";
import { decodeAbiParameters, parseAbiParameters, keccak256, toHex } from "viem";

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
  tokenId: number;
  batchId: string;
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
  0: "Source",
  1: "Manufacturing",
  2: "Warehouse",
  3: "Distribution",
  4: "Final",
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

      // Try to decode based on code type
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
      } else if (code === 0x103 || code === 0x204 || code === 0x205 || code === 0x304 || code === 0x404 || code === 0x405 || code === 0x408 || code === 0x504) {
        result[label] = new Date(Number(rawValue) * 1000).toISOString().split("T")[0];
      } else if (code === 0x305 || code === 0x409) {
        result[label] = `${Number(rawValue)}°C`;
      } else if (code >= 0x600 && code <= 0x606) {
        result[label] = Number(rawValue) === 1 ? "✓ Certified" : "✗ Not Certified";
      } else if (code === 0x106 || code === 0x208 || code === 0x209 || code === 0x20a || code === 0x502) {
        result[label] = Number(rawValue).toLocaleString();
      } else if (code === 0x200 || code === 0x300 || code === 0x400 || code === 0x500 || code === 0x505) {
        // These are keccak256 hashes of strings - just show a short hash
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

// ───────── Contract Reads ─────────

export async function fetchTokenHistory(tokenId: number): Promise<TraceStage[]> {
  const history = (await publicClient.readContract({
    address: CONTRACTS.registry as `0x${string}`,
    abi: ABIS.registry,
    functionName: "getTokenHistory",
    args: [BigInt(tokenId)],
  })) as string[];

  const stages: TraceStage[] = [];
  for (const txHash of history) {
    const trace = (await publicClient.readContract({
      address: CONTRACTS.registry as `0x${string}`,
      abi: ABIS.registry,
      functionName: "getTrace",
      args: [txHash as `0x${string}`],
    })) as { tokenId: bigint; stage: number; data: string; timestamp: bigint; recorder: string };

    stages.push({
      stage: trace.stage,
      stageName: STAGE_NAMES[trace.stage] || `Stage ${trace.stage}`,
      txHash,
      timestamp: Number(trace.timestamp),
      recorder: trace.recorder,
      details: decodeTraceData(trace.data),
    });
  }
  return stages;
}

export async function fetchBatchId(tokenId: number): Promise<string> {
  const batchId = (await publicClient.readContract({
    address: CONTRACTS.sbt as `0x${string}`,
    abi: ABIS.sbt,
    functionName: "batchIdOf",
    args: [BigInt(tokenId)],
  })) as string;
  return batchId;
}

export async function fetchFinalRecord(lotCode: string): Promise<{ tokenIds: bigint[]; totalCans: bigint; packagingDate: bigint } | null> {
  try {
    // Lot codes are stored as keccak256 hashes on-chain
    const lotCodeHash = keccak256(toHex(lotCode));
    const record = (await publicClient.readContract({
      address: CONTRACTS.recordMinter as `0x${string}`,
      abi: ABIS.recordMinter,
      functionName: "getFinalRecord",
      args: [lotCodeHash as `0x${string}`],
    })) as { tokenIds: bigint[]; totalCans: bigint; packagingDate: bigint; finalTraceHash: string; exists: boolean };

    if (!record.exists) return null;
    return {
      tokenIds: record.tokenIds,
      totalCans: record.totalCans,
      packagingDate: record.packagingDate,
    };
  } catch {
    return null;
  }
}

export async function fetchProductLot(lotCode: string): Promise<ProductLot | null> {
  const record = await fetchFinalRecord(lotCode);
  if (!record) return null;

  const batches: ProductBatch[] = [];
  for (const tokenId of record.tokenIds) {
    const batchId = await fetchBatchId(Number(tokenId));
    const trace = await fetchTokenHistory(Number(tokenId));
    const sourceType = trace[0]?.details["Source Type"] as string || "Unknown";

    batches.push({
      tokenId: Number(tokenId),
      batchId,
      sourceType,
      trace,
    });
  }

  return {
    lotCode,
    totalCans: Number(record.totalCans),
    packagingDate: Number(record.packagingDate),
    batches,
  };
}

// ───────── Explorer URL ─────────

export function explorerUrl(txHash: string): string {
  return `https://sepolia.arbiscan.io/tx/${txHash}`;
}
