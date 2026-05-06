"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, Fish, Factory, ShieldCheck, ExternalLink, TrendingUp } from "lucide-react";
import Can3D from "@/components/Can3D";

export default function LandingPage() {
  const router = useRouter();

  const handleTraceClick = () => {
    router.push("/trace?batch=MOTN3042");
  };

  const stats = [
    {
      label: "Cans Traced On-Chain",
      value: "5,440",
      sub: "Batch MOTN3042",
      icon: <TrendingUp className="w-4 h-4 text-green" />,
    },
    {
      label: "Supply Chain Stages",
      value: "9",
      sub: "Fully Verified",
      icon: <ShieldCheck className="w-4 h-4 text-ocean" />,
    },
    {
      label: "ADA Locked in Script",
      value: "2.05",
      sub: "In Trace Contract",
      icon: <Fish className="w-4 h-4 text-gold" />,
    },
  ];

  const features = [
    {
      icon: <Fish className="w-8 h-8 text-ocean" />,
      title: "Catch",
      desc: "Wild-caught or farm-raised, every batch starts with verified origin data on Cardano.",
    },
    {
      icon: <Factory className="w-8 h-8 text-gold" />,
      title: "Process",
      desc: "From ice to can — each stage is recorded immutably using CIP-68 standard.",
    },
    {
      icon: <QrCode className="w-8 h-8 text-green" />,
      title: "Verify",
      desc: "Scan the QR code on any TORO can to see the full chain of custody instantly.",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* ─── HERO SECTION ─── */}
      <section
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{
          backgroundImage: "url(/Dark_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/80 via-transparent to-[#0a1628]/40 pointer-events-none" />

        {/* Wave SVGs at bottom */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 200" fill="none">
            <path d="M0 100C240 180 480 20 720 100C960 180 1200 20 1440 100V200H0V100Z" fill="#3e96cc" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full opacity-5" viewBox="0 0 1440 200" fill="none">
            <path d="M0 140C240 60 480 180 720 140C960 60 1200 180 1440 140V200H0V140Z" fill="#ffc354" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-36 pb-8 flex-1 flex items-center">
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10 lg:gap-12 w-full lg:justify-between">
            {/* LEFT: Text */}
            <div className="flex-1 lg:max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-ocean text-sm font-medium mb-5"
              >
                <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
                Cardano Preview Testnet
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-6xl font-bold text-white leading-[1.1] mb-4"
              >
                Trustless Oceanic
                <br />
                Record of{" "}
                <span className="text-ocean">Origin</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-base text-white/40 mb-5 font-mono tracking-wide"
              >
                T.O.R.O. — Traceability Platform for Seafood Supply Chains
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-base text-white/50 max-w-md mb-7 leading-relaxed"
              >
                The next generation traceability platform. From ocean to shelf,
                every tuna can is immutably verified on Cardano using CIP-68 standards.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center gap-3"
              >
                <button
                  onClick={handleTraceClick}
                  className="px-6 py-3 rounded-xl bg-ocean text-white font-semibold hover:bg-ocean/80 transition-all shadow-lg shadow-ocean/25 text-sm"
                >
                  Explore Trace →
                </button>
                <a
                  href="https://preview.cardanoscan.io/tokenPolicy/def68337867cb4f1f95b6b811fedbfcdd7780d10a95cc072077088ea"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Cardanoscan
                </a>
              </motion.div>
            </div>

            {/* RIGHT: 3D Can */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="flex-shrink-0 w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] h-[360px] sm:h-[420px] lg:h-[500px] relative"
            >
              <div className="absolute inset-0 bg-ocean/10 blur-3xl rounded-full scale-75" />
              <Can3D onCanClick={handleTraceClick} />
            </motion.div>
          </div>
        </div>

        {/* ─── STATS BAR ─── */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-6 md:px-8 py-4 flex flex-wrap items-center justify-between gap-4"
          >
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-bold text-white leading-tight">{stat.value}</p>
                  <p className="text-[10px] text-white/30">{stat.sub}</p>
                </div>
              </div>
            ))}

            <div className="hidden md:block w-px h-10 bg-white/10" />
            <a
              href="https://preview.cardanoscan.io/tokenPolicy/def68337867cb4f1f95b6b811fedbfcdd7780d10a95cc072077088ea"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs text-white/30 hover:text-ocean transition-colors no-underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="font-mono">Policy</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative px-6 md:px-10 py-20 bg-[#0a1628]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-white/40 max-w-md mx-auto">
              Complete supply chain transparency from catch to can
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECH HIGHLIGHTS ─── */}
      <section className="relative px-6 md:px-10 py-20 bg-gradient-to-b from-[#0a1628] to-[#0c1f3a]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Built on Cardano</h2>
            <p className="text-white/40">Enterprise-grade blockchain infrastructure</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6 text-green" />,
                title: "CIP-68 Standard",
                desc: "Reference and user token pairs ensure each product has a unique, traceable on-chain identity.",
              },
              {
                icon: <Fish className="w-6 h-6 text-ocean" />,
                title: "Immutable Trace",
                desc: "Every stage — hatchery, growout, catch, processing — is written as typed inline datums.",
              },
              {
                icon: <QrCode className="w-6 h-6 text-gold" />,
                title: "Consumer Friendly",
                desc: "No wallet needed. Scan a QR code to instantly verify origin and journey.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-4 hover:border-white/[0.1] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section
        className="px-6 md:px-10 py-20 relative"
        style={{
          backgroundImage: "url(/Default_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-[#0a1628]/70" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto text-center p-10 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to see the full trace?
          </h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto">
            Explore the complete journey of batch MOTN3042 — from hatchery and
            catch to 5,440 cans, all verified on-chain.
          </p>
          <button
            onClick={handleTraceClick}
            className="px-8 py-3.5 rounded-xl bg-ocean text-white font-semibold hover:bg-ocean/80 transition-colors shadow-lg shadow-ocean/20"
          >
            Explore Trace →
          </button>
        </motion.div>
      </section>
    </div>
  );
}
