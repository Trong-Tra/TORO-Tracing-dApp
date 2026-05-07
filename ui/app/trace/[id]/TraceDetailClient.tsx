"use client";

import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import TunaSchoolImages from "@/components/TunaSchoolImages";
import { TRACE_DATA } from "@/data/trace";

// Layout constants (px)
const BIG_HALF   = 70;  // half of 140px big circle
const CIRCLE_HALF = 56;  // half of 112px stage circle
const BRANCH_W   = 56;  // horizontal branch width

export default function TraceDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [selectedSource, setSelectedSource] = useState<"farm" | "catch" | null>(null);
  const [showStages, setShowStages]         = useState(false);
  const [selectedStage, setSelectedStage]   = useState<number | null>(null);

  // Vertical trunk geometry (spans first→last circle center)
  const [vTrunkTop, setVTrunkTop]       = useState(0);
  const [vTrunkHeight, setVTrunkHeight] = useState(0);

  const stagesColRef = useRef<HTMLDivElement>(null);
  const rowRefs      = useRef<(HTMLDivElement | null)[]>([]);

  const isValidId    = id === "MOTN3042";
  const farm         = TRACE_DATA.farm;
  const catchChain   = TRACE_DATA.catch;
  const selectedChain =
    selectedSource === "farm" ? farm : selectedSource === "catch" ? catchChain : null;

  const updateTree = () => {
    const col = stagesColRef.current;
    if (!col) return;
    const rows = rowRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!rows.length) return;

    const colRect   = col.getBoundingClientRect();
    const firstRect = rows[0].getBoundingClientRect();
    const lastRect  = rows[rows.length - 1].getBoundingClientRect();

    const trunkY   = firstRect.top - colRect.top + CIRCLE_HALF;
    const trunkEnd = lastRect.top  - colRect.top + CIRCLE_HALF;

    setVTrunkTop(trunkY);
    setVTrunkHeight(trunkEnd - trunkY);
  };

  useEffect(() => {
    if (showStages) {
      const t = setTimeout(updateTree, 60);
      return () => clearTimeout(t);
    }
  }, [showStages, selectedChain]);

  const handleStageToggle = (idx: number) => {
    setSelectedStage((prev) => (prev === idx ? null : idx));
    setTimeout(updateTree, 380);
  };

  const handleSourceSelect = (source: "farm" | "catch") => {
    setSelectedSource(source);
    setSelectedStage(null);
    rowRefs.current = [];
    setTimeout(() => setShowStages(true), 400);
  };

  const handleBack = () => {
    setShowStages(false);
    setSelectedSource(null);
    setSelectedStage(null);
    setVTrunkTop(0);
    setVTrunkHeight(0);
  };

  if (!isValidId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1628]">
        <h1 className="text-2xl font-bold text-white mb-4">Product Not Found</h1>
        <p className="text-white/60 mb-8">The batch ID "{id}" does not exist.</p>
        <button
          onClick={() => router.push("/trace")}
          className="px-6 py-2 rounded-lg bg-ocean text-white font-medium hover:bg-ocean/80 transition-colors"
        >
          Back to Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#0a1628]">

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-4 py-4 border-b border-white/[0.06] bg-[#0a1628]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/trace")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-10" />
          <div className="w-10" />
        </div>
      </div>

      {/* ── Tuna animation ── */}
      <div className="relative w-full bg-gradient-to-b from-deep to-dark">
        <TunaSchoolImages />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a1628] to-transparent pointer-events-none" />
      </div>

      {/* ── Final product card ── */}
      <div className="px-4 py-8 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-ocean/30"
        >
          <h2 className="text-sm font-semibold text-ocean mb-4">{id}</h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-white/60 text-xs mb-2">BATCH SIZE</p>
              <p className="text-2xl font-bold text-white">5,440</p>
              <p className="text-xs text-white/40 mt-1">cans total</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-2">LABEL</p>
              <p className="text-lg font-semibold text-white">{TRACE_DATA.final.details["Label"]}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-2">PACKAGING DATE</p>
              <p className="text-lg font-semibold text-white">{TRACE_DATA.final.details["Packaging Date"]}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 px-4 py-12 bg-[#0a1628]">
        <AnimatePresence mode="popLayout">

          {/* ════ SOURCE SELECTION ════ */}
          {!selectedSource ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-6xl mx-auto"
            >
              {/* Tree connector from final product */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-px bg-ocean/30"
                  initial={{ height: 0 }}
                  animate={{ height: 48 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                <motion.div
                  className="h-px bg-ocean/30"
                  initial={{ width: 0 }}
                  animate={{ width: 272 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                />
                <div className="flex justify-between" style={{ width: 272 }}>
                  <motion.div
                    className="w-px bg-ocean/30"
                    initial={{ height: 0 }}
                    animate={{ height: 48 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  />
                  <motion.div
                    className="w-px bg-ocean/30"
                    initial={{ height: 0 }}
                    animate={{ height: 48 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-20 py-12">
                {(["farm", "catch"] as const).map((src) => (
                  <motion.div
                    key={src}
                    layoutId={`source-${src}`}
                    onClick={() => handleSourceSelect(src)}
                    className="relative group w-48 h-48 rounded-full flex flex-col items-center justify-center border-2 border-white/30 cursor-pointer bg-white/5 backdrop-blur"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
                  >
                    <p className="text-[10px] text-white/50 tracking-widest">BATCH</p>
                    <p className="text-sm font-bold text-white text-center px-3 mt-1 leading-tight">
                      {src === "farm" ? "TORO-FARM-001" : "TORO-CATCH-001"}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          ) : (

            /* ════ DETAIL VIEW ════ */
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-2xl mx-auto w-full"
            >
              {/* ── Tree row: [big circle] [h-trunk] [stages column] ── */}
              <div className="flex items-start">

                {/* Big source circle — shared element morphs from selector */}
                <motion.div
                  layoutId={`source-${selectedSource}`}
                  onClick={handleBack}
                  whileHover={{ scale: 1.05 }}
                  className="w-[140px] h-[140px] rounded-full flex-shrink-0 flex flex-col items-center justify-center border-2 border-white/30 bg-white/5 backdrop-blur cursor-pointer"
                  transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
                >
                  <p className="text-[10px] text-white/50 tracking-widest">BATCH</p>
                  <p className="text-sm font-bold text-white text-center px-3 mt-1 leading-tight">
                    {selectedSource === "farm" ? "TORO-FARM-001" : "TORO-CATCH-001"}
                  </p>
                </motion.div>

                {/* Horizontal trunk — exits big circle at its vertical center (BIG_HALF) */}
                {showStages && selectedChain && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                    style={{ marginTop: `${BIG_HALF}px`, transformOrigin: "left" }}
                    className="w-12 h-px bg-ocean/30 flex-shrink-0"
                  />
                )}

                {/* Stages column */}
                {showStages && selectedChain && (
                  <motion.div
                    ref={stagesColRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative flex-1"
                  >
                    {/* Vertical trunk — spans first to last circle center */}
                    <div
                      aria-hidden="true"
                      className="absolute w-px bg-ocean/30 pointer-events-none transition-[top,height] duration-300"
                      style={{
                        left: 0,
                        top: `${vTrunkTop}px`,
                        height: `${vTrunkHeight}px`,
                      }}
                    />

                    {selectedChain.stages.map((stage, idx) => (
                      <motion.div
                        key={stage.stage}
                        ref={(el) => { rowRefs.current[idx] = el; }}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + idx * 0.1, duration: 0.4 }}
                        className="relative mb-6 last:mb-0"
                        style={{ paddingLeft: `${BRANCH_W}px` }}
                      >
                        {/* Horizontal branch from trunk to circle */}
                        <div
                          aria-hidden="true"
                          className="absolute bg-ocean/30 pointer-events-none"
                          style={{
                            left: 0,
                            top: `${CIRCLE_HALF}px`,
                            width: `${BRANCH_W}px`,
                            height: "1px",
                          }}
                        />

                        {/* Stage circle + external link */}
                        <div className="flex items-center gap-3">
                          <motion.button
                            onClick={() => handleStageToggle(idx)}
                            whileHover={{ scale: 1.06 }}
                            className={[
                              "w-28 h-28 rounded-full border-2 bg-white/5 backdrop-blur",
                              "flex items-center justify-center cursor-pointer",
                              "transition-all duration-200 text-xs font-semibold",
                              "text-white text-center leading-tight px-3",
                              selectedStage === idx
                                ? "border-ocean bg-ocean/15"
                                : "border-white/30 hover:border-ocean/60 hover:bg-white/10",
                            ].join(" ")}
                          >
                            {stage.stage}
                          </motion.button>
                          <a
                            href={`https://preview.cardanoscan.io/transaction/${stage.tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ocean/50 hover:text-ocean transition-colors"
                            title="View transaction on Cardanoscan"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        {/* Expandable detail panel */}
                        <AnimatePresence>
                          {selectedStage === idx && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.32 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 p-5 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-ocean/30">
                                <h3 className="text-sm font-bold text-white mb-4">
                                  {stage.stage}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {Object.entries(stage.details).map(([key, value]) => (
                                    <div key={key}>
                                      <p className="text-white/50 text-[10px] font-semibold tracking-widest mb-1">
                                        {key.toUpperCase()}
                                      </p>
                                      <p className="text-white font-mono text-xs break-words">
                                        {String(value)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
                                  <a
                                    href={`https://preview.cardanoscan.io/transaction/${stage.tx}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean/10 border border-ocean/30 text-ocean hover:bg-ocean/20 transition-all text-xs font-medium"
                                  >
                                    View on Cardanoscan
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  {stage.cardanoLinks?.map((link) => (
                                    <a
                                      key={link.name}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean/10 border border-ocean/30 text-ocean hover:bg-ocean/20 transition-all text-xs font-medium"
                                    >
                                      {link.name}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* ── Back button ── */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleBack}
                className="mt-12 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sources
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}