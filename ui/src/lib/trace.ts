import traceIndex from "../data/traceIndex.json";

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
  lotTraces: TraceStage[];
};

// ───────── Local JSON Index ─────────
// Generated from on-chain events. Re-run the indexer script after redeploying.
// When the backend indexer is ready, replace this with API calls.

const index = traceIndex as unknown as {
  lots: Record<string, ProductLot>;
};

export async function fetchProductLot(lotCode: string): Promise<ProductLot | null> {
  const lot = index.lots[lotCode];
  if (!lot) return null;
  return lot;
}

// ───────── Explorer URL ─────────

export function explorerUrl(txHash: string): string {
  return `https://sepolia.arbiscan.io/tx/${txHash}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RPC FALLBACK — uncomment when backend indexer is ready
// ═══════════════════════════════════════════════════════════════════════════════
//
// import { publicClient, CONTRACTS, ABIS, DEPLOYMENT_BLOCK } from "./contracts";
// import { decodeAbiParameters, parseAbiParameters, keccak256, toHex } from "viem";
//
// const CHUNK_SIZE = BigInt(40000);
//
// async function getEventsInChunks<T>(
//   eventName: string,
//   args: Record<string, unknown>
// ): Promise<T[]> {
//   const latestBlock = await publicClient.getBlockNumber();
//   let from = DEPLOYMENT_BLOCK;
//   const allLogs: T[] = [];
//   while (from <= latestBlock) {
//     const to = from + CHUNK_SIZE < latestBlock ? from + CHUNK_SIZE : latestBlock;
//     const logs = await publicClient.getContractEvents({
//       address: CONTRACTS.registry as `0x${string}`,
//       abi: ABIS.registry,
//       eventName,
//       args,
//       fromBlock: from,
//       toBlock: to,
//     });
//     allLogs.push(...(logs as T[]));
//     from = to + BigInt(1);
//   }
//   return allLogs;
// }
