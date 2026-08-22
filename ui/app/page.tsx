"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { QrCode, Fish, Factory, ExternalLink, Lock, Network, ShieldCheck } from "lucide-react";
import Can3D from "@/components/Can3D";
import traceIndex from "@/src/data/traceIndex.json";
import TraceTreeAnimation from "@/components/TraceTreeAnimation";

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
    router.push("/trace");
  };

  // ── Annotation offset — tweak these two values to reposition
  // the entire annotation (lines + dots + text) as a unit.
  // Negative AX = move left, negative AY = move up.
  const AX = -80;
  const AY = -100;

  const lots = Object.values(traceIndex.lots);
  const totalCans = lots.reduce((s, l: any) => s + (l.totalCans || 0), 0);
  const totalEvents = lots.reduce((s, l: any) => {
    let count = (l.lotTraces || []).length;
    l.batches?.forEach((b: any) => {
      count += (b.trace || []).length;
    });
    return s + count;
  }, 0);

  const stats = [
    {
      label: "Products Traced",
      value: totalCans.toLocaleString(),
    },
    {
      label: "Supply Chain Events",
      value: totalEvents.toLocaleString(),
    },
  ];

  const partners = [
    "/partner/Blockyouth.png",
    "/partner/Cardano.png",
    "/partner/Ezai.png",
    "/partner/HIEC.png",
    "/partner/Hub.png",
    "/partner/NIIC.png",
    "/partner/NJEC.png",
    "/partner/NTT.png",
    "/partner/NetCorp.png",
    "/partner/Teen Innovation.png",
    "/partner/UISC.png",
    "/partner/UniLab.png",
    "/partner/Vcioncheck.png",
    "/partner/bitget.png",
    "/partner/ihub.png",
  ];

  const team = [
    { name: "Tron", image: "/team-mascot/Blockchain.png", twitter: "https://x.com/Trx_Tra" },
    { name: "Chow", image: "/team-mascot/BA.png", twitter: "https://x.com/ChowThanks" },
    { name: "Hoang", image: "/team-mascot/Graph.png", twitter: "" },
    { name: "Duy", image: "/team-mascot/Web-app.png", twitter: "https://x.com/DanDuy4" },
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
                Solana Devnet
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-6xl font-bold text-white leading-[1.1] mb-4"
              >
                <span className="text-ocean">T</span>rustless{" "}
                <span className="text-ocean">O</span>ceanic
                <br />
                <span className="text-ocean">R</span>ecord of{" "}
                <span className="text-ocean">O</span>rigin
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center gap-2 mb-5"
              >
                <p className="text-base text-white/40 font-mono tracking-wide">
                  Traceability Platform for Seafood Supply Chains
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-base text-white/50 max-w-md mb-7 leading-relaxed"
              >
                The next generation traceability platform. From ocean to shelf,
                every product is immutably verified on Solana.
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
                  Start Tracing →
                </button>
                <a
                  href="https://solscan.io/account/2cbYretd93guxpURxqhq1UedBtwSHzT2NX6MsrBc4FWc?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Solscan
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
                <div
                  className="flex gap-6 md:gap-8 animate-scroll"
                  style={{ animationDuration: "40s" }}
                >
                  {[...partners, ...partners].map((logo, i) => (
                    <div
                      key={`partner-${i}`}
                      className="flex-shrink-0 h-8 md:h-10 flex items-center justify-center px-1"
                    >
                      <img
                        src={logo}
                        alt=""
                        draggable={false}
                        className="h-full w-auto max-w-[120px] object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── TRACE TREE ANIMATION ─── */}
      <section className="relative px-6 md:px-10 py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              From <span className="text-ocean">Ocean</span> to <span className="text-gold">Shelf</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Every batch traces its journey. Multiple sources merge into a single verified product lot.
            </p>
          </motion.div>
          <TraceTreeAnimation />
        </div>
      </section>

      {/* ─── WHY TORO ─── */}
      <section id="about" className="relative px-6 md:px-10 py-24 bg-gradient-to-br from-[#0a1628] via-[#0c1f3a] to-[#0a1628] overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-ocean/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Toro</h2>
            <p className="text-white/40 max-w-2xl mx-auto text-lg">
              Building trust through transparency and cryptographic proof
            </p>
          </motion.div>

          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            {[
              {
                title: "Immutable Origin",
                body: "Wild catch or farm-raised, every tuna batch is registered as its own on-chain account on Solana from day one. Not a database entry. Not a PDF. A cryptographic proof that survives forever, even if the company disappears.",
                icon: Lock,
                accent: "ocean",
                link: { href: "/trace", label: "Trace a product" },
              },
              {
                title: "Intelligent Graph-based Data Model",
                body: "Batches and lots form a living graph on-chain. Multiple sources merge into a single verified lot, and every merge permanently links inputs to outputs — the full journey is one query away.",
                icon: Network,
                accent: "gold",
                link: { href: "/trustgraph", label: "Explore the graph" },
              },
              {
                title: "Made Simple for Any Seafood Exportation System",
                body: "Compact code-based payloads and a ready-made indexer plug into existing export workflows. Stations record with a scan — no blockchain expertise needed on the factory floor.",
                icon: QrCode,
                accent: "ocean",
              },
              {
                title: "Secure with Certificate MPC Signature",
                body: "Today, role-based station keys sign every step. Tomorrow: threshold MPC signatures bound to HACCP certificates, so no single key can ever forge a step in the chain.",
                icon: ShieldCheck,
                accent: "gold",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group relative snap-center shrink-0 w-[85%] sm:w-[400px] lg:w-auto rounded-3xl border p-8 flex flex-col min-h-[420px] transition-all duration-300 backdrop-blur-sm ${
                  card.accent === "ocean"
                    ? "border-ocean/30 hover:border-ocean/60 bg-gradient-to-b from-white/[0.07] to-white/[0.02]"
                    : "border-gold/30 hover:border-gold/60 bg-gradient-to-b from-white/[0.07] to-white/[0.02]"
                }`}
              >
                {/* Hover glow */}
                <div
                  className={`absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none ${
                    card.accent === "ocean"
                      ? "bg-gradient-to-r from-ocean/20 to-ocean/0"
                      : "bg-gradient-to-r from-gold/20 to-gold/0"
                  }`}
                />

                <h3 className="relative text-2xl font-bold text-white text-center mb-4 leading-snug">
                  {card.title}
                </h3>
                <p className="relative text-sm text-white/55 text-center leading-relaxed">
                  {card.body}
                </p>

                {card.link && (
                  <div className="relative text-center mt-5">
                    <a
                      href={card.link.href}
                      className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all no-underline ${
                        card.accent === "ocean"
                          ? "bg-ocean/15 text-ocean hover:bg-ocean/25"
                          : "bg-gold/15 text-gold hover:bg-gold/25"
                      }`}
                    >
                      {card.link.label} →
                    </a>
                  </div>
                )}

                {/* Bottom visual */}
                <div className="relative mt-auto pt-10 flex items-end justify-center">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
                      card.accent === "ocean"
                        ? "bg-ocean/10 border-ocean/30 shadow-[0_0_40px_-8px] shadow-ocean/40"
                        : "bg-gold/10 border-gold/30 shadow-[0_0_40px_-8px] shadow-gold/40"
                    }`}
                  >
                    <card.icon
                      className={`w-9 h-9 ${card.accent === "ocean" ? "text-ocean" : "text-gold"}`}
                    />
                  </div>
                </div>

                {/* Mascot on the last card */}
                {i === 3 && (
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 md:w-28 md:h-28 pointer-events-none">
                    <img
                      src="/TORO-mascot-about-section.png"
                      alt="TORO Mascot"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FIELD APP ─── */}
      <section className="relative px-6 md:px-10 py-24 bg-[#0a1628] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 w-96 h-96 bg-ocean/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for the <span className="text-ocean">Factory Floor</span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              When TORO deploys at an exportation facility, employees don't touch
              a blockchain — they use a simple mobile app. Scan the batch, confirm
              the step, done. Every tap becomes a signed, immutable record on Solana.
            </p>
            <ul className="space-y-5">
              {[
                {
                  title: "Scan & record in seconds",
                  desc: "Workers scan the batch QR at each station — receiving, processing, packing — and the app records the stage on-chain.",
                },
                {
                  title: "Roles enforced by the protocol",
                  desc: "Factory signers and stations can only perform their own steps. Permissions live on-chain, not in an admin panel.",
                },
                {
                  title: "Nothing to learn",
                  desc: "No wallets, no gas, no jargon on screen. The app handles keys and transactions behind the scenes.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-ocean flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold mb-1">{item.title}</p>
                    <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT: Phone frame with demo video */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex justify-center"
          >
            <div className="relative w-[280px] sm:w-[300px]">
              {/* Glow */}
              <div className="absolute inset-0 bg-ocean/20 rounded-[3rem] blur-3xl scale-95 pointer-events-none" />
              {/* Frame */}
              <div className="relative rounded-[3rem] border border-white/15 bg-[#0c1f3a] p-2.5 shadow-2xl shadow-black/50">
                <div className="relative rounded-[2.4rem] overflow-hidden bg-black aspect-[9/19.5]">
                  {/* Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10 border border-white/10" />
                  <video
                    src="/toro-app-demo.mp4"
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── DEBUT ─── */}
      <section className="relative px-6 md:px-10 py-24 bg-gradient-to-b from-[#0a1628] to-[#0c1f3a] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-72 bg-ocean/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-ocean text-sm font-semibold tracking-[0.3em] uppercase mb-4">
              Featured Debut
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              TORO at <span className="text-gold">THE NEXGEN 2026</span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Presented by the Innovative Entrepreneurship Center VNU-HCM in
              collaboration with New Energy Nexus Vietnam — watch TORO&apos;s
              debut on stage, currently sitting at{" "}
              <span className="text-white font-semibold">6,343 views</span>.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="relative rounded-2xl border border-white/10 bg-[#0c1f3a] p-2 shadow-2xl shadow-black/50"
            >
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/nYXbrbKheQQ"
                  title="THE NEXGEN 2026 | DỰ ÁN TORO"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </motion.div>

            <p className="text-white/35 text-sm mt-6">
              Innovative Entrepreneurship Center VNU-HCM &middot; New Energy
              Nexus Vietnam
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── TEAM ─── */}
      <section id="team" className="relative px-6 md:px-10 py-20 bg-[#0a1628]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Team</h2>
            <p className="text-white/40 max-w-2xl mx-auto text-lg">
              Building the future of seafood traceability
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-ocean/30 to-gold/20 border border-white/10 flex items-center justify-center group hover:border-white/30 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="relative z-10 w-full h-full object-cover scale-125 group-hover:scale-140 transition-transform duration-500"
                  />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-white font-bold text-lg">{member.name}</h3>
                    {member.twitter ? (
                      <a 
                        href={member.twitter} 
                        className="text-white/40 hover:text-white transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg 
                          viewBox="0 0 512 512" 
                          className="w-4 h-4" 
                          fill="currentColor"
                        >
                          <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-white/20">
                        <svg 
                          viewBox="0 0 512 512" 
                          className="w-4 h-4" 
                          fill="currentColor"
                        >
                          <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}