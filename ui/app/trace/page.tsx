"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Package } from "lucide-react";

// Deployed lot codes from the demo script
const FEATURED_LOTS = [
  {
    id: "TORO-LOT-001",
    label: "TORO Premium Tuna",
    quantity: "3,900 cans",
    status: "Verified",
    batches: 1,
  },
  {
    id: "TORO-LOT-002",
    label: "TORO Premium Tuna Blend",
    quantity: "8,800 cans",
    status: "Verified",
    batches: 2,
  },
  {
    id: "TORO-LOT-003",
    label: "TORO Premium Tuna",
    quantity: "5,800 cans",
    status: "Verified",
    batches: 1,
  },
  {
    id: "TORO-LOT-004",
    label: "TORO Premium Tuna",
    quantity: "2,300 cans",
    status: "Verified",
    batches: 1,
  },
];

export default function TracePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredLots = FEATURED_LOTS.filter((lot) =>
    lot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (lotId: string) => {
    // Use the keccak256 hash of the lot code as the URL param
    // since the contract uses bytes32 lot codes
    router.push(`/trace/${lotId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredLots.length > 0) {
      handleSearch(filteredLots[0].id);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a1628] pt-20">
      {/* Hero Section */}
      <section className="relative px-6 md:px-10 py-12 md:py-16 bg-gradient-to-b from-[#0c1f3a] to-[#0a1628]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-0 w-96 h-96 bg-ocean/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              TORO Product Explorer
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-12">
              Trace your tuna from catch to can — verified on Arbitrum Sepolia
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mb-4"
          >
            <div
              className={`relative max-w-2xl mx-auto transition-all duration-300 ${
                isFocused ? "scale-105" : "scale-100"
              }`}
            >
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                  isFocused
                    ? "bg-ocean/20 blur-xl"
                    : "bg-transparent"
                }`}
              />
              <div className="relative flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.1] hover:border-white/[0.2] transition-all duration-300 backdrop-blur-sm">
                <Search className="w-5 h-5 text-ocean flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by lot code (e.g., TORO-LOT-001)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-lg"
                />
              </div>

              {/* Search Results Dropdown */}
              {searchQuery && filteredLots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-4 w-full max-w-2xl left-1/2 -translate-x-1/2 bg-white/[0.05] border border-white/[0.1] rounded-xl backdrop-blur-sm overflow-hidden z-20"
                >
                  {filteredLots.map((lot) => (
                    <motion.button
                      key={lot.id}
                      onClick={() => handleSearch(lot.id)}
                      className="w-full px-6 py-4 text-left hover:bg-white/[0.05] transition-colors border-b border-white/[0.05] last:border-b-0"
                      whileHover={{ paddingLeft: 24 }}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-ocean flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">{lot.id}</p>
                          <p className="text-white/40 text-sm">{lot.label}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Featured Products
            </h2>
            <p className="text-white/40">Explore verified batches on Arbitrum Sepolia</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_LOTS.map((lot, i) => (
              <motion.button
                key={lot.id}
                onClick={() => handleSearch(lot.id)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-left group"
              >
                <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-ocean/30 hover:border-ocean/60 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <Package className="w-8 h-8 text-ocean group-hover:scale-110 transition-transform" />
                    <span className="px-3 py-1 rounded-full bg-green/20 text-green text-xs font-medium border border-green/40">
                      {lot.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{lot.id}</h3>
                  <p className="text-white/60 text-sm mb-4">{lot.label}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">{lot.quantity}</span>
                    <span className="text-ocean text-sm font-medium group-hover:translate-x-1 transition-transform">
                      View Trace →
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <span className="text-xs text-white/30">{lot.batches} input batch{lot.batches > 1 ? "es" : ""}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
