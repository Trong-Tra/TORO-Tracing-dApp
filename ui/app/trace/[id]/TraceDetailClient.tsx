"use client";

import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Package, ExternalLink, ArrowLeft, Sprout, Anchor } from "lucide-react";
import TraceTimeline from "@/components/TraceTimeline";
import TunaSchoolImages from "@/components/TunaSchoolImages";
import { TRACE_DATA } from "@/data/trace";

export default function TraceDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [selectedSource, setSelectedSource] = useState<"farm" | "catch" | null>(null);

  // Mock validation - only MOTN3042 exists
  const isValidId = id === "MOTN3042";

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

  const farm = TRACE_DATA.farm;
  const catchChain = TRACE_DATA.catch;
  const selectedChain =
    selectedSource === "farm" ? farm : selectedSource === "catch" ? catchChain : null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 px-4 py-4 border-b border-white/[0.06] bg-[#0a1628]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/trace")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ocean/10 border border-ocean/30 text-ocean text-sm font-medium"
          >
            <Package className="w-4 h-4" />
            Batch: {id}
          </motion.div>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Tuna School Animation */}
      <div className="relative w-full bg-gradient-to-b from-deep to-dark">
        <TunaSchoolImages />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a1628] to-transparent pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 bg-[#0a1628]">
        <AnimatePresence mode="wait">
          {!selectedSource ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Source Selection */}
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Trace Explorer
                  </h1>
                  <p className="text-white/50 max-w-lg mx-auto">
                    Select a source to explore its full supply chain journey — every stage
                    verified on Cardano.
                  </p>
                </div>

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
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 border border-white/20 whitespace-nowrap"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {farm.cases} cases
                    </motion.div>
                  </motion.button>

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
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 border border-white/20 whitespace-nowrap"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                    >
                      {catchChain.cases} cases
                    </motion.div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Timeline View */}
              {selectedChain && (
                <div className="max-w-6xl mx-auto">
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sources
                  </button>

                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedChain.label}</h2>
                    <p className="text-white/60">{selectedChain.subtitle}</p>
                  </div>

                  <TraceTimeline chain={selectedChain} onBack={() => setSelectedSource(null)} />

                  {/* Final Product Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-ocean/30"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6">Final Product</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {Object.entries(TRACE_DATA.final.details).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-white/60 text-sm mb-1">{key}</p>
                          <p className="text-white font-semibold">{value as string}</p>
                        </div>
                      ))}
                    </div>

                    {/* Cardano Links */}
                    {selectedChain?.cardanoLinks && selectedChain.cardanoLinks.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4">
                        {selectedChain.cardanoLinks.map((link) => (
                          <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean/10 border border-ocean/30 text-ocean hover:bg-ocean/20 hover:border-ocean/60 transition-all no-underline font-medium text-sm"
                          >
                            {link.name}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
