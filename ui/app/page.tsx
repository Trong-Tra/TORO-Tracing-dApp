"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { QrCode, Fish, Factory, ExternalLink } from "lucide-react";
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
    router.push("/trace/MOTN3042");
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
    { name: "Chau", image: "/team-mascot/BA.png", twitter: "https://x.com/ChowThanks" },
    { name: "Hoang", image: "/team-mascot/Graph.png", twitter: "" },
    { name: "Duy", image: "/team-mascot/Web-app.png", twitter: "" },
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
                <span className="text-ocean">T</span>rustless 
                <span className="text-ocean">O</span>ceanic
                <br />
                <span className="text-ocean">R</span>ecord of{" "}
                <span className="text-ocean">O</span>rigin
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-base text-white/40 mb-5 font-mono tracking-wide"
              >
                Traceability Platform for Seafood Supply Chains
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
                  Start Tracing →
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

      {/* ─── WHY TORO ─── */}
      <section id="about" className="relative px-6 md:px-10 py-24 bg-gradient-to-br from-[#0a1628] via-[#0c1f3a] to-[#0a1628] overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-ocean/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 * 0.15 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-ocean/20 to-ocean/0 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              {/* Card */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-ocean/30 hover:border-ocean/60 transition-all duration-300 backdrop-blur-sm h-full">
                <h3 className="text-2xl font-bold text-white mb-4">Immutable Origin</h3>
                <p className="text-base text-white/60 leading-relaxed">
                  Wild catch or farm-raised, every tuna batch is minted as a traceable UTxO on Cardano from day one. Not a database entry. Not a PDF. A cryptographic proof that survives forever, even if the company disappears.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-gold/0 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              {/* Card */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-gold/30 hover:border-gold/60 transition-all duration-300 backdrop-blur-sm h-full">
                <h3 className="text-2xl font-bold text-white mb-4">Cardano Deflationary Engine</h3>
                <p className="text-base text-white/60 leading-relaxed">
                  TORO doesn't just use Cardano. Every final product UTxO permanently locks ADA in an immutable script, removing supply from circulation forever. Every trace transaction pays fees, validates blocks, and keeps the network alive. We turned tuna cans into a deflationary engine for ADA.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-gold/0 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              {/* Card */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-gold/30 hover:border-gold/60 transition-all duration-300 backdrop-blur-sm h-full">
                <h3 className="text-2xl font-bold text-white mb-4">Zero-Trust Verification</h3>
                <p className="text-base text-white/60 leading-relaxed">
                  No central server to hack. No admin panel to fake. Every datum, location, weight, certificate hash, lives on-chain. Reconstruct the full supply chain from any Cardano explorer using just the batch ID. We can't alter history even if we wanted to.
                </p>
              </div>
              
              {/* Mascot */}
              <div className="absolute -bottom-20 -right-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none">
                <img 
                  src="/TORO-mascot-about-section.png" 
                  alt="TORO Mascot" 
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW TORO WORK ─── */}
      <section className="relative px-6 md:px-10 py-24 bg-[#0a1628] overflow-visible">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full rounded-2xl overflow-hidden"
          >
            <img 
              src="/HowTORO.png" 
              alt="How TORO Works" 
              className="w-full h-auto object-cover"
            />
          </motion.div>
          
          {/* Mascot */}
          <div className="absolute -bottom-24 -right-24 w-40 h-40 md:w-48 md:h-48 pointer-events-none">
            <img 
              src="/TORO-mascot-howto-section.png" 
              alt="TORO Mascot" 
              className="w-full h-full object-contain"
            />
          </div>
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
                    {member.twitter && (
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