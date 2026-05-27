"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import StageCard from "./StageCard";
import type { TraceStage } from "@/src/lib/trace";

interface TraceTimelineProps {
  trace: TraceStage[];
  color: string;
  title: string;
  onBack?: () => void;
}

export default function TraceTimeline({ trace, color, title, onBack }: TraceTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4 py-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-sm text-white/50">{trace.length} trace points on Arbitrum Sepolia</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-6 md:left-8 top-0 bottom-0 w-px"
          style={{
            background: `linear-gradient(to bottom, ${color}66, ${color}22)`,
          }}
        />

        <div className="space-y-4">
          {trace.map((stage, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <div key={stage.txHash + i} className="relative">
                {/* Node */}
                <motion.button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="flex items-center gap-4 w-full text-left group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  {/* Circle node */}
                  <div
                    className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all shrink-0"
                    style={{
                      background: isExpanded
                        ? `${color}33`
                        : "#0c2c54",
                      borderColor: isExpanded ? color : `${color}66`,
                      boxShadow: isExpanded
                        ? `0 0 30px ${color}44`
                        : "none",
                    }}
                  >
                    <span
                      className="text-sm md:text-base font-bold"
                      style={{ color }}
                    >
                      {i + 1}
                    </span>
                  </div>

                  {/* Stage name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-ocean transition-colors">
                      {stage.stageName}
                    </h3>
                    <p className="text-xs text-white/40 font-mono truncate">
                      {stage.txHash.slice(0, 20)}…
                    </p>
                  </div>

                  {/* Expand icon */}
                  <div className="text-white/30 group-hover:text-white/60 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </motion.button>

                {/* Expanded card */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden ml-16 md:ml-20 mt-2"
                    >
                      <StageCard stage={stage} color={color} index={i} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
