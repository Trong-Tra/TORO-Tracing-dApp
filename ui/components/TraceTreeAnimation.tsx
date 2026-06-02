"use client";

import React, { useEffect, useRef } from "react";

const DEEP = "#0a1628";
const GRID = "#132238";
const WHITE = "#ffffff";
const WHITE_70 = "#ffffffb3";
const WHITE_50 = "#ffffff80";
const WHITE_30 = "#ffffff4d";
const WHITE_15 = "#ffffff26";

const C = {
  trunk: "#3e96cc",
  trunkDim: "#3e96cc4d",
  branch1: "#00bf63",
  branch2: "#ffc354",
  branch3: "#cb6ce6",
  nodeGlow: "#3e96cc33",
  check: "#00bf63",
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

// Cubic bezier
function bezier3(p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], t: number): [number, number] {
  const mt = 1 - t;
  const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
  const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
  return [x, y];
}

function sampleBezier3(p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], steps: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) pts.push(bezier3(p0, p1, p2, p3, i / steps));
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

    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0;

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

    const startTime = performance.now();

    // ═════ Timeline layout (relative coords 0-1) ═════
    const trunkY = 0.52;
    const leftX = 0.06;
    const rightX = 0.96;

    // Time markers on trunk
    const times = [
      { x: 0.18, label: "18:24:00" },
      { x: 0.42, label: "19:08:12" },
      { x: 0.72, label: "20:32:04" },
    ];

    // Main trunk path
    const trunkPath: [number, number][] = [];
    for (let i = 0; i <= 100; i++) {
      trunkPath.push([leftX + (rightX - leftX) * (i / 100), trunkY]);
    }

    // Branch 1: preview-branch (above, merges back)
    const b1StartX = 0.18;
    const b1EndX = 0.54;
    const b1Y = 0.22;
    const b1CurveUp: [number, number][] = sampleBezier3(
      [b1StartX, trunkY], [b1StartX + 0.02, trunkY - 0.06], [b1StartX + 0.04, b1Y + 0.04], [b1StartX + 0.08, b1Y], 30
    );
    const b1Horiz: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      b1Horiz.push([b1StartX + 0.08 + (b1EndX - b1StartX - 0.08) * (i / 40), b1Y]);
    }
    const b1CurveDown: [number, number][] = sampleBezier3(
      [b1EndX, b1Y], [b1EndX + 0.04, b1Y + 0.04], [b1EndX + 0.06, trunkY - 0.06], [b1EndX + 0.08, trunkY], 30
    );
    const b1Path = [...b1CurveUp, ...b1Horiz, ...b1CurveDown];

    // Branch 2: test-branch (below)
    const b2StartX = 0.42;
    const b2EndX = 0.78;
    const b2Y = 0.78;
    const b2CurveDown: [number, number][] = sampleBezier3(
      [b2StartX, trunkY], [b2StartX + 0.02, trunkY + 0.08], [b2StartX + 0.04, b2Y - 0.04], [b2StartX + 0.08, b2Y], 30
    );
    const b2Horiz: [number, number][] = [];
    for (let i = 0; i <= 50; i++) {
      b2Horiz.push([b2StartX + 0.08 + (b2EndX - b2StartX - 0.08) * (i / 50), b2Y]);
    }
    const b2CurveUp: [number, number][] = sampleBezier3(
      [b2EndX, b2Y], [b2EndX + 0.04, b2Y - 0.04], [b2EndX + 0.06, trunkY + 0.06], [b2EndX + 0.08, trunkY], 30
    );
    const b2Path = [...b2CurveDown, ...b2Horiz, ...b2CurveUp];

    // Branch 3: dev-branch (above, ongoing)
    const b3StartX = 0.72;
    const b3Y = 0.18;
    const b3Curve: [number, number][] = sampleBezier3(
      [b3StartX, trunkY], [b3StartX + 0.02, trunkY - 0.06], [b3StartX + 0.04, b3Y + 0.04], [b3StartX + 0.08, b3Y], 30
    );
    const b3Horiz: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      b3Horiz.push([b3StartX + 0.08 + 0.18 * (i / 40), b3Y]);
    }
    const b3Path = [...b3Curve, ...b3Horiz];

    // Dashed connectors (merge lines)
    const dash1 = sampleBezier3([b1EndX + 0.08, trunkY], [b1EndX + 0.10, trunkY - 0.03], [b1EndX + 0.12, trunkY - 0.01], [b1EndX + 0.14, trunkY], 20);
    const dash2 = sampleBezier3([b2EndX + 0.08, trunkY], [b2EndX + 0.10, trunkY + 0.03], [b2EndX + 0.12, trunkY + 0.01], [b2EndX + 0.14, trunkY], 20);

    // Nodes (hollow rings)
    interface RingNode {
      x: number; y: number; color: string; r: number; delay: number;
      label?: string; sublabel?: string; labelPos?: "top" | "bottom" | "above-branch" | "below-branch";
    }

    const nodes: RingNode[] = [
      // Trunk nodes
      { x: b1StartX, y: trunkY, color: C.trunk, r: 4, delay: 200, label: "source recorded", sublabel: "", labelPos: "bottom" },
      { x: b2StartX, y: trunkY, color: C.trunk, r: 4, delay: 600, label: "inventory check", sublabel: "", labelPos: "top" },
      { x: b3StartX, y: trunkY, color: C.trunk, r: 4, delay: 1000, label: "manufacturing", sublabel: "", labelPos: "bottom" },
      // Branch 1 nodes
      { x: b1StartX + 0.22, y: b1Y, color: C.branch1, r: 5, delay: 400, label: "WILD-CATCH-001", sublabel: "batch trace", labelPos: "above-branch" },
      { x: b1EndX + 0.04, y: b1Y, color: C.branch1, r: 5, delay: 700, label: "", sublabel: "", labelPos: "above-branch" },
      { x: b1EndX + 0.08, y: trunkY, color: C.check, r: 5, delay: 900, label: "merged into lot", sublabel: "", labelPos: "bottom" },
      // Branch 2 nodes
      { x: b2StartX + 0.18, y: b2Y, color: C.branch2, r: 5, delay: 800, label: "FARM-001", sublabel: "batch trace", labelPos: "below-branch" },
      { x: b2EndX + 0.04, y: b2Y, color: C.branch2, r: 5, delay: 1100, label: "", sublabel: "", labelPos: "below-branch" },
      { x: b2EndX + 0.08, y: trunkY, color: C.check, r: 5, delay: 1300, label: "merged into lot", sublabel: "", labelPos: "top" },
      // Branch 3 nodes
      { x: b3StartX + 0.14, y: b3Y, color: C.branch3, r: 5, delay: 1200, label: "TORO-02", sublabel: "lot tracking", labelPos: "above-branch" },
    ];

    // Badges (pill labels)
    interface Badge {
      x: number; y: number; text: string; color: string; delay: number; align?: "left" | "right";
    }
    const badges: Badge[] = [
      { x: leftX, y: trunkY, text: "  production  ", color: WHITE, delay: 0, align: "right" },
      { x: b1StartX + 0.08, y: b1Y, text: "  WILD-CATCH-001  ", color: C.branch1, delay: 300, align: "left" },
      { x: b2StartX + 0.08, y: b2Y, text: "  FARM-001  ", color: C.branch2, delay: 700, align: "left" },
      { x: b3StartX + 0.08, y: b3Y, text: "  TORO-02  ", color: C.branch3, delay: 1100, align: "left" },
    ];

    // Status text labels
    interface StatusLabel {
      x: number; y: number; text: string; delay: number; color: string;
    }
    const statusLabels: StatusLabel[] = [
      { x: b1StartX + 0.22, y: b1Y - 0.12, text: "batch minted", delay: 500, color: WHITE_50 },
      { x: b1EndX + 0.06, y: trunkY - 0.10, text: "merged", delay: 950, color: WHITE_50 },
      { x: b2StartX + 0.18, y: b2Y + 0.12, text: "batch minted", delay: 900, color: WHITE_50 },
      { x: b2EndX + 0.06, y: trunkY + 0.10, text: "merged", delay: 1350, color: WHITE_50 },
      { x: b3StartX + 0.14, y: b3Y - 0.10, text: "in progress", delay: 1250, color: WHITE_50 },
    ];

    const drawGrid = (alpha: number) => {
      ctx.strokeStyle = `rgba(19,34,56,${alpha * 0.6})`;
      ctx.lineWidth = 0.5;
      const cols = 24;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * W;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    };

    const drawPath = (path: [number, number][], color: string, width: number, progress: number) => {
      const maxIdx = Math.floor((path.length - 1) * progress);
      if (maxIdx < 1) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(path[0][0] * W, path[0][1] * H);
      for (let i = 1; i <= maxIdx; i++) ctx.lineTo(path[i][0] * W, path[i][1] * H);
      ctx.stroke();
      ctx.restore();
    };

    const drawDashedPath = (path: [number, number][], color: string, width: number, progress: number) => {
      const maxIdx = Math.floor((path.length - 1) * progress);
      if (maxIdx < 1) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([4, 4]);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(path[0][0] * W, path[0][1] * H);
      for (let i = 1; i <= maxIdx; i++) ctx.lineTo(path[i][0] * W, path[i][1] * H);
      ctx.stroke();
      ctx.restore();
    };

    const drawRingNode = (node: RingNode, progress: number, time: number) => {
      if (progress <= 0) return;
      const x = node.x * W;
      const y = node.y * H;
      const eased = easeOutCubic(clamp01(progress));
      const scale = eased;
      const pulse = 1 + Math.sin(time * 0.002 + node.delay * 0.01) * 0.05;
      const r = node.r * scale * pulse;

      ctx.save();
      ctx.globalAlpha = eased;

      // Thin outer glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = node.color + "40";

      // Hollow ring
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      // Tiny center dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawBadge = (badge: Badge, progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const x = badge.x * W;
      const y = badge.y * H;
      const isRight = badge.align === "right";

      ctx.save();
      ctx.globalAlpha = eased;
      const fontSize = 11;
      ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      const textW = ctx.measureText(badge.text).width;
      const padX = 10;
      const padY = 5;
      const bw = textW + padX * 2;
      const bh = fontSize + padY * 2;
      const bx = isRight ? x - bw - 12 : x + 12;
      const by = y - bh / 2;

      // Pill background
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.stroke();

      // Icon circle (left side of pill)
      ctx.fillStyle = badge.color + "30";
      ctx.beginPath();
      ctx.arc(bx + bh / 2 + 2, by + bh / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = badge.color;
      ctx.beginPath();
      ctx.arc(bx + bh / 2 + 2, by + bh / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = WHITE_70;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(badge.text, bx + bh + 2, by + bh / 2 + 0.5);
      ctx.restore();
    };

    const drawStatusLabel = (sl: StatusLabel, progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      ctx.save();
      ctx.globalAlpha = eased;
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = sl.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sl.text, sl.x * W, sl.y * H);
      ctx.restore();
    };

    const drawTimeMarkers = (progress: number) => {
      const eased = easeOutQuart(clamp01(progress));
      ctx.save();
      ctx.globalAlpha = eased;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = WHITE_30;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const t of times) {
        // Tick on trunk
        ctx.strokeStyle = WHITE_15;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(t.x * W, (trunkY - 0.015) * H);
        ctx.lineTo(t.x * W, (trunkY + 0.015) * H);
        ctx.stroke();
        // Label below
        ctx.fillText(t.label, t.x * W, (trunkY + 0.045) * H);
      }
      ctx.restore();
    };

    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

    // Animation phases
    const GRID_DUR = 500;
    const TRUNK_DUR = 1200;
    const B1_DUR = 1000;
    const B2_DUR = 1000;
    const B3_DUR = 800;
    const DASH_DUR = 600;
    const NODE_DUR = 500;
    const BADGE_DUR = 400;
    const LABEL_DUR = 400;
    const TIME_DUR = 500;

    const TRUNK_START = 200;
    const B1_START = 600;
    const B2_START = 1000;
    const B3_START = 1400;
    const DASH_START = 1800;
    const NODES_START = 1600;
    const BADGES_START = 1400;
    const LABELS_START = 2000;
    const TIME_START = 800;

    const draw = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP;
      ctx.fillRect(0, 0, W, H);

      // Grid
      const gridProgress = clamp01(elapsed / GRID_DUR);
      drawGrid(easeOutCubic(gridProgress));

      // Time markers
      drawTimeMarkers(clamp01((elapsed - TIME_START) / TIME_DUR));

      // Trunk
      const trunkProgress = clamp01((elapsed - TRUNK_START) / TRUNK_DUR);
      drawPath(trunkPath, C.trunkDim, 1.5, easeOutCubic(trunkProgress));

      // Branch 1
      const b1Progress = clamp01((elapsed - B1_START) / B1_DUR);
      drawPath(b1Path, C.branch1 + "99", 1.5, easeOutCubic(b1Progress));

      // Branch 2
      const b2Progress = clamp01((elapsed - B2_START) / B2_DUR);
      drawPath(b2Path, C.branch2 + "99", 1.5, easeOutCubic(b2Progress));

      // Branch 3
      const b3Progress = clamp01((elapsed - B3_START) / B3_DUR);
      drawPath(b3Path, C.branch3 + "99", 1.5, easeOutCubic(b3Progress));

      // Dashed merge connectors
      const dashProgress = clamp01((elapsed - DASH_START) / DASH_DUR);
      drawDashedPath(dash1, WHITE_30, 1, easeOutCubic(dashProgress));
      drawDashedPath(dash2, WHITE_30, 1, easeOutCubic(dashProgress));

      // Nodes
      for (const node of nodes) {
        const p = clamp01((elapsed - NODES_START - node.delay) / NODE_DUR);
        drawRingNode(node, p, now);
      }

      // Badges
      for (const badge of badges) {
        const p = clamp01((elapsed - BADGES_START - badge.delay) / BADGE_DUR);
        drawBadge(badge, p);
      }

      // Status labels
      for (const sl of statusLabels) {
        const p = clamp01((elapsed - LABELS_START - sl.delay) / LABEL_DUR);
        drawStatusLabel(sl, p);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "400px" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-2xl" style={{ background: DEEP }} />
    </div>
  );
}
