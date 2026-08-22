"use client";

import { motion } from "framer-motion";
import {
  Gift,
  Gavel,
  Wallet,
  Network,
} from "lucide-react";
import TrustGraphSimulator from "@/components/TrustGraphSimulator";

const Math = ({ children }: { children: React.ReactNode }) => (
  <span className="font-serif italic font-semibold text-ocean">{children}</span>
);

export default function TrustGraphPage() {
  return (
    <div className="flex flex-col min-h-full bg-[#0a1628]">
      {/* ─── HERO ─── */}
      <section className="relative px-6 py-16 md:py-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-ocean/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <p className="mb-4 text-sm md:text-base text-gold/90 font-medium tracking-wide uppercase">
            Whitepaper is under construction and will be updated soon.
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            <span className="text-ocean">T</span>rust
            <span className="text-ocean">G</span>raph{" "}
            <span className="text-gold">Protocol 2.0</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed">
            Graph & AI-based Trust Evaluation Network for High-Risk Food /
            Seafood Supply Chains
          </p>
        </motion.div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT: Interactive Simulator */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 self-start">
          <TrustGraphSimulator />
        </div>

        {/* RIGHT: Whitepaper Content */}
        <div className="lg:col-span-7">
          {/* ═══ Section I ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white border-b-2 border-ocean pb-2 mb-5">
              I. Vision & Technological Philosophy
            </h2>
            <p className="text-white/60 mb-4 leading-relaxed">
              The system completely resolves the{" "}
              <strong className="text-white">
                &quot;Garbage In - Garbage Out&quot; (GIGO)
              </strong>{" "}
              dilemma on Blockchain using a{" "}
              <strong className="text-white">Zero-Trust philosophy</strong>.
            </p>
            <div className="bg-ocean/5 border-l-4 border-ocean p-4 text-white/70 rounded-r-lg">
              Instead of considering Blockchain as the core, the project
              positions it merely as an <em>&quot;Evidence Storage Layer&quot;</em>. The
              heart and brain of the system lie in two core technologies: the{" "}
              <strong className="text-white">Graph Analytics Engine</strong> and
              the <strong className="text-white">Dynamic AI Risk Engine</strong>
              , combined with a human network (Human Protocol) to verify
              physical truths before recording them on-chain.
            </div>
          </motion.section>

          {/* ═══ Section II ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white border-b-2 border-ocean pb-2 mb-6">
              II. System Architecture (5 Core Layers Model)
            </h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              The new architecture is built around two AI cores, processing data
              across 5 distinct layers:
            </p>

            {/* Layer 1 */}
            <div className="mb-6 ml-4 relative">
              <div className="absolute -left-8 top-1 w-6 h-6 bg-surface-light text-white rounded-full flex items-center justify-center text-xs font-bold border border-white/10">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Layer 1: Human Oracle Input Layer
              </h3>
              <p className="text-white/50 mb-2 leading-relaxed">
                The entry point for real-world data, including physical and
                logical checkpoints:
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-2 leading-relaxed">
                <li>
                  <strong className="text-white">Proof of Action:</strong> Users
                  must upload media (photos/videos of feed packaging, water test
                  results) with embedded metadata (GPS, Timestamp) instead of
                  just entering text.
                </li>
                <li>
                  <strong className="text-white">Rule-based Validation:</strong>{" "}
                  Automatically scans for basic logical errors (incorrect yield
                  inputs, manipulation speed violations, duplicate IDs).
                </li>
                <li>
                  <strong className="text-white">DAG Topological Check:</strong>{" "}
                  Ensures batches strictly follow the Directed Acyclic Graph
                  (DAG) sequence, prohibiting any illegal bypasses.
                </li>
              </ul>
            </div>

            {/* Layer 2 */}
            <div className="mb-6 ml-4 relative bg-ocean/5 p-5 rounded-xl border border-ocean/20">
              <div className="absolute -left-4 -top-3 w-8 h-8 bg-ocean text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-ocean mb-2">
                [CORE 1] Network Graph Analytics Engine
              </h3>
              <p className="text-white/50 mb-2 leading-relaxed">
                Data is pushed into a Graph Database (e.g., Neo4j). This acts as
                the &quot;Eye&quot; of the system, utilizing Graph Neural Networks (GNN) to
                scan for micro and macro fraud behaviors:
              </p>
              <ul className="list-disc list-inside space-y-2 text-white/60 ml-2 leading-relaxed">
                <li>
                  <span className="text-amber-400 font-semibold">
                    Collusion Clique Detection:
                  </span>{" "}
                  Utilizes <em>Louvain / Watts-Strogatz</em> algorithms to
                  identify closed node clusters (farmers/officials) continuously
                  cross-verifying each other to form isolated factions.
                </li>
                <li>
                  <span className="text-amber-400 font-semibold">
                    Pair-Risk Evaluation:
                  </span>{" "}
                  Uses the <em>Adamic-Adar</em> index to monitor
                  &quot;Submitter/Approver&quot; pairs. An overly high ratio of
                  internal transactions triggers a red flag.
                </li>
                <li>
                  <span className="text-amber-400 font-semibold">
                    Link Prediction:
                  </span>{" "}
                  The GNN model proactively predicts an account&apos;s fraud risk
                  based on its positional shift within the network, even before a
                  violation occurs.
                </li>
              </ul>
            </div>

            {/* Layer 3 */}
            <div className="mb-6 ml-4 relative bg-purple-500/5 p-5 rounded-xl border border-purple-500/20">
              <div className="absolute -left-4 -top-3 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">
                [CORE 2] Dynamic AI Risk Engine
              </h3>
              <p className="text-white/50 mb-2 leading-relaxed">
                This is the &quot;Brain&quot; delivering the final verdict. Replacing
                simple linear formulas, the system deploys Non-linear Machine
                Learning algorithms (such as XGBoost or Random Forest) to
                calculate:
              </p>
              <ul className="list-disc list-inside space-y-2 text-white/60 ml-2 leading-relaxed">
                <li>
                  <strong className="text-white">Contextual Adaptive Weights:</strong>{" "}
                  The ML model self-adjusts risk levels based on time (disease
                  seasons), geographical location, and batch nature.
                </li>
                <li>
                  <strong className="text-white">
                    Risk Score (<Math>R<sub>i</sub></Math>):
                  </strong>{" "}
                  The metric evaluating the toxicity/fraud probability of a batch.
                </li>
                <li>
                  <strong className="text-white">
                    Trust Score (<Math>T<sub>i</sub></Math>):
                  </strong>{" "}
                  A Beta Reputation System evaluating accumulated individual
                  trustworthiness.
                </li>
                <li>
                  <strong className="text-white">Kill-switch Mechanism:</strong>{" "}
                  Bypasses all past reputation, instigating an immediate
                  rejection (<Math>R<sub>i</sub> = MAX</Math>) if critical errors
                  (e.g., banned antibiotic residue) are detected.
                </li>
              </ul>
            </div>

            {/* Layer 4 */}
            <div className="mb-6 ml-4 relative">
              <div className="absolute -left-8 top-1 w-6 h-6 bg-surface-light text-white rounded-full flex items-center justify-center text-xs font-bold border border-white/10">
                4
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Layer 4: Execution & Consensus Layer
              </h3>
              <p className="text-white/50 mb-3 leading-relaxed">
                Based on Graph and Risk AI outputs, Smart Contracts automatically
                route the workflow:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg">
                  <div className="font-bold text-emerald-400 mb-1 text-sm">
                    Green Zone (Auto-Approve)
                  </div>
                  <div className="text-xs text-white/50 leading-relaxed">
                    Low <Math>R<sub>i</sub></Math>, valid DAG &rarr; Approved,{" "}
                    <Math>T<sub>i</sub></Math> added to Validator, recorded on
                    Blockchain.
                  </div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg">
                  <div className="font-bold text-amber-400 mb-1 text-sm">
                    Yellow Zone (Pending)
                  </div>
                  <div className="text-xs text-white/50 leading-relaxed">
                    Suspicious <Math>R<sub>i</sub></Math> &rarr; Held. Dispatches
                    1-2 random, graph-distant Validators for a Cross-check /
                    Random Audit.
                  </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg">
                  <div className="font-bold text-red-400 mb-1 text-sm">
                    Red Zone (Reject/Slashing)
                  </div>
                  <div className="text-xs text-white/50 leading-relaxed">
                    Critical error / Collusion &rarr; Transaction cancelled,
                    severe <Math>T<sub>i</sub></Math> deduction, and stake
                    slashed.
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 5 */}
            <div className="mb-6 ml-4 relative">
              <div className="absolute -left-8 top-1 w-6 h-6 bg-surface-light text-white rounded-full flex items-center justify-center text-xs font-bold border border-white/10">
                5
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Layer 5: Decentralized Storage & Oracle Ecosystem
              </h3>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-2 leading-relaxed">
                <li>
                  Only clean data that passes Layer 4 (along with Evidence Hash,
                  Risk Score, and Trust Score) is permanently immutably written
                  to the Blockchain.
                </li>
                <li>
                  <strong className="text-white">Oracle API Provision:</strong>{" "}
                  Opens APIs allowing external systems to query verified trust
                  data.
                </li>
              </ul>
            </div>
          </motion.section>

          {/* ═══ Section III ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white border-b-2 border-ocean pb-2 mb-4">
              III. Incentive Mechanism & Game Theory
            </h2>
            <p className="text-white/60 mb-3 leading-relaxed">
              The system implements Game Theory to naturally steer user behavior
              toward honesty:
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <Gift className="w-5 h-5 text-emerald-400 mt-1 mr-3 flex-shrink-0" />
                <div className="text-white/60 leading-relaxed">
                  <strong className="text-white">Reputation Rewards:</strong>{" "}
                  Farmers/Validators maintaining a high Trust Score (
                  <Math>T<sub>i</sub></Math>) receive priority approval
                  processing or earn token rewards during surprise cross-checks.
                </div>
              </div>
              <div className="flex items-start">
                <Gavel className="w-5 h-5 text-red-400 mt-1 mr-3 flex-shrink-0" />
                <div className="text-white/60 leading-relaxed">
                  <strong className="text-white">Slashing Penalties:</strong>{" "}
                  Attempting to &quot;bribe&quot; verifiers becomes futile because the
                  Graph Engine (Core 1) detects anomalous links, prompting the
                  Risk Engine (Core 2) to impose heavy reputation penalties,
                  eventually disabling the compromised account from platform
                  operations.
                </div>
              </div>
            </div>
          </motion.section>

          {/* ═══ Section IV ═══ */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-white border-b-2 border-ocean pb-2 mb-4">
              IV. Commercial Value Unlocking (New Business Models)
            </h2>
            <p className="text-white/60 mb-4 leading-relaxed">
              With this architecture, the project transcends traditional SaaS for
              a single seafood company, unlocking revenue from 2 core models:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-ocean/30 transition-all duration-300">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-ocean/10 text-ocean rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-white">
                    1. &quot;Trust Oracle API&quot; Model (B2B)
                  </h3>
                </div>
                <ul className="list-disc list-inside text-sm text-white/50 space-y-2 leading-relaxed">
                  <li>
                    Packaging the system as a specialized Supply Chain Risk
                    Oracle.
                  </li>
                  <li>
                    E-commerce platforms, supermarket chains, or international
                    certifiers (e.g., ASC, GlobalGAP) can call your API to ask:{" "}
                    <em>
                      &quot;What is the probability of documentation collusion risk for
                      this shrimp batch?&quot;
                    </em>
                  </li>
                </ul>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-gold/30 transition-all duration-300">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-white">
                    2. DeFi Agricultural Lending Model
                  </h3>
                </div>
                <ul className="list-disc list-inside text-sm text-white/50 space-y-2 leading-relaxed">
                  <li>
                    Integrating with Banks or Decentralized Finance (DeFi)
                    protocols.
                  </li>
                  <li>
                    Utilizing the Trust Score (<Math>T<sub>i</sub></Math>) and
                    Farmer behavior graphs as a Decentralized Credit Score.
                  </li>
                  <li>
                    Banks can automatically approve uncollateralized loans for
                    farmers showcasing transparent networks and maintaining Risk
                    Scores strictly within the Green Zone for 10 consecutive
                    harvests.
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
