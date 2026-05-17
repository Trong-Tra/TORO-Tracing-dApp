"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import {
  GitBranch,
  Users,
  AlertTriangle,
  RefreshCw,
  Brain,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";

/* ─── Types ─── */
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: "farmer" | "validator";
  label: string;
  isAnomaly?: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  isCollusion?: boolean;
  isAnomaly?: boolean;
}

type Scenario = "safe" | "collusion" | "anomaly";

interface DashboardState {
  statusText: string;
  statusIcon: "safe" | "warning" | "danger";
  statusClass: string;
  risk: number;
  featHistory: number;
  featCollusion: number;
  featAnomaly: number;
}

/* ─── Initial Data ─── */
const initialNodes: GraphNode[] = [
  { id: "N1", group: "farmer", label: "Farmer 1" },
  { id: "N2", group: "farmer", label: "Farmer 2" },
  { id: "N3", group: "farmer", label: "Farmer 3" },
  { id: "N4", group: "farmer", label: "Farmer 4" },
  { id: "N5", group: "farmer", label: "Farmer 5" },
  { id: "V1", group: "validator", label: "Validator 1" },
  { id: "V2", group: "validator", label: "Validator 2" },
  { id: "V3", group: "validator", label: "Validator 3" },
  { id: "V4", group: "validator", label: "Validator 4" },
];

const initialLinks: GraphLink[] = [
  { source: "N1", target: "V1" },
  { source: "N2", target: "V3" },
  { source: "N3", target: "V2" },
  { source: "N4", target: "V4" },
  { source: "N5", target: "V1" },
  { source: "N3", target: "V4" },
];

const SAFE_STATE: DashboardState = {
  statusText: "Safe Network",
  statusIcon: "safe",
  statusClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  risk: 25,
  featHistory: 80,
  featCollusion: 10,
  featAnomaly: 10,
};

const COLLUSION_STATE: DashboardState = {
  statusText: "Collusion Cluster Detected",
  statusIcon: "warning",
  statusClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  risk: 65,
  featHistory: 30,
  featCollusion: 60,
  featAnomaly: 10,
};

const ANOMALY_STATE: DashboardState = {
  statusText: "Behavioral Anomaly (LOF > 3.0)",
  statusIcon: "danger",
  statusClass: "bg-red-500/15 text-red-400 border-red-500/30",
  risk: 92,
  featHistory: 10,
  featCollusion: 10,
  featAnomaly: 80,
};

export default function TrustGraphSimulator() {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [scenario, setScenario] = useState<Scenario>("safe");
  const [dash, setDash] = useState<DashboardState>(SAFE_STATE);

  /* ─── D3 Graph ─── */
  const renderGraph = useCallback(() => {
    const container = graphContainerRef.current;
    if (!container) return;

    // Clear previous
    container.innerHTML = "";

    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "block");

    // Clone data (D3 mutates in place)
    let nodes: GraphNode[] = JSON.parse(JSON.stringify(initialNodes));
    let links: GraphLink[] = JSON.parse(JSON.stringify(initialLinks));

    // Apply scenario mutations
    if (scenario === "collusion") {
      const collusionEdges: GraphLink[] = [
        { source: "N1", target: "V1", isCollusion: true },
        { source: "N1", target: "V2", isCollusion: true },
        { source: "N2", target: "V1", isCollusion: true },
        { source: "N2", target: "V2", isCollusion: true },
        { source: "N1", target: "N2", isCollusion: true },
        { source: "V1", target: "V2", isCollusion: true },
      ];
      links = [...links, ...collusionEdges];
    } else if (scenario === "anomaly") {
      const n4 = nodes.find((n) => n.id === "N4");
      if (n4) n4.isAnomaly = true;
      links.push({ source: "N4", target: "V4", isAnomaly: true });
    }

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<GraphNode>().radius(25));

    const linkGroup = svg.append("g").attr("class", "links");
    const nodeGroup = svg.append("g").attr("class", "nodes");
    const labelGroup = svg.append("g").attr("class", "labels");

    function update() {
      const linkSel = linkGroup
        .selectAll<SVGLineElement, GraphLink>("line")
        .data(links);
      linkSel.exit().remove();
      const linkEnter = linkSel
        .enter()
        .append("line")
        .attr("class", (d) =>
          d.isAnomaly ? "link anomaly-link" : "link"
        )
        .attr("stroke-width", (d) => (d.isCollusion ? 3 : 1))
        .attr("stroke", (d) =>
          d.isAnomaly ? "#ef4444" : d.isCollusion ? "#f59e0b" : "#3e96cc55"
        )
        .attr("stroke-opacity", 0.6);
      const linkUpdate = linkEnter.merge(linkSel as any);
      (linkUpdate as any)
        .attr("class", (d: GraphLink) =>
          d.isAnomaly ? "link anomaly-link" : "link"
        )
        .attr("stroke-width", (d: GraphLink) =>
          d.isAnomaly ? 4 : d.isCollusion ? 3 : 1
        )
        .attr("stroke", (d: GraphLink) =>
          d.isAnomaly ? "#ef4444" : d.isCollusion ? "#f59e0b" : "#3e96cc55"
        );

      const nodeSel = nodeGroup
        .selectAll<SVGCircleElement, GraphNode>("circle")
        .data(nodes, (d: any) => d.id);
      nodeSel.exit().remove();
      const nodeEnter = nodeSel
        .enter()
        .append("circle")
        .attr("r", 16)
        .attr("stroke", "#0a1628")
        .attr("stroke-width", 2)
        .attr(
          "class",
          (d) =>
            `node ${
              d.group === "farmer" ? "fill-emerald-500" : "fill-ocean"
            } ${d.isAnomaly ? "anomaly-node" : ""}`
        )
        .call(
          d3
            .drag<SVGCircleElement, GraphNode>()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );
      const nodeUpdate = nodeEnter.merge(nodeSel as any);
      (nodeUpdate as any)
        .attr("class", (d: GraphNode) =>
          `node cursor-pointer ${
            d.group === "farmer" ? "fill-emerald-500" : "fill-ocean"
          } ${d.isAnomaly ? "anomaly-node" : ""}`
        )
        .attr("r", 16);

      const labelSel = labelGroup
        .selectAll<SVGTextElement, GraphNode>("text")
        .data(nodes, (d: any) => d.id);
      labelSel.exit().remove();
      const labelEnter = labelSel
        .enter()
        .append("text")
        .attr("class", "node-label")
        .text((d) => d.id)
        .attr("fill", "#fff")
        .attr("font-size", 10)
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("pointer-events", "none");
      const labelUpdate = labelEnter.merge(labelSel as any);

      simulation.on("tick", () => {
        (linkUpdate as any)
          .attr("x1", (d: any) =>
            Math.max(20, Math.min(width - 20, d.source.x))
          )
          .attr("y1", (d: any) =>
            Math.max(20, Math.min(height - 20, d.source.y))
          )
          .attr("x2", (d: any) =>
            Math.max(20, Math.min(width - 20, d.target.x))
          )
          .attr("y2", (d: any) =>
            Math.max(20, Math.min(height - 20, d.target.y))
          );

        (nodeUpdate as any)
          .attr("cx", (d: any) =>
            Math.max(20, Math.min(width - 20, d.x))
          )
          .attr("cy", (d: any) =>
            Math.max(20, Math.min(height - 20, d.y))
          );

        (labelUpdate as any)
          .attr("x", (d: any) =>
            Math.max(20, Math.min(width - 20, d.x))
          )
          .attr("y", (d: any) =>
            Math.max(20, Math.min(height - 20, d.y))
          );
      });
    }

    update();

    return () => {
      simulation.stop();
      svg.remove();
    };
  }, [scenario]);

  useEffect(() => {
    const cleanup = renderGraph();
    return cleanup;
  }, [renderGraph]);

  const handleScenario = (s: Scenario) => {
    setScenario(s);
    if (s === "safe") setDash(SAFE_STATE);
    if (s === "collusion") setDash(COLLUSION_STATE);
    if (s === "anomaly") setDash(ANOMALY_STATE);
  };

  const riskColor =
    dash.risk <= 30 ? "text-emerald-400" : dash.risk <= 65 ? "text-amber-400" : "text-red-400";
  const riskBarColor =
    dash.risk <= 30 ? "bg-emerald-500" : dash.risk <= 65 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Graph Card ─── */}
      <div className="bg-surface-light/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="bg-white/[0.03] border-b border-white/10 p-4 flex justify-between items-center">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-ocean" />
            Core Graph Simulator (GNN)
          </h2>
        </div>

        {/* Controls */}
        <div className="p-4 flex flex-wrap gap-2 justify-center bg-white/[0.02] border-b border-white/10">
          <button
            onClick={() => handleScenario("collusion")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow transition-colors ${
              scenario === "collusion"
                ? "bg-amber-500 text-white"
                : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1.5" />
            Simulate Collusion
          </button>
          <button
            onClick={() => handleScenario("anomaly")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow transition-colors ${
              scenario === "anomaly"
                ? "bg-red-500 text-white"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
            Inject Anomaly
          </button>
          <button
            onClick={() => handleScenario("safe")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow transition-colors ${
              scenario === "safe"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
            Reset
          </button>
        </div>

        {/* D3 Graph Container */}
        <div
          ref={graphContainerRef}
          className="w-full h-[350px] bg-[#0a1628] relative"
        >
          <div className="absolute top-2 left-2 flex flex-col gap-1 bg-black/40 backdrop-blur p-2 rounded-lg text-[11px] border border-white/10 z-10">
            <div className="flex items-center text-white/70">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mr-2" />
              Farmer (N)
            </div>
            <div className="flex items-center text-white/70">
              <span className="w-2.5 h-2.5 rounded-full bg-ocean inline-block mr-2" />
              Validator (V)
            </div>
          </div>
        </div>
      </div>

      {/* ─── Analytics Dashboard ─── */}
      <div className="bg-surface-light/60 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <h2 className="font-bold text-base text-white mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          ML Risk Engine Dashboard
        </h2>

        {/* Status & Reject Badge */}
        <div className="flex justify-between items-center mb-6 relative">
          <div className="flex-1">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">
              GNN Alert Status
            </p>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border transition-colors duration-500 ${dash.statusClass}`}
            >
              {dash.statusIcon === "safe" && (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              {dash.statusIcon === "warning" && (
                <ShieldAlert className="w-4 h-4 mr-2" />
              )}
              {dash.statusIcon === "danger" && (
                <ShieldX className="w-4 h-4 mr-2" />
              )}
              {dash.statusText}
            </div>
          </div>

          {/* REJECT BADGE */}
          <AnimatePresence>
            {dash.risk >= 70 && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 12 }}
                exit={{ scale: 0, rotate: -12 }}
                className="absolute right-0 top-0 bg-red-600 text-white font-black text-xl px-5 py-1.5 rounded-lg border-2 border-red-800 shadow-lg"
              >
                REJECTED
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Risk Score Gauge */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-1">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
              Risk Score (XGBoost)
            </p>
            <p className={`text-2xl font-black ${riskColor}`}>
              {dash.risk}/100
            </p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-3 rounded-full ${riskBarColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${dash.risk}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mt-1 font-bold">
            <span>0 (Green Zone)</span>
            <span>50 (Yellow Zone)</span>
            <span>100 (Red Zone)</span>
          </div>
        </div>

        {/* Feature Importance */}
        <div>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-3">
            Feature Importance
          </p>

          <div className="space-y-3">
            {/* Feature 1 */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold text-white/60">
                <span>Trust Score History</span>
                <span>{dash.featHistory}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div
                  className="bg-blue-400 h-1.5 rounded-full"
                  animate={{ width: `${dash.featHistory}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            {/* Feature 2 */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold text-white/60">
                <span>Collusion Graph Density</span>
                <span>{dash.featCollusion}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div
                  className="bg-amber-500 h-1.5 rounded-full"
                  animate={{ width: `${dash.featCollusion}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            {/* Feature 3 */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold text-white/60">
                <span>Logical Anomaly (LOF)</span>
                <span>{dash.featAnomaly}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div
                  className="bg-red-500 h-1.5 rounded-full"
                  animate={{ width: `${dash.featAnomaly}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
