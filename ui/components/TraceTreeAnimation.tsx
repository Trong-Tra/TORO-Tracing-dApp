"use client";

import React, { useEffect, useRef } from "react";

const DEEP = "#0a1628";
const WHITE = "#ffffff";
const WHITE_70 = "#ffffffb3";
const WHITE_50 = "#ffffff80";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

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

    const trunkY = 0.55;
    const leftX = 0.06;
    const rightX = 0.92;

    const stages = [
      { x: 0.14, label: "SOURCE", color: "#00bf63" },
      { x: 0.34, label: "INVENTORY", color: "#3e96cc" },
      { x: 0.54, label: "MANUFACTURING", color: "#3e96cc" },
      { x: 0.74, label: "WAREHOUSE", color: "#ffc354" },
      { x: 0.88, label: "DISTRIBUTION", color: "#ffc354" },
    ];

    interface Branch {
      stageX: number;
      side: "top" | "bottom";
      color: string;
      nodes: { x: number; title: string; sub: string }[];
    }

    const branches: Branch[] = [
      {
        stageX: 0.14,
        side: "top",
        color: "#00bf63",
        nodes: [
          { x: 0.26, title: "WILD-CATCH-001", sub: "Catch Yellowfin · Bình Định" },
          { x: 0.40, title: "mintBatch()", sub: "800kg recorded on-chain" },
        ],
      },
      {
        stageX: 0.34,
        side: "bottom",
        color: "#3e96cc",
        nodes: [
          { x: 0.48, title: "Port Receipt", sub: "Weight check · GPS + Timestamp" },
        ],
      },
      {
        stageX: 0.54,
        side: "bottom",
        color: "#ffc354",
        nodes: [
          { x: 0.68, title: "FARM-001", sub: "Farm Raised · Khánh Hòa" },
          { x: 0.82, title: "mintBatch()", sub: "2500kg recorded on-chain" },
        ],
      },
    ];

    function buildBranchPath(branch: Branch): [number, number][] {
      const trunkPt: [number, number] = [branch.stageX, trunkY];
      const outY = branch.side === "top" ? trunkY - 0.24 : trunkY + 0.24;
      const midY = branch.side === "top" ? trunkY - 0.08 : trunkY + 0.08;
      const endX = branch.nodes[branch.nodes.length - 1].x + 0.06;

      const curve = sampleBezier3(
        trunkPt,
        [trunkPt[0] + 0.04, midY],
        [trunkPt[0] + 0.08, outY + (branch.side === "top" ? 0.04 : -0.04)],
        [trunkPt[0] + 0.14, outY],
        30
      );

      const startX = trunkPt[0] + 0.14;
      const horiz: [number, number][] = [];
      for (let i = 0; i <= 50; i++) {
        horiz.push([startX + (endX - startX) * (i / 50), outY]);
      }

      return [...curve, ...horiz];
    }

    const branchPaths = branches.map(buildBranchPath);

    const GRID_DUR = 400;
    const TRUNK_DUR = 1000;
    const BRANCH_DUR = 900;
    const NODE_DUR = 400;
    const LABEL_DUR = 350;

    const TRUNK_START = 200;
    const BRANCH_START = 900;
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
      ctx.shadowBlur = 10;
      ctx.shadowColor = color + "30";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color + "20";
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

    const drawNodeLabel = (x: number, y: number, title: string, sub: string, color: string, progress: number, side: "top" | "bottom") => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const px = x * W;
      const py = y * H;
      const offsetY = side === "top" ? -18 : 18;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(title, px, py + offsetY);

      ctx.font = "10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = WHITE_50;
      ctx.fillText(sub, px, py + offsetY + 14);
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
      ctx.fillText(label, x * W, y * H + 20);
      ctx.restore();
    };

    const draw = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP;
      ctx.fillRect(0, 0, W, H);

      drawGrid(easeOutCubic(clamp01(elapsed / GRID_DUR)));

      // Main trunk
      const trunkProgress = clamp01((elapsed - TRUNK_START) / TRUNK_DUR);
      const trunkEndX = leftX + (rightX - leftX) * easeOutCubic(trunkProgress);
      ctx.save();
      ctx.strokeStyle = "#3e96cc4d";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(leftX * W, trunkY * H);
      ctx.lineTo(trunkEndX * W, trunkY * H);
      ctx.stroke();
      if (trunkProgress < 1) {
        ctx.fillStyle = WHITE;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#3e96cc";
        ctx.beginPath();
        ctx.arc(trunkEndX * W, trunkY * H, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Branches
      branches.forEach((branch, bi) => {
        const delay = bi * 200;
        const progress = clamp01((elapsed - BRANCH_START - delay) / BRANCH_DUR);
        drawPath(branchPaths[bi], branch.color + "60", 1.5, easeOutCubic(progress));

        const outY = branch.side === "top" ? trunkY - 0.24 : trunkY + 0.24;

        // Branch nodes + labels
        branch.nodes.forEach((node, ni) => {
          const nodeDelay = delay + ni * 150;
          const nodeProgress = clamp01((elapsed - NODE_START - nodeDelay) / NODE_DUR);
          drawRingNode(node.x, outY, branch.color, nodeProgress, now, 5);
          const labelProgress = clamp01((elapsed - LABEL_START + 100 - nodeDelay) / LABEL_DUR);
          drawNodeLabel(node.x, outY, node.title, node.sub, branch.color, labelProgress, branch.side);
        });

        // End cap
        const endPt = branchPaths[bi][branchPaths[bi].length - 1];
        const endProgress = clamp01((elapsed - NODE_START - delay - branch.nodes.length * 150) / NODE_DUR);
        drawRingNode(endPt[0], endPt[1], branch.color, endProgress, now, 3);
      });

      // Trunk nodes + labels
      stages.forEach((stage, i) => {
        const nodeProgress = clamp01((elapsed - NODE_START - i * 100) / NODE_DUR);
        drawRingNode(stage.x, trunkY, stage.color, nodeProgress, now, 7);
        const labelProgress = clamp01((elapsed - LABEL_START - i * 100) / LABEL_DUR);
        drawTrunkLabel(stage.x, trunkY, stage.label, stage.color, labelProgress);
      });

      // Start label
      const startProgress = clamp01((elapsed - LABEL_START) / LABEL_DUR);
      ctx.save();
      ctx.globalAlpha = easeOutQuart(startProgress);
      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = WHITE_50;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ORIGIN", leftX * W, trunkY * H + 20);
      ctx.restore();

      // End arrow
      const endProgress = clamp01((elapsed - NODE_START - stages.length * 100) / NODE_DUR);
      if (endProgress > 0) {
        const ex = rightX * W + 10;
        const ey = trunkY * H;
        ctx.save();
        ctx.globalAlpha = easeOutQuart(endProgress);
        ctx.fillStyle = "#cb6ce6";
        ctx.beginPath();
        ctx.moveTo(ex + 4, ey);
        ctx.lineTo(ex - 4, ey - 4);
        ctx.lineTo(ex - 4, ey + 4);
        ctx.closePath();
        ctx.fill();
        ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#cb6ce6";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("CONSUMER", ex + 8, ey);
        ctx.restore();
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
