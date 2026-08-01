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
  return `https://solscan.io/tx/${txHash}?cluster=devnet`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// The index is generated from Solana devnet events. Re-run after reseeding:
//   npx tsx scripts/indexer-solana.ts
// ═══════════════════════════════════════════════════════════════════════════════
