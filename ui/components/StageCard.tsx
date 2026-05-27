"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { explorerUrl } from "@/src/lib/trace";
import type { TraceStage } from "@/src/lib/trace";

interface StageCardProps {
  stage: TraceStage;
  color: string;
  index: number;
}

export default function StageCard({ stage, color, index }: StageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
      className="w-full max-w-md bg-surface-light/60 backdrop-blur-sm rounded-2xl border border-white/10 p-5 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: `${color}22`, border: `1px solid ${color}44` }}
          >
            <span className="text-sm font-bold" style={{ color }}>
              {index + 1}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{stage.stageName}</h3>
            <p className="text-xs text-white/40 font-mono">
              {stage.txHash.slice(0, 16)}…
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {Object.entries(stage.details).map(([key, value]) => (
          <div key={key} className="bg-deep/40 rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
              {key}
            </p>
            <p className="text-sm text-white/90 font-medium truncate">{String(value)}</p>
          </div>
        ))}
      </div>

      <a
        href={explorerUrl(stage.txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors no-underline"
        style={{
          background: `${color}18`,
          color,
          border: `1px solid ${color}33`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = `${color}33`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = `${color}18`;
        }}
      >
        <ExternalLink className="w-3 h-3" />
        View on Arbiscan
      </a>
    </motion.div>
  );
}
