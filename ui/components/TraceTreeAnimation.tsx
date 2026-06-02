"use client";

import React, { useEffect, useRef } from "react";

interface NodeDef {
  x: number; // 0-1 relative
  y: number; // 0-1 relative
  color: string;
  glowColor: string;
  label: string;
  sublabel?: string;
  delay: number; // ms
}

interface BranchDef {
  id: string;
  color: string;
  path: [number, number][]; // array of [x, y] relative points
  nodes: NodeDef[];
  badge: { text: string; side: "top" | "bottom" };
}

const DEEP = "#0a1628";
const GRID = "#1a2d4a";
const WHITE = "#ffffff";
const WHITE_60 = "#ffffff99";
const WHITE_30 = "#ffffff4d";

const COLORS = {
  source: "#00bf63",
  sourceGlow: "rgba(0,191,99,0.6)",
  ocean: "#3e96cc",
  oceanGlow: "rgba(62,150,204,0.6)",
  gold: "#ffc354",
  goldGlow: "rgba(255,195,84,0.6)",
  purple: "#cb6ce6",
  purpleGlow: "rgba(203,108,230,0.5)",
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// Quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
function bezier2(p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] {
  const mt = 1 - t;
  const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
  const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
  return [x, y];
}

// Cubic Bezier: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
function bezier3(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const mt = 1 - t;
  const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
  const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
  return [x, y];
}

function sampleBezier3(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  steps: number
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    pts.push(bezier3(p0, p1, p2, p3, i / steps));
  }
  return pts;
}

export default function TraceTreeAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    let W = 0;
    let H = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // ═════ Animation Timeline ═════
    const startTime = performance.now();
    const GRID_DUR = 600;
    const BRANCH1_DUR = 1200;
    const BRANCH2_DUR = 1200;
    const MERGE_DUR = 600;
    const TRUNK_DUR = 1500;
    const NODE_DUR = 800;
    const LABEL_DUR = 600;

    const BRANCH1_START = 300;
    const BRANCH2_START = 800;
    const MERGE_START = 1400;
    const TRUNK_START = 1800;
    const NODES_START = 2200;
    const LABELS_START = 2800;

    // ═════ Scene Definition (relative coords 0-1) ═════
    // Layout: 2 branches merge into main trunk
    const mergeX = 0.42;
    const mergeY = 0.5;

    // Branch 1: WILD-CATCH-001 (from top)
    const b1Start: [number, number] = [0.06, 0.15];
    const b1Ctrl1: [number, number] = [0.18, 0.15];
    const b1Ctrl2: [number, number] = [0.3, 0.38];
    const b1End: [number, number] = [mergeX, mergeY];
    const b1Path = sampleBezier3(b1Start, b1Ctrl1, b1Ctrl2, b1End, 60);

    // Branch 2: FARM-001 (from bottom)
    const b2Start: [number, number] = [0.06, 0.85];
    const b2Ctrl1: [number, number] = [0.18, 0.85];
    const b2Ctrl2: [number, number] = [0.3, 0.62];
    const b2End: [number, number] = [mergeX, mergeY];
    const b2Path = sampleBezier3(b2Start, b2Ctrl1, b2Ctrl2, b2End, 60);

    // Merge connector (dashed curved line showing merge)
    const mergeConn1: [number, number][] = sampleBezier3(
      [mergeX - 0.08, mergeY - 0.12],
      [mergeX - 0.04, mergeY - 0.06],
      [mergeX - 0.02, mergeY - 0.02],
      [mergeX, mergeY],
      20
    );
    const mergeConn2: [number, number][] = sampleBezier3(
      [mergeX - 0.08, mergeY + 0.12],
      [mergeX - 0.04, mergeY + 0.06],
      [mergeX - 0.02, mergeY + 0.02],
      [mergeX, mergeY],
      20
    );

    // Main trunk: TORO-02 lot flow
    const trunkStart: [number, number] = [mergeX, mergeY];
    const trunkCtrl1: [number, number] = [mergeX + 0.12, mergeY];
    const trunkCtrl2: [number, number] = [mergeX + 0.25, mergeY];
    const trunkEnd: [number, number] = [0.94, mergeY];
    const trunkPath = sampleBezier3(trunkStart, trunkCtrl1, trunkCtrl2, trunkEnd, 80);

    // Nodes along branches
    const b1Nodes: NodeDef[] = [
      { x: 0.1, y: 0.15, color: COLORS.source, glowColor: COLORS.sourceGlow, label: "SOURCE", sublabel: "WILD-CATCH-001", delay: 0 },
      { x: 0.2, y: 0.2, color: COLORS.ocean, glowColor: COLORS.oceanGlow, label: "INVENTORY", sublabel: "Port Receipt", delay: 300 },
      { x: 0.32, y: 0.38, color: COLORS.ocean, glowColor: COLORS.oceanGlow, label: "MANUFACTURING", sublabel: "Processing", delay: 600 },
    ];

    const b2Nodes: NodeDef[] = [
      { x: 0.1, y: 0.85, color: COLORS.source, glowColor: COLORS.sourceGlow, label: "SOURCE", sublabel: "FARM-001", delay: 200 },
      { x: 0.2, y: 0.72, color: COLORS.ocean, glowColor: COLORS.oceanGlow, label: "INVENTORY", sublabel: "Port Receipt", delay: 500 },
      { x: 0.32, y: 0.58, color: COLORS.ocean, glowColor: COLORS.oceanGlow, label: "MANUFACTURING", sublabel: "Processing", delay: 800 },
    ];

    // Trunk nodes (after merge)
    const trunkNodes: NodeDef[] = [
      { x: mergeX + 0.04, y: mergeY, color: COLORS.gold, glowColor: COLORS.goldGlow, label: "LOT CREATED", sublabel: "TORO-02", delay: 0 },
      { x: mergeX + 0.18, y: mergeY, color: COLORS.gold, glowColor: COLORS.goldGlow, label: "WAREHOUSE", sublabel: "Cold Storage", delay: 300 },
      { x: mergeX + 0.36, y: mergeY, color: COLORS.gold, glowColor: COLORS.goldGlow, label: "DISTRIBUTION", sublabel: "Shipping", delay: 600 },
      { x: 0.88, y: mergeY, color: COLORS.purple, glowColor: COLORS.purpleGlow, label: "CONSUMER", sublabel: "QR Verified", delay: 900 },
    ];

    const drawGrid = (alpha: number) => {
      ctx.strokeStyle = `rgba(26,45,74,${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      const cols = 20;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * W;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      const rows = 10;
      for (let i = 0; i <= rows; i++) {
        const y = (i / rows) * H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    };

    const drawPath = (
      path: [number, number][],
      color: string,
      glow: string,
      lineWidth: number,
      progress: number,
      dash?: number[]
    ) => {
      const maxIdx = Math.floor((path.length - 1) * progress);
      if (maxIdx < 1) return;

      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = glow;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (dash) ctx.setLineDash(dash);

      ctx.beginPath();
      ctx.moveTo(path[0][0] * W, path[0][1] * H);
      for (let i = 1; i <= maxIdx; i++) {
        ctx.lineTo(path[i][0] * W, path[i][1] * H);
      }
      ctx.stroke();

      // Draw leading dot
      const t = (path.length - 1) * progress;
      const idx = Math.floor(t);
      const frac = t - idx;
      if (idx < path.length - 1) {
        const x = lerp(path[idx][0], path[idx + 1][0], frac) * W;
        const y = lerp(path[idx][1], path[idx + 1][1], frac) * H;
        ctx.fillStyle = WHITE;
        ctx.shadowBlur = 20;
        ctx.shadowColor = glow;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawNode = (node: NodeDef, progress: number, time: number) => {
      if (progress <= 0) return;
      const x = node.x * W;
      const y = node.y * H;
      const eased = easeOutCubic(Math.min(1, progress));
      const scale = 0.3 + eased * 0.7;
      const pulse = 1 + Math.sin(time * 0.003 + node.delay * 0.01) * 0.08;
      const r = 6 * scale * pulse;

      ctx.save();

      // Outer glow ring
      ctx.shadowBlur = 25 * eased;
      ctx.shadowColor = node.glowColor;
      ctx.strokeStyle = node.glowColor.replace(/[\d.]+\)$/, "0.4)");
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow
      ctx.shadowBlur = 15 * eased;
      ctx.shadowColor = node.glowColor;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // White center dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawBadge = (
      x: number,
      y: number,
      text: string,
      color: string,
      progress: number,
      align: "left" | "right" = "left"
    ) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(Math.min(1, progress));
      const alpha = eased;
      const offsetX = align === "left" ? 18 : -18;

      ctx.save();
      ctx.globalAlpha = alpha;

      const fontSize = 11;
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      const paddingX = 12;
      const paddingY = 6;
      const textW = ctx.measureText(text).width;
      const boxW = textW + paddingX * 2;
      const boxH = fontSize + paddingY * 2;
      const bx = x + offsetX + (align === "right" ? -boxW : 0);
      const by = y - boxH / 2;

      // Pill background
      ctx.fillStyle = "rgba(15,30,54,0.85)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = WHITE;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + paddingX, by + boxH / 2);

      ctx.restore();
    };

    const drawLabel = (
      x: number,
      y: number,
      label: string,
      sublabel: string | undefined,
      color: string,
      progress: number,
      align: "left" | "right" | "center" = "left",
      valign: "top" | "bottom" = "bottom"
    ) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(Math.min(1, progress));
      const alpha = eased;
      const offsetY = valign === "bottom" ? 22 : -18;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";

      const labelSize = 10;
      const subSize = 9;

      // Label
      ctx.font = `bold ${labelSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(label, x, y + offsetY);

      // Sublabel
      if (sublabel) {
        ctx.font = `${subSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = WHITE_60;
        ctx.fillText(sublabel, x, y + offsetY + labelSize + 3);
      }

      ctx.restore();
    };

    const drawMergeBadge = (progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(Math.min(1, progress));
      const x = mergeX * W;
      const y = mergeY * H - 35;
      const text = "createProductLot()";

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.font = "bold 10px monospace";
      const padX = 10;
      const padY = 5;
      const tw = ctx.measureText(text).width;
      const bw = tw + padX * 2;
      const bh = 18 + padY * 2;

      ctx.fillStyle = "rgba(255,195,84,0.12)";
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1;
      roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLORS.gold;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    function roundRect(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }

    // ═════ Main Draw Loop ═════
    const draw = (now: number) => {
      const elapsed = now - startTime;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP;
      ctx.fillRect(0, 0, W, H);

      // Grid
      const gridProgress = Math.min(1, elapsed / GRID_DUR);
      drawGrid(easeOutCubic(gridProgress));

      // Branch 1 (WILD-CATCH-001)
      const b1Progress = Math.min(1, Math.max(0, (elapsed - BRANCH1_START) / BRANCH1_DUR));
      drawPath(b1Path, COLORS.source, COLORS.sourceGlow, 2.5, easeOutCubic(b1Progress));

      // Branch 2 (FARM-001)
      const b2Progress = Math.min(1, Math.max(0, (elapsed - BRANCH2_START) / BRANCH2_DUR));
      drawPath(b2Path, COLORS.source, COLORS.sourceGlow, 2.5, easeOutCubic(b2Progress));

      // Merge connectors (dashed)
      const mergeProgress = Math.min(1, Math.max(0, (elapsed - MERGE_START) / MERGE_DUR));
      if (mergeProgress > 0) {
        drawPath(mergeConn1, COLORS.gold, COLORS.goldGlow, 1.5, easeOutCubic(mergeProgress), [4, 4]);
        drawPath(mergeConn2, COLORS.gold, COLORS.goldGlow, 1.5, easeOutCubic(mergeProgress), [4, 4]);
      }

      // Main trunk (TORO-02 lot)
      const trunkProgress = Math.min(1, Math.max(0, (elapsed - TRUNK_START) / TRUNK_DUR));
      drawPath(trunkPath, COLORS.gold, COLORS.goldGlow, 3, easeOutCubic(trunkProgress));

      // Branch badges
      drawBadge(
        b1Start[0] * W,
        b1Start[1] * H,
        "WILD-CATCH-001",
        COLORS.source,
        Math.min(1, Math.max(0, (elapsed - BRANCH1_START - 200) / LABEL_DUR)),
        "left"
      );
      drawBadge(
        b2Start[0] * W,
        b2Start[1] * H,
        "FARM-001",
        COLORS.source,
        Math.min(1, Math.max(0, (elapsed - BRANCH2_START - 200) / LABEL_DUR)),
        "left"
      );

      // Merge badge
      drawMergeBadge(Math.min(1, Math.max(0, (elapsed - MERGE_START - 100) / LABEL_DUR)));

      // Branch 1 nodes
      b1Nodes.forEach((node) => {
        const p = Math.min(1, Math.max(0, (elapsed - NODES_START - node.delay) / NODE_DUR));
        drawNode(node, p, now);
        const lp = Math.min(1, Math.max(0, (elapsed - LABELS_START - node.delay) / LABEL_DUR));
        drawLabel(node.x * W, node.y * H, node.label, node.sublabel, node.color, lp, "left", "top");
      });

      // Branch 2 nodes
      b2Nodes.forEach((node) => {
        const p = Math.min(1, Math.max(0, (elapsed - NODES_START - node.delay) / NODE_DUR));
        drawNode(node, p, now);
        const lp = Math.min(1, Math.max(0, (elapsed - LABELS_START - node.delay) / LABEL_DUR));
        drawLabel(node.x * W, node.y * H, node.label, node.sublabel, node.color, lp, "left", "bottom");
      });

      // Trunk nodes
      trunkNodes.forEach((node) => {
        const p = Math.min(1, Math.max(0, (elapsed - NODES_START - 400 - node.delay) / NODE_DUR));
        drawNode(node, p, now);
        const lp = Math.min(1, Math.max(0, (elapsed - LABELS_START - 400 - node.delay) / LABEL_DUR));
        drawLabel(node.x * W, node.y * H, node.label, node.sublabel, node.color, lp, "center", "bottom");
      });

      // Main lot badge (right side)
      drawBadge(
        trunkEnd[0] * W,
        trunkEnd[1] * H - 30,
        "TORO-02",
        COLORS.gold,
        Math.min(1, Math.max(0, (elapsed - TRUNK_START - 600) / LABEL_DUR)),
        "right"
      );

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "420px" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-2xl"
        style={{ background: DEEP }}
      />
    </div>
  );
}
