"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export default function TracePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/trace/${searchQuery.trim()}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a1628] pt-20">
      <section className="relative px-6 md:px-10 py-24 md:py-32 bg-gradient-to-b from-[#0c1f3a] to-[#0a1628]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-0 w-96 h-96 bg-ocean/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              TORO Product Explorer
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-12">
              Trace your tuna from catch to can
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div
              className={`relative max-w-2xl mx-auto transition-all duration-300 ${
                isFocused ? "scale-105" : "scale-100"
              }`}
            >
              <div className="relative flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.1] hover:border-white/[0.2] transition-all duration-300 backdrop-blur-sm">
                <Search className="w-5 h-5 text-ocean flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Nhập mã lô (ví dụ: TORO-LOT-001)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
