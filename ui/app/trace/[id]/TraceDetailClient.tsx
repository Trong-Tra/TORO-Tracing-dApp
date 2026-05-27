"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Shield, Calendar, Boxes } from "lucide-react";
import TraceTimeline from "@/components/TraceTimeline";
import { fetchProductLot, explorerUrl } from "@/src/lib/trace";
import { CONTRACTS } from "@/src/lib/contracts";
import type { ProductLot, ProductBatch } from "@/src/lib/trace";

const BATCH_COLORS = ["#3e96cc", "#ff914d", "#4ade80", "#f472b6", "#a78bfa"];

export default function TraceDetailClient() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);

  useEffect(() => {
    document.title = `TORO Trace — Lot ${id}`;
    loadProduct();
  }, [id]);

  async function loadProduct() {
    setLoading(true);
    try {
      const lot = await fetchProductLot(id);
      setProduct(lot);
      if (lot && lot.batches.length > 0) {
        setSelectedBatch(0);
      }
    } catch (e) {
      console.error("Failed to load product:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1628]">
        <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 mt-4">Loading trace data from Arbitrum Sepolia...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1628]">
        <h1 className="text-2xl font-bold text-white mb-4">Product Not Found</h1>
        <p className="text-white/60 mb-8">The lot code &quot;{id}&quot; does not exist on-chain.</p>
      </div>
    );
  }

  const selectedBatchData = selectedBatch !== null ? product.batches[selectedBatch] : null;

  return (
    <div className="flex flex-col min-h-full bg-[#0a1628]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-4 py-4 border-b border-white/[0.06] bg-[#0a1628]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/trace" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            ← Back
          </a>
          <div className="w-10" />
        </div>
      </div>

      {/* ── Product Card ── */}
      <div className="px-4 py-8 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-ocean/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-5 h-5 text-ocean" />
            <h2 className="text-sm font-semibold text-ocean">{id}</h2>
            <span className="ml-auto px-3 py-1 rounded-full bg-green/20 text-green text-xs font-medium border border-green/40 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Blockchain Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-white/60 text-xs mb-2">TOTAL OUTPUT</p>
              <p className="text-2xl font-bold text-white">{product.totalCans.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">cans</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-2">INPUT BATCHES</p>
              <p className="text-2xl font-bold text-white">{product.batches.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {product.batches.map((b) => b.sourceType).join(" + ")}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-2">PACKAGING DATE</p>
              <p className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-ocean" />
                {new Date(product.packagingDate * 1000).toISOString().split("T")[0]}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Batch Selector ── */}
      {product.batches.length > 1 && (
        <div className="px-4 max-w-6xl mx-auto w-full mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Boxes className="w-4 h-4 text-white/40 shrink-0" />
            <span className="text-sm text-white/40 shrink-0">Input Batches:</span>
            {product.batches.map((batch, idx) => (
              <button
                key={batch.batchHash}
                onClick={() => setSelectedBatch(idx)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 border ${
                  selectedBatch === idx
                    ? "bg-ocean/20 text-ocean border-ocean/50"
                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                }`}
              >
                {batch.batchId} ({batch.sourceType})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Batch Trace Timeline ── */}
      {selectedBatchData && selectedBatch !== null && (
        <div className="flex-1 px-4 max-w-6xl mx-auto w-full pb-8">
          <TraceTimeline
            trace={selectedBatchData.trace}
            color={BATCH_COLORS[selectedBatch % BATCH_COLORS.length]}
            title={`${selectedBatchData.batchId} — ${selectedBatchData.sourceType}`}
          />
        </div>
      )}

      {/* ── Lot Trace Timeline ── */}
      {product.lotTraces.length > 0 && (
        <div className="flex-1 px-4 max-w-6xl mx-auto w-full pb-12">
          <TraceTimeline
            trace={product.lotTraces}
            color="#ffc354"
            title={`${product.lotCode} — Lot Timeline`}
          />
        </div>
      )}

      {/* ── Explorer Link ── */}
      <div className="px-4 py-6 max-w-6xl mx-auto w-full text-center border-t border-white/[0.06]">
        <a
          href={`https://sepolia.arbiscan.io/address/${CONTRACTS.registry}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ocean/60 hover:text-ocean transition-colors"
        >
          View Registry Contract on Arbiscan →
        </a>
      </div>
    </div>
  );
}
