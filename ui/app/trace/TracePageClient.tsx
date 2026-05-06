"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ExternalLink, ArrowLeft, Sprout, Anchor } from "lucide-react";
import TunaSchool from "@/components/TunaSchool";
import TraceTimeline from "@/components/TraceTimeline";
import { TRACE_DATA, cardanoscanUrl } from "@/data/trace";

export default function TracePageClient() {
  const searchParams = useSearchParams();
  const [selectedSource, setSelectedSource] = useState<"farm" | "catch" | null>(
    null
  );

  useEffect(() => {
    const batch = searchParams.get("batch");
    if (batch) {
      document.title = `TORO Trace — Batch ${batch}`;
    }
  }, [searchParams]);

  const farm = TRACE_DATA.farm;
  const catchChain = TRACE_DATA.catch;
  const selectedChain =
    selectedSource === "farm" ? farm : selectedSource === "catch" ? catchChain : null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Tuna School Animation */}
      <div className="relative w-full bg-gradient-to-b from-deep to-dark">
        <TunaSchool />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark to-transparent pointer-events-none" />
      </div>

      {/* Header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ocean/10 border border-ocean/30 text-ocean text-sm font-medium mb-3"
        >
          <Package className="w-4 h-4" />
          Batch: {TRACE_DATA.final.details["Label"]}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-white mb-2"
        >
          Trace Explorer
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/50 max-w-lg mx-auto"
        >
          Select a source to explore its full supply chain journey — every stage
          verified on Cardano.
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {!selectedSource ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Source Circles */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-8">
                {/* Farm */}
                <motion.button
                  onClick={() => setSelectedSource("farm")}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center gap-3 border-2 cursor-pointer"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${farm.color}44, ${farm.color}11)`,
                      borderColor: farm.color,
                      boxShadow: `0 0 20px ${farm.color}33`,
                    }}
                  >
                    <Sprout className="w-10 h-10" style={{ color: farm.color }} />
                    <span className="text-lg font-semibold text-white">{farm.label}</span>
                    <span className="text-xs text-white/60">{farm.subtitle}</span>
                  </div>
                  <motion.div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-ocean/20 text-ocean border border-ocean/40 whitespace-nowrap"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    Click to explore
                  </motion.div>
                </motion.button>

                {/* Divider */}
                <motion.div
                  className="hidden md:block w-24 h-px bg-gradient-to-r from-ocean/40 to-orange/40"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8 }}
                />

                {/* Catch */}
                <motion.button
                  onClick={() => setSelectedSource("catch")}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center gap-3 border-2 cursor-pointer"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${catchChain.color}44, ${catchChain.color}11)`,
                      borderColor: catchChain.color,
                      boxShadow: `0 0 20px ${catchChain.color}33`,
                    }}
                  >
                    <Anchor className="w-10 h-10" style={{ color: catchChain.color }} />
                    <span className="text-lg font-semibold text-white">{catchChain.label}</span>
                    <span className="text-xs text-white/60">{catchChain.subtitle}</span>
                  </div>
                  <motion.div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-orange/20 text-orange border border-orange/40 whitespace-nowrap"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                  >
                    Click to explore
                  </motion.div>
                </motion.button>
              </div>

              {/* Final Product Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 max-w-xl mx-auto"
              >
                <div className="p-6 rounded-2xl bg-gradient-to-br from-gold/10 to-orange/10 border border-gold/20 text-center">
                  <Package className="w-8 h-8 text-gold mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Final Product
                  </h3>
                  <p className="text-3xl font-bold text-gold mb-1">
                    {TRACE_DATA.final.details["Total Cans"]?.toLocaleString()}{" "}
                    Cans
                  </p>
                  <p className="text-sm text-white/50 mb-4">
                    {TRACE_DATA.final.details["Farm Cans"]?.toLocaleString()}{" "}
                    farm +{" "}
                    {TRACE_DATA.final.details["Catch Cans"]?.toLocaleString()}{" "}
                    catch
                  </p>
                  <a
                    href={cardanoscanUrl(TRACE_DATA.final.tx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 transition-colors no-underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View merge transaction on Cardanoscan
                  </a>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-col md:flex-row items-start gap-8 max-w-6xl mx-auto">
                {/* Selected Source Circle (Left on desktop) */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="shrink-0 mx-auto md:mx-0"
                >
                  <div
                    className="w-40 h-40 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center gap-2 border-2 mb-4 md:mb-0"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${selectedChain!.color}44, ${selectedChain!.color}11)`,
                      borderColor: selectedChain!.color,
                      boxShadow: `0 0 40px ${selectedChain!.color}55`,
                    }}
                  >
                    {selectedSource === "farm" ? (
                      <Sprout className="w-8 h-8" style={{ color: selectedChain!.color }} />
                    ) : (
                      <Anchor className="w-8 h-8" style={{ color: selectedChain!.color }} />
                    )}
                    <span className="text-base font-semibold text-white">{selectedChain!.label}</span>
                    <span className="text-xs text-white/60">{selectedChain!.subtitle}</span>
                  </div>
                </motion.div>

                {/* Timeline */}
                <div className="flex-1 min-w-0">
                  {/* Back button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setSelectedSource(null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sources
                  </motion.button>

                  <TraceTimeline
                    chain={selectedChain!}
                    onBack={() => setSelectedSource(null)}
                    showBackButton={false}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
