"use client";

import React, { useEffect, useRef } from "react";

const DEEP = "#0a1628";
const GRID = "#132238";
const WHITE = "#ffffff";
const WHITE_70 = "#ffffffb3";
const WHITE_50 = "#ffffff80";
const WHITE_30 = "#ffffff4d";

const TRUNK_COLOR = "#3e96cc";
const TRUNK_DIM = "#3e96cc4d";

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
  return [
    mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
    mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function sampleBezier3(p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], steps: number): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => bezier3(p0, p1, p2, p3, i / steps));
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

    // ═════ Layout ═════
    const trunkY = 0.55;
    const leftX = 0.06;
    const rightX = 0.94;

    // Main trunk points
    const trunkPoints: [number, number][] = [
      [0.12, trunkY], // Source
      [0.32, trunkY], // Inventory
      [0.52, trunkY], // Manufacturing
      [0.72, trunkY], // Warehouse
      [0.88, trunkY], // Distribution
    ];

    // Branch definitions: each branch goes out from a trunk point, shows detail, comes back
    interface Branch {
      trunkIdx: number;
      color: string;
      side: "top" | "bottom";
      label: string;
      nodes: { x: number; label: string; sublabel?: string }[];
    }

    const branches: Branch[] = [
      {
        trunkIdx: 0,
        color: "#00bf63",
        side: "top",
        label: "WILD-CATCH-001",
        nodes: [
          { x: 0.18, label: "Catch Yellowfin", sublabel: "Bình Định" },
          { x: 0.26, label: "mintBatch()", sublabel: "800kg" },
        ],
      },
      {
        trunkIdx: 2,
        color: "#ffc354",
        side: "bottom",
        label: "FARM-001",
        nodes: [
          { x: 0.48, label: "Farm Raised", sublabel: "Khánh Hòa" },
          { x: 0.56, label: "mintBatch()", sublabel: "2500kg" },
        ],
      },
      {
        trunkIdx: 4,
        color: "#cb6ce6",
        side: "top",
        label: "TORO-02",
        nodes: [
          { x: 0.78, label: "createProductLot()", sublabel: "8800 cans" },
          { x: 0.86, label: "recordWarehouse()", sublabel: "Cold Storage 2" },
        ],
      },
    ];

    // Build branch paths (out + horizontal + back)
    function buildBranchPath(branch: Branch): [number, number][] {
      const trunkPt = trunkPoints[branch.trunkIdx];
      const outY = branch.side === "top" ? trunkY - 0.22 : trunkY + 0.22;
      const midY = branch.side === "top" ? trunkY - 0.10 : trunkY + 0.10;

      // Out curve
      const outCurve = sampleBezier3(
        [trunkPt[0], trunkPt[1]],
        [trunkPt[0] + 0.02, midY],
        [trunkPt[0] + 0.04, outY + (branch.side === "top" ? 0.04 : -0.04)],
        [trunkPt[0] + 0.08, outY],
        20
      );

      // Horizontal segment
      const firstNodeX = branch.nodes[0].x;
      const lastNodeX = branch.nodes[branch.nodes.length - 1].x;
      const horiz: [number, number][] = [];
      for (let i = 0; i <= 30; i++) {
        horiz.push([firstNodeX - 0.04 + (lastNodeX - firstNodeX + 0.08) * (i / 30), outY]);
      }

      // Back curve
      const backCurve = sampleBezier3(
        [lastNodeX + 0.04, outY],
        [lastNodeX + 0.06, outY + (branch.side === "top" ? 0.04 : -0.04)],
        [lastNodeX + 0.08, midY],
        [trunkPoints[branch.trunkIdx + 1]?.[0] || rightX, trunkY],
        20
      );

      return [...outCurve, ...horiz, ...backCurve];
    }

    const branchPaths = branches.map(buildBranchPath);

    // Trunk path (connect all trunk points)
    const trunkPath: [number, number][] = [];
    for (let i = 0; i < trunkPoints.length - 1; i++) {
      const p0 = trunkPoints[i];
      const p3 = trunkPoints[i + 1];
      const p1: [number, number] = [p0[0] + (p3[0] - p0[0]) * 0.3, p0[1]];
      const p2: [number, number] = [p3[0] - (p3[0] - p0[0]) * 0.3, p3[1]];
      trunkPath.push(...sampleBezier3(p0, p1, p2, p3, 30));
    }

    // Animation timings
    const GRID_DUR = 400;
    const TRUNK_DUR = 1200;
    const BRANCH_DUR = 800;
    const NODE_DUR = 400;
    const LABEL_DUR = 350;

    const TRUNK_START = 200;
    const BRANCH_START = 1000;
    const NODE_START = 1600;
    const LABEL_START = 2000;

    const drawGrid = (alpha: number) => {
      ctx.strokeStyle = `rgba(19,34,56,${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 20; i++) {
        const x = (i / 20) * W;
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

    const drawRingNode = (x: number, y: number, color: string, progress: number, time: number, r = 6) => {
      if (progress <= 0) return;
      const px = x * W;
      const py = y * H;
      const eased = easeOutCubic(clamp01(progress));
      const pulse = 1 + Math.sin(time * 0.002 + x * 10) * 0.05;
      const radius = r * eased * pulse;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color + "30";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color + "30";
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBadge = (x: number, y: number, text: string, color: string, progress: number, side: "top" | "bottom") => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const px = x * W;
      const py = y * H;
      const offsetY = side === "top" ? -22 : 22;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      const tw = ctx.measureText(text).width;
      const bw = tw + 20;
      const bh = 22;
      const bx = px - bw / 2;
      const by = py + offsetY - bh / 2;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = color + "40";
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.stroke();

      // Dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx + 10, by + bh / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = WHITE_70;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + 18, by + bh / 2 + 0.5);
      ctx.restore();
    };

    const drawDetailLabel = (x: number, y: number, label: string, sublabel: string | undefined, color: string, progress: number, side: "top" | "bottom") => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const px = x * W;
      const py = y * H;
      const offsetY = side === "top" ? -14 : 14;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(label, px, py + offsetY);

      if (sublabel) {
        ctx.font = "9px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = WHITE_50;
        ctx.fillText(sublabel, px, py + offsetY + 13);
      }
      ctx.restore();
    };

    const drawTrunkLabel = (x: number, y: number, label: string, color: string, progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      ctx.save();
      ctx.globalAlpha = eased;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(label, x * W, y * H + 22);
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

    const trunkLabels = ["SOURCE", "INVENTORY", "MANUFACTURING", "WAREHOUSE", "DISTRIBUTION"];
    const trunkColors = ["#00bf63", "#3e96cc", "#3e96cc", "#ffc354", "#ffc354"];

    const draw = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP;
      ctx.fillRect(0, 0, W, H);

      drawGrid(easeOutCubic(clamp01(elapsed / GRID_DUR)));

      // Draw trunk
      const trunkProgress = clamp01((elapsed - TRUNK_START) / TRUNK_DUR);
      drawPath(trunkPath, TRUNK_DIM, 2, easeOutCubic(trunkProgress));

      // Draw branches
      branches.forEach((branch, bi) => {
        const delay = bi * 200;
        const progress = clamp01((elapsed - BRANCH_START - delay) / BRANCH_DUR);
        drawPath(branchPaths[bi], branch.color + "80", 1.5, easeOutCubic(progress));
      });

      // Trunk nodes + labels
      trunkPoints.forEach((pt, i) => {
        const nodeProgress = clamp01((elapsed - NODE_START - i * 100) / NODE_DUR);
        drawRingNode(pt[0], pt[1], trunkColors[i], nodeProgress, now, 7);
        const labelProgress = clamp01((elapsed - LABEL_START - i * 100) / LABEL_DUR);
        drawTrunkLabel(pt[0], pt[1], trunkLabels[i], trunkColors[i], labelProgress);
      });

      // Branch nodes + labels
      branches.forEach((branch, bi) => {
        const branchDelay = bi * 250;
        const baseX = trunkPoints[branch.trunkIdx][0];
        const outY = branch.side === "top" ? trunkY - 0.22 : trunkY + 0.22;

        // Branch badge at the start
        const badgeProgress = clamp01((elapsed - LABEL_START - branchDelay) / LABEL_DUR);
        drawBadge(baseX + 0.04, outY, branch.label, branch.color, badgeProgress, branch.side);

        // Branch detail nodes
        branch.nodes.forEach((node, ni) => {
          const nodeDelay = branchDelay + ni * 150;
          const nodeProgress = clamp01((elapsed - NODE_START - 300 - nodeDelay) / NODE_DUR);
          drawRingNode(node.x, outY, branch.color, nodeProgress, now, 5);
          const labelProgress = clamp01((elapsed - LABEL_START + 200 - nodeDelay) / LABEL_DUR);
          drawDetailLabel(node.x, outY, node.label, node.sublabel, branch.color, labelProgress, branch.side);
        });
      });

      // Start / End
      const startProgress = clamp01((elapsed - LABEL_START) / LABEL_DUR);
      ctx.save();
      ctx.globalAlpha = easeOutQuart(startProgress);
      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = WHITE_50;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ORIGIN", leftX * W, trunkY * H + 22);
      ctx.restore();

      const endProgress = clamp01((elapsed - NODE_START - trunkPoints.length * 100) / NODE_DUR);
      drawRingNode(rightX, trunkY, "#cb6ce6", endProgress, now, 7);
      const endLabelProgress = clamp01((elapsed - LABEL_START - trunkPoints.length * 100) / LABEL_DUR);
      ctx.save();
      ctx.globalAlpha = easeOutQuart(endLabelProgress);
      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#cb6ce6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CONSUMER", rightX * W, trunkY * H + 22);
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "380px" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-2xl" style={{ background: DEEP }} />
    </div>
  );
}
