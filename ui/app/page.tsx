"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { QrCode, Fish, Factory, ShieldCheck, ExternalLink, TrendingUp } from "lucide-react";
import Can3D from "@/components/Can3D";

export default function LandingPage() {
  const router = useRouter();
  const [canHovered, setCanHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAnnotation = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setCanHovered(true);
  }, []);

  const hideAnnotation = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setCanHovered(false);
    }, 500);
  }, []);

  const handleTraceClick = () => {
    router.push("/trace?batch=MOTN3042");
  };

  // ── Annotation offset — tweak these two values to reposition
  // the entire annotation (lines + dots + text) as a unit.
  // Negative AX = move left, negative AY = move up.
  const AX = -80;
  const AY = -100;

  const stats = [
    {
      label: "Traceable Products",
      value: "5,440",
    },
    {
      label: "Total ADA Locked",
      value: "2.05",
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
        className="relative flex flex-col justify-center pb-0"
        style={{
          backgroundImage: "url(/Dark_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
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
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-36 pb-32 flex-1 flex items-center">
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
              className="flex-shrink-0 w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] h-[420px] sm:h-[480px] lg:h-[560px] relative"
            >
              <div className="absolute inset-0 bg-ocean/10 blur-3xl rounded-full scale-75" />
              <Can3D onHoverChange={(h) => (h ? showAnnotation() : hideAnnotation())} />

              {/* ── 2D Annotation overlay ── */}
              {canHovered && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 460 500"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Line 1 — diagonal upward */}
                  <motion.path
                    d={`M ${300 + AX} ${240 + AY} L ${360 + AX} ${150 + AY}`}
                    stroke="#3e96cc"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {/* Line 2 — horizontal right */}
                  <motion.path
                    d={`M ${360 + AX} ${150 + AY} L ${440 + AX} ${150 + AY}`}
                    stroke="#3e96cc"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.35 }}
                  />
                  {/* Start dot */}
                  {/* <motion.circle
                    cx={300 + AX}
                    cy={240 + AY}
                    r="4"
                    fill="#3e96cc"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  /> */}
                  {/* Junction dot */}
                  <motion.circle
                    cx={360 + AX}
                    cy={150 + AY}
                    r="4"
                    fill="#3e96cc"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.4 }}
                  />
                  {/* End dot */}
                  <motion.circle
                    cx={440 + AX}
                    cy={150 + AY}
                    r="4"
                    fill="#3e96cc"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.7 }}
                  />
                </svg>
              )}

              {/* Clickable text label */}
              {canHovered && (
                <motion.div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    top: "8%",
                    left: "63%",
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.65, ease: "easeOut" }}
                  onClick={handleTraceClick}
                  onMouseEnter={showAnnotation}
                  onMouseLeave={hideAnnotation}
                >
                  <span
                    className="text-white text-[13px] font-medium whitespace-nowrap"
                    style={{
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      textDecorationColor: "#3e96cc",
                      textDecorationThickness: "1.5px",
                    }}
                  >
                    Learn about this can of tuna →
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <div className="relative px-6 md:px-10 -mt-40 pb-8 z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-7xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 md:px-8 py-5 md:py-6">
            {/* Stats - Left side */}
            <div className="flex items-center gap-10 md:gap-20 flex-nowrap">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-start flex-shrink-0">
                  <p className="text-xs md:text-sm text-white/40 uppercase tracking-wider font-medium whitespace-nowrap">{stat.label}</p>
                  <p className="text-3xl md:text-4xl font-bold text-white whitespace-nowrap">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-white/40 mx-4 md:mx-8 flex-shrink-0" />

            {/* Partnership - Right side */}
            <div className="flex-1 flex items-center gap-4 md:gap-6 px-4 md:px-8">
              <p className="text-base md:text-lg text-white/60 uppercase tracking-wider font-semibold whitespace-nowrap">Partners</p>
              
              {/* Scrolling partners */}
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-3 md:gap-4 animate-scroll">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gold/30 to-orange/20 border border-gold/30 flex items-center justify-center"
                    >
                      <Fish className="w-6 h-6 md:w-8 md:h-8 text-gold" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
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