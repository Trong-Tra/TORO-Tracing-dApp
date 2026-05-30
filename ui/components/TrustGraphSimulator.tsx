"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Loader2,
  Shield,
  ShieldCheck,
} from "lucide-react";

const NODE_COLORS = {
  source: "#00bf63",
  station: "#3e96cc",
  collusion: "#ffc354",
};

interface NetNode {
  id: string;
  group: string;
  val: number;
  color: string;
}
interface NetLink {
  source: string;
  target: string;
  color: string;
}

const createNetwork = () => {
  const nodes: NetNode[] = [];
  const links: NetLink[] = [];

  for (let i = 1; i <= 40; i += 1) {
    const isSource = i <= 24;
    nodes.push({
      id: `node-${i}`,
      group: isSource ? "source" : "station",
      val: isSource ? 3.8 : 5.2,
      color: isSource ? NODE_COLORS.source : NODE_COLORS.station,
    });
  }

  const collusionCluster = ["node-7", "node-8", "node-9", "node-30", "node-31", "node-32"];
  const scanCollusionCluster = ["node-7", "node-8", "node-9", "node-30", "node-31"];
  const scanAnomalyNode = "node-27";

  collusionCluster.forEach((id) => {
    const target = nodes.find((n) => n.id === id);
    if (target) {
      target.group = "collusion";
      target.val = 7.2;
      target.color = NODE_COLORS.collusion;
    }
  });

  for (let i = 0; i < 64; i += 1) {
    const source = `node-${Math.floor(Math.random() * 24) + 1}`;
    const target = `node-${Math.floor(Math.random() * 16) + 25}`;
    links.push({
      source,
      target,
      color: "rgba(62,150,204,0.22)",
    });
  }

  for (let i = 0; i < collusionCluster.length; i += 1) {
    for (let j = i + 1; j < collusionCluster.length; j += 1) {
      links.push({
        source: collusionCluster[i],
        target: collusionCluster[j],
        color: "rgba(255,195,84,0.6)",
      });
    }
  }

  return {
    nodes,
    links,
    collusionCluster,
    scanCollusionCluster,
    scanAnomalyNode,
    anomalyNodes: ["node-3", "node-6", "node-12", "node-15", "node-22", "node-27", "node-33", "node-36"],
    anomalyLink: ["node-12", "node-27"],
  };
};

const GraphCanvas = ({ status, scanStage }: { status: string; scanStage: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const network = useMemo(() => createNetwork(), []);
  const positions = useRef<{ id: string; x: number; y: number; z: number; drift: number }[]>([]);
  const transitionStartRef = useRef(0);
  const fromStatusRef = useRef(status);
  const toStatusRef = useRef(status);
  const scanTransitionStartRef = useRef(0);
  const fromScanStageRef = useRef(scanStage);
  const toScanStageRef = useRef(scanStage);

  useEffect(() => {
    fromStatusRef.current = toStatusRef.current;
    toStatusRef.current = status;
    transitionStartRef.current = performance.now();
  }, [status]);

  useEffect(() => {
    fromScanStageRef.current = toScanStageRef.current;
    toScanStageRef.current = scanStage;
    scanTransitionStartRef.current = performance.now();
  }, [scanStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    if (!positions.current.length) {
      const rect = container.getBoundingClientRect();
      positions.current = network.nodes.map((node, index) => ({
        id: node.id,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        z: (index % 12) / 12,
        drift: Math.random() * Math.PI * 2,
      }));
    }

    let frame: number;
    const start = performance.now();

    const draw = (time: number) => {
      const t = (time - start) / 1000;
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, 0, rect.width, rect.height);

      const transitionDuration = 1100;
      const elapsed = time - transitionStartRef.current;
      const rawProgress = Math.min(1, elapsed / transitionDuration);
      const ease = rawProgress * rawProgress * (3 - 2 * rawProgress);
      const fromStatus = fromStatusRef.current;
      const toStatus = toStatusRef.current;

      const weights = {
        NORMAL: fromStatus === toStatus ? (toStatus === "NORMAL" ? 1 : 0) : fromStatus === "NORMAL" ? 1 - ease : toStatus === "NORMAL" ? ease : 0,
        COLLUSION: fromStatus === toStatus ? (toStatus === "COLLUSION" ? 1 : 0) : fromStatus === "COLLUSION" ? 1 - ease : toStatus === "COLLUSION" ? ease : 0,
        ANOMALY: fromStatus === toStatus ? (toStatus === "ANOMALY" ? 1 : 0) : fromStatus === "ANOMALY" ? 1 - ease : toStatus === "ANOMALY" ? ease : 0,
      };

      const glowBoost = toStatus === "COLLUSION" ? 0.3 : 0.12;
      const zoom = 1 + weights.COLLUSION * 0.04 + weights.ANOMALY * 0.06;
      const zoomX = rect.width * 0.5;
      const zoomY = rect.height * 0.5;
      const cameraShiftX = weights.COLLUSION * 46 + weights.ANOMALY * -42;
      const cameraShiftY = weights.COLLUSION * -24 + weights.ANOMALY * 28;
      const nodesMap = new Map(network.nodes.map((n) => [n.id, n]));
      const collusionSet = new Set(network.collusionCluster);
      const anomalySet = new Set(network.anomalyNodes);
      const [anomalyA, anomalyB] = network.anomalyLink;
      const scanCollusionSet = new Set(network.scanCollusionCluster);
      const scanAnomalyId = network.scanAnomalyNode;

      const scanTransitionDuration = 650;
      const scanElapsed = time - scanTransitionStartRef.current;
      const scanRaw = Math.min(1, scanElapsed / scanTransitionDuration);
      const scanEase = scanRaw * scanRaw * (3 - 2 * scanRaw);
      const scanFrom = fromScanStageRef.current;
      const scanTo = toScanStageRef.current;
      const scanStageWeights = {
        0: scanFrom === 0 ? 1 - scanEase : scanTo === 0 ? scanEase : 0,
        1: scanFrom === 1 ? 1 - scanEase : scanTo === 1 ? scanEase : 0,
        2: scanFrom === 2 ? 1 - scanEase : scanTo === 2 ? scanEase : 0,
        3: scanFrom === 3 ? 1 - scanEase : scanTo === 3 ? scanEase : 0,
      };

      const scanNoiseWeight = scanStageWeights[1] || 0;
      const scanFocusWeight = (scanStageWeights[2] || 0) + (scanStageWeights[3] || 0);

      let scanCx = 0;
      let scanCy = 0;
      if (network.scanCollusionCluster?.length) {
        network.scanCollusionCluster.forEach((id) => {
          const p = positions.current.find((pp) => pp.id === id);
          if (!p) return;
          scanCx += p.x;
          scanCy += p.y;
        });
        scanCx /= network.scanCollusionCluster.length;
        scanCy /= network.scanCollusionCluster.length;
      }

      const hexToRgb = (hex: string) => {
        const normalized = hex.replace("#", "");
        const bigint = parseInt(normalized, 16);
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255,
        };
      };

      const mixColor = (colors: Record<string, { r: number; g: number; b: number }>) => {
        const total = Object.values(weights).reduce((acc, val) => acc + val, 0) || 1;
        const mixed = { r: 0, g: 0, b: 0 };
        Object.entries(colors).forEach(([key, color]) => {
          const weight = weights[key as keyof typeof weights] / total;
          mixed.r += color.r * weight;
          mixed.g += color.g * weight;
          mixed.b += color.b * weight;
        });
        return `rgb(${Math.round(mixed.r)}, ${Math.round(mixed.g)}, ${Math.round(mixed.b)})`;
      };

      network.links.forEach((link) => {
        const source = positions.current.find((p) => p.id === link.source);
        const target = positions.current.find((p) => p.id === link.target);
        if (!source || !target) return;
        const wobble = scanStage > 0 ? 0 : Math.sin(t + source.drift) * 8;
        const wobbleT = scanStage > 0 ? 0 : Math.cos(t + target.drift) * 8;
        const sx = zoomX + (source.x + wobble + cameraShiftX - zoomX) * zoom;
        const sy = zoomY + (source.y + wobbleT * 0.6 + cameraShiftY - zoomY) * zoom;
        const tx = zoomX + (target.x + wobbleT + cameraShiftX - zoomX) * zoom;
        const ty = zoomY + (target.y + wobble * 0.6 + cameraShiftY - zoomY) * zoom;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        if (scanStage > 0) {
          ctx.strokeStyle = "rgba(148,163,184,0.12)";
          ctx.lineWidth = 0.9;
        } else {
          const isCollusionLink = link.color.includes("255,195,84");
          const isAnomalyLink =
            (link.source === anomalyA && link.target === anomalyB) ||
            (link.source === anomalyB && link.target === anomalyA);
          const normalColor = hexToRgb("#3e96cc");
          const collusionColor = isCollusionLink ? hexToRgb("#ffc354") : hexToRgb("#475569");
          const anomalyColor = isAnomalyLink ? hexToRgb("#ef4444") : hexToRgb("#475569");
          ctx.strokeStyle = mixColor({
            NORMAL: normalColor,
            COLLUSION: collusionColor,
            ANOMALY: anomalyColor,
          });
          ctx.lineWidth =
            weights.COLLUSION && isCollusionLink ? 2.4 : weights.ANOMALY && isAnomalyLink ? 2.6 : 1;
        }
        ctx.stroke();
      });

      if (scanFocusWeight > 0.01 && network.scanCollusionCluster?.length) {
        const ids = network.scanCollusionCluster;
        const pull = 0.22 * scanFocusWeight;
        for (let i = 0; i < ids.length; i += 1) {
          for (let j = i + 1; j < ids.length; j += 1) {
            const s = positions.current.find((p) => p.id === ids[i]);
            const tt = positions.current.find((p) => p.id === ids[j]);
            if (!s || !tt) continue;

            const sxRaw = s.x + (scanCx - s.x) * pull;
            const syRaw = s.y + (scanCy - s.y) * pull;
            const txRaw = tt.x + (scanCx - tt.x) * pull;
            const tyRaw = tt.y + (scanCy - tt.y) * pull;

            const sx = zoomX + (sxRaw + cameraShiftX - zoomX) * zoom;
            const sy = zoomY + (syRaw + cameraShiftY - zoomY) * zoom;
            const tx = zoomX + (txRaw + cameraShiftX - zoomX) * zoom;
            const ty = zoomY + (tyRaw + cameraShiftY - zoomY) * zoom;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = `rgba(255,195,84,${0.2 + 0.65 * scanFocusWeight})`;
            ctx.lineWidth = 3.1;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(255,195,84,0.9)";
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      positions.current.forEach((position) => {
        const node = nodesMap.get(position.id);
        if (!node) return;

        if (scanStage > 0) {
          const isCollusionFocus = scanCollusionSet.has(node.id);
          const isAnomalyFocus = node.id === scanAnomalyId;
          const isFocusNode = isCollusionFocus || isAnomalyFocus;

          const pull = isCollusionFocus ? 0.22 * scanFocusWeight : 0;
          const px = position.x + (scanCx - position.x) * pull;
          const py = position.y + (scanCy - position.y) * pull;
          const x = zoomX + (px + cameraShiftX - zoomX) * zoom;
          const y = zoomY + (py + cameraShiftY - zoomY) * zoom;

          const baseColor =
            scanFocusWeight > 0.01
              ? isAnomalyFocus
                ? "rgb(239,68,68)"
                : isCollusionFocus
                  ? "rgb(255,195,84)"
                  : "rgb(148,163,184)"
              : "rgb(148,163,184)";

          const stage1Target = isFocusNode ? 0.7 : 0.2;
          const stage2Target = isFocusNode ? 1 : 0.15;
          let nodeAlpha = 1;
          nodeAlpha = nodeAlpha * (1 - scanNoiseWeight) + stage1Target * scanNoiseWeight;
          nodeAlpha = nodeAlpha * (1 - scanFocusWeight) + stage2Target * scanFocusWeight;

          const pulse = 1 + Math.sin(t * 2 + position.drift) * 0.1;
          let drawRadius = node.val * pulse;
          if (isCollusionFocus) {
            drawRadius *= 1 + 0.25 * scanFocusWeight;
            drawRadius *= 1 + Math.sin(t * 9) * 0.08 * scanFocusWeight;
          }
          if (isAnomalyFocus) {
            drawRadius *= 1 + 2.0 * scanFocusWeight;
          }

          const rgba = baseColor.replace("rgb", "rgba").replace(")", `, ${nodeAlpha})`);
          const rgba40 = baseColor.replace("rgb", "rgba").replace(")", `, ${0.35 * nodeAlpha})`);

          const gradient = ctx.createRadialGradient(x, y, 1, x, y, drawRadius * 3.6);
          gradient.addColorStop(0, rgba);
          gradient.addColorStop(0.45, rgba40);
          gradient.addColorStop(1, "rgba(10,22,40,0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, drawRadius * 3.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, drawRadius, 0, Math.PI * 2);
          ctx.fillStyle = rgba;
          ctx.shadowBlur = 14 + 10 * scanFocusWeight;
          ctx.shadowColor = baseColor;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (isCollusionFocus && scanFocusWeight > 0.01) {
            ctx.beginPath();
            ctx.arc(x, y, drawRadius * 2.0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,195,84,${0.22 + 0.35 * scanFocusWeight})`;
            ctx.lineWidth = 2.2;
            ctx.stroke();
          }

          if (isAnomalyFocus && scanFocusWeight > 0.01) {
            const rippleCount = 3;
            for (let i = 0; i < rippleCount; i += 1) {
              const phase = ((t * 1.8 + i / rippleCount) % 1);
              const rr = drawRadius * (1.2 + phase * 4.0);
              ctx.beginPath();
              ctx.arc(x, y, rr, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(239,68,68,${(1 - phase) * 0.35 * scanFocusWeight})`;
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }
          }

          return;
        }

        const pulse = 1 + Math.sin(t * 2 + position.drift) * 0.15;
        const radius = node.val * pulse;
        const wobbleX = Math.cos(t + position.drift) * 6;
        const wobbleY = Math.sin(t + position.drift) * 6;
        const x = zoomX + (position.x + wobbleX + cameraShiftX - zoomX) * zoom;
        const y = zoomY + (position.y + wobbleY + cameraShiftY - zoomY) * zoom;

        const normalNodeColor = node.group === "source" ? "#00bf63" : "#3e96cc";
        const collusionNodeColor = collusionSet.has(node.id) ? "#ffc354" : "#64748b";
        const anomalyNodeColor = anomalySet.has(node.id) ? "#ef4444" : "#64748b";

        const baseColor = mixColor({
          NORMAL: hexToRgb(normalNodeColor),
          COLLUSION: hexToRgb(collusionNodeColor),
          ANOMALY: hexToRgb(anomalyNodeColor),
        });

        let drawRadius = radius;
        if (weights.COLLUSION && collusionSet.has(node.id)) drawRadius = radius * (1 + 0.35 * weights.COLLUSION);
        if (weights.ANOMALY && anomalySet.has(node.id)) drawRadius = radius * (1 + 0.55 * weights.ANOMALY);

        const depthBlur = 10 + weights.ANOMALY * 8 + weights.COLLUSION * 6;
        const gradient = ctx.createRadialGradient(x, y, 1, x, y, drawRadius * 3.4);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.4, baseColor.replace("rgb", "rgba").replace(")", ", 0.4)"));
        gradient.addColorStop(1, "rgba(10,22,40,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, drawRadius * 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.shadowBlur = depthBlur;
        ctx.shadowColor = baseColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (weights.COLLUSION && collusionSet.has(node.id)) {
          ctx.beginPath();
          ctx.arc(x, y, drawRadius * (1.8 + glowBoost), 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,195,84,0.45)";
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }

        if (weights.ANOMALY && anomalySet.has(node.id)) {
          ctx.beginPath();
          ctx.arc(x, y, drawRadius * (1.8 + glowBoost), 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(239,68,68,0.55)";
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [network, status, scanStage]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-xl" aria-hidden />
    </div>
  );
};

export default function TrustGraphSimulator() {
  const [status, setStatus] = useState("NORMAL");
  const [scanStage, setScanStage] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [riskScore, setRiskScore] = useState(12);
  const scanTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const stageNoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [stageNoteVisible, setStageNoteVisible] = useState(false);

  const handleNormal = useCallback(() => setStatus("NORMAL"), []);
  const handleCollusion = useCallback(() => setStatus("COLLUSION"), []);
  const handleAnomaly = useCallback(() => setStatus("ANOMALY"), []);

  const handleRunAlgorithm = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStage(0);
    setRiskScore(12);
    scanTimeoutsRef.current.forEach((t) => clearTimeout(t));
    scanTimeoutsRef.current = [];
    scanTimeoutsRef.current.push(setTimeout(() => setScanStage(1), 1000));
    scanTimeoutsRef.current.push(setTimeout(() => setScanStage(2), 2000));
    scanTimeoutsRef.current.push(setTimeout(() => setScanStage(3), 3000));
  }, [isScanning]);

  useEffect(() => {
    if (scanStage === 3) setIsScanning(false);
  }, [scanStage]);

  useEffect(() => {
    return () => {
      scanTimeoutsRef.current.forEach((t) => clearTimeout(t));
      if (stageNoteTimeoutRef.current) clearTimeout(stageNoteTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isScanning || scanStage >= 3) {
      setStageNoteVisible(false);
      return;
    }
    setStageNoteVisible(false);
    if (stageNoteTimeoutRef.current) clearTimeout(stageNoteTimeoutRef.current);
    stageNoteTimeoutRef.current = setTimeout(() => {
      setStageNoteVisible(true);
    }, 220);
    return () => {
      if (stageNoteTimeoutRef.current) clearTimeout(stageNoteTimeoutRef.current);
    };
  }, [isScanning, scanStage]);

  useEffect(() => {
    if (scanStage !== 3) return;
    const from = 12;
    const to = 98;
    const duration = 900;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = p * p * (3 - 2 * p);
      setRiskScore(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scanStage]);

  const statusConfig = {
    NORMAL: {
      label: "NORMAL",
      title: "MẠNG LƯỚI AN TOÀN",
      description: "GNN không phát hiện bất thường. Luồng dữ liệu ổn định.",
      risk: "12%",
      color: "text-emerald-300",
      badge: "text-emerald-400",
      button: "bg-[#0f1e36] hover:bg-[#162744]",
    },
    COLLUSION: {
      label: "COLLUSION",
      title: "PHÁT HIỆN THÔNG ĐỒNG",
      description: "Phát hiện cụm xác thực chéo bất thường. Cần kiểm tra nguồn.",
      risk: "78%",
      color: "text-amber-300",
      badge: "text-amber-400",
      button: "bg-[#ff914d]/80 hover:bg-[#ff914d]",
    },
    ANOMALY: {
      label: "ANOMALY",
      title: "DỊ THƯỜNG LOGIC",
      description: "Hành vi lệch chuẩn với pattern giao dịch đột biến.",
      risk: "97%",
      color: "text-red-300",
      badge: "text-red-400",
      button: "bg-red-500/80 hover:bg-red-500",
    },
  };

  const activeStatus = statusConfig[status as keyof typeof statusConfig];

  const stageNote = useMemo(() => {
    if (!isScanning || scanStage >= 3) return null;
    if (scanStage === 0) return "Khởi tạo pipeline, trích xuất đặc trưng đồ thị...";
    if (scanStage === 1) return "Stage 1/3: Giảm nhiễu (lọc node/edge không quan trọng).";
    if (scanStage === 2) return "Stage 2/3: Cô lập cụm thông đồng & điểm dị thường (tăng cường tín hiệu).";
    return null;
  }, [isScanning, scanStage]);

  return (
    <div className="flex flex-col gap-4">
      {/* Graph Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a1628]" style={{ height: "420px" }}>
        <GraphCanvas status={status} scanStage={scanStage} />

        {isScanning && scanStage < 3 && (
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] z-[5] pointer-events-none rounded-xl" />
        )}

        {/* Header overlay */}
        <div className="absolute left-4 top-4 z-10">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3">
            <h2 className="text-xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3e96cc] to-[#00bf63]">
              TORO GRAPH 2.0
            </h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-mono mt-0.5">
              Trust Network Simulator
            </p>
          </div>
        </div>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3">
            <h3 className="text-xs uppercase tracking-widest text-slate-300 mb-2">Nodes</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00bf63] shadow-[0_0_8px_rgba(0,191,99,0.6)]" />
                <span className="text-slate-200">Source Node</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3e96cc] shadow-[0_0_8px_rgba(62,150,204,0.6)]" />
                <span className="text-slate-200">Station Node</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h3 className="text-sm uppercase tracking-widest text-slate-300">Control Panel</h3>
            <p className="text-xs text-slate-500">Chọn mô phỏng trạng thái mạng lưới</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <Shield size={14} className={activeStatus.badge} />
              <span className="uppercase tracking-widest">Trạng Thái: {activeStatus.label}</span>
            </div>
          </div>
          <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
            <button
              onClick={handleNormal}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                status === "NORMAL"
                  ? "bg-[#00bf63] text-slate-900 shadow-[0_0_16px_rgba(0,191,99,0.4)]"
                  : "border border-[#00bf63]/50 text-[#00bf63] hover:bg-[#00bf63]/10"
              }`}
            >
              <ShieldCheck size={18} /> Luồng Chuẩn
            </button>
            <button
              onClick={handleCollusion}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                status === "COLLUSION"
                  ? "bg-[#ffc354] text-slate-900 shadow-[0_0_16px_rgba(255,195,84,0.4)]"
                  : "border border-[#ffc354]/50 text-[#ffc354] hover:bg-[#ffc354]/10"
              }`}
            >
              <Activity size={18} /> Thông Đồng
            </button>
            <button
              onClick={handleAnomaly}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                status === "ANOMALY"
                  ? "bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.4)]"
                  : "border border-red-400/50 text-red-300 hover:bg-red-400/10"
              }`}
            >
              <AlertTriangle size={18} /> Dị Thường
            </button>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
        {scanStage < 3 ? (
          <>
            <div className={`flex items-center gap-2 text-sm font-semibold ${activeStatus.badge}`}>
              <Shield size={18} /> Trạng Thái: {activeStatus.label}
            </div>
            <h2 className={`mt-3 text-xl font-semibold tracking-widest ${activeStatus.color}`}>
              {activeStatus.title}
            </h2>
            <p
              className={`mt-2 text-sm text-slate-300 transition-opacity duration-500 ${
                stageNote ? (stageNoteVisible ? "opacity-100" : "opacity-0") : "opacity-100"
              }`}
            >
              {stageNote ?? activeStatus.description}
            </p>
            <div className="mt-4">
              <span className="text-xs uppercase text-slate-500">Risk Score</span>
              <div className={`text-3xl font-bold ${activeStatus.badge}`}>
                {isScanning ? "12%" : activeStatus.risk}
              </div>
            </div>
            <button
              onClick={handleRunAlgorithm}
              className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-slate-100 ${activeStatus.button} ${
                isScanning ? "animate-pulse" : ""
              }`}
            >
              {isScanning ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Đang trích xuất đặc trưng...
                </span>
              ) : (
                "Chạy Thuật Toán"
              )}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <AlertTriangle size={18} /> Trạng Thái: CRITICAL
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-widest text-red-300" style={{ textShadow: "0 0 20px rgba(239,68,68,0.4)" }}>
              PHÁT HIỆN RỦI RO NGHIÊM TRỌNG
            </h2>
            <div className="mt-4">
              <span className="text-xs uppercase text-slate-500">Risk Score</span>
              <div className="text-4xl font-bold text-red-400 tabular-nums">{riskScore}%</div>
              <div className="mt-2 text-xs text-slate-300">
                Louvain: Cụm thông đồng khép kín. LOF: Sản lượng dị thường.
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setScanStage(0); setStatus("NORMAL"); setRiskScore(12); }}
                className="flex-1 rounded-lg border border-white/20 bg-transparent py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                ↺ Quay lại
              </button>
              <button className="flex-1 rounded-lg border border-red-400/60 bg-transparent py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/10 transition">
                XEM BÁO CÁO CHI TIẾT
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
