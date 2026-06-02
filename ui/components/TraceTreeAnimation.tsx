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

    const stages = [
      { x: 0.14, label: "SOURCE", color: "#00bf63" },
      { x: 0.34, label: "INVENTORY", color: "#3e96cc" },
      { x: 0.54, label: "MANUFACTURING", color: "#3e96cc" },
      { x: 0.74, label: "WAREHOUSE", color: "#ffc354" },
      { x: 0.90, label: "DISTRIBUTION", color: "#ffc354" },
    ];

    // Branches: vertical lines that go up/down from a stage and just end
    interface Branch {
      stageX: number;
      side: "top" | "bottom";
      color: string;
      label: string;
      items: { label: string; sublabel?: string }[];
    }

    const branches: Branch[] = [
      {
        stageX: 0.14,
        side: "top",
        color: "#00bf63",
        label: "WILD-CATCH-001",
        items: [
          { label: "Catch Yellowfin", sublabel: "Bình Định" },
          { label: "mintBatch()", sublabel: "800kg" },
        ],
      },
      {
        stageX: 0.34,
        side: "bottom",
        color: "#3e96cc",
        label: "Port Receipt",
        items: [
          { label: "Weight check", sublabel: "GPS + Timestamp" },
        ],
      },
      {
        stageX: 0.54,
        side: "bottom",
        color: "#ffc354",
        label: "FARM-001",
        items: [
          { label: "Farm Raised", sublabel: "Khánh Hòa" },
          { label: "mintBatch()", sublabel: "2500kg" },
        ],
      },
      {
        stageX: 0.74,
        side: "top",
        color: "#ffc354",
        label: "TORO-02",
        items: [
          { label: "createProductLot()", sublabel: "8800 cans" },
        ],
      },
    ];

    // Build simple vertical branch paths (just go up/down and end)
    function buildBranchPath(branch: Branch): [number, number][] {
      const pts: [number, number][] = [];
      const startY = trunkY;
      const endY = branch.side === "top" ? trunkY - 0.28 : trunkY + 0.28;
      const steps = 25;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const eased = easeOutCubic(t);
        pts.push([branch.stageX, startY + (endY - startY) * eased]);
      }
      return pts;
    }

    const branchPaths = branches.map(buildBranchPath);

    // Build horizontal mini-lines for branch items
    function buildItemLine(branch: Branch, itemIdx: number): [number, number][] {
      const baseY = branch.side === "top" ? trunkY - 0.12 - itemIdx * 0.08 : trunkY + 0.12 + itemIdx * 0.08;
      const startX = branch.stageX;
      const endX = branch.stageX + 0.16;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 20; i++) {
        pts.push([startX + (endX - startX) * (i / 20), baseY]);
      }
      return pts;
    }

    // Animation
    const GRID_DUR = 400;
    const TRUNK_DUR = 1000;
    const BRANCH_DUR = 600;
    const ITEM_DUR = 400;
    const NODE_DUR = 400;
    const LABEL_DUR = 350;

    const TRUNK_START = 200;
    const BRANCH_START = 900;
    const ITEM_START = 1400;
    const NODE_START = 1800;
    const LABEL_START = 2200;

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

    const drawBadge = (x: number, y: number, text: string, color: string, progress: number, side: "top" | "bottom") => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const px = x * W;
      const py = y * H;
      const offsetY = side === "top" ? -10 : 10;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      const tw = ctx.measureText(text).width;
      const bw = tw + 20;
      const bh = 20;
      const bx = px - bw / 2;
      const by = py + offsetY - bh / 2;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = color + "40";
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx + 9, by + bh / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = WHITE_70;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + 16, by + bh / 2 + 0.5);
      ctx.restore();
    };

    const drawItemLabel = (x: number, y: number, label: string, sublabel: string | undefined, color: string, progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const px = (x + 0.18) * W;
      const py = y * H;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(label, px, py);

      if (sublabel) {
        ctx.font = "9px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = WHITE_50;
        ctx.fillText(sublabel, px, py + 13);
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
      ctx.fillText(label, x * W, y * H + 20);
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
      // Leading dot
      if (trunkProgress < 1) {
        ctx.fillStyle = WHITE;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#3e96cc";
        ctx.beginPath();
        ctx.arc(trunkEndX * W, trunkY * H, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Branches (vertical lines)
      branches.forEach((branch, bi) => {
        const delay = bi * 150;
        const progress = clamp01((elapsed - BRANCH_START - delay) / BRANCH_DUR);
        drawPath(branchPaths[bi], branch.color + "60", 1.5, easeOutCubic(progress));

        // Branch end node
        const endNode = branchPaths[bi][branchPaths[bi].length - 1];
        const endProgress = clamp01((elapsed - NODE_START - delay) / NODE_DUR);
        drawRingNode(endNode[0], endNode[1], branch.color, endProgress, now, 5);

        // Branch badge
        const midY = branch.side === "top" ? trunkY - 0.06 : trunkY + 0.06;
        const badgeProgress = clamp01((elapsed - LABEL_START - delay) / LABEL_DUR);
        drawBadge(branch.stageX, midY, branch.label, branch.color, badgeProgress, branch.side);

        // Horizontal item lines + labels
        branch.items.forEach((item, ii) => {
          const itemDelay = delay + ii * 120;
          const itemLine = buildItemLine(branch, ii);
          const itemProgress = clamp01((elapsed - ITEM_START - itemDelay) / ITEM_DUR);
          drawPath(itemLine, branch.color + "40", 1.2, easeOutCubic(itemProgress));

          // Item end node
          const itemEnd = itemLine[itemLine.length - 1];
          const itemNodeProgress = clamp01((elapsed - NODE_START - 200 - itemDelay) / NODE_DUR);
          drawRingNode(itemEnd[0], itemEnd[1], branch.color, itemNodeProgress, now, 4);

          // Item label
          const labelProgress = clamp01((elapsed - LABEL_START + 100 - itemDelay) / LABEL_DUR);
          drawItemLabel(branch.stageX, itemEnd[1], item.label, item.sublabel, branch.color, labelProgress);
        });
      });

      // Trunk stage nodes + labels
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

      // End arrow + label
      const endProgress = clamp01((elapsed - NODE_START - stages.length * 100) / NODE_DUR);
      if (endProgress > 0) {
        const ex = rightX * W;
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
    <div ref={containerRef} className="relative w-full" style={{ height: "380px" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-2xl" style={{ background: DEEP }} />
    </div>
  );
}
