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
  line: "#3e96cc",
  lineDim: "#3e96cc4d",
  source: "#00bf63",
  inventory: "#3e96cc",
  manufacturing: "#3e96cc",
  warehouse: "#ffc354",
  distribution: "#ffc354",
  consumer: "#cb6ce6",
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

    // ═════ Timeline layout ═════
    const centerY = 0.55;
    const leftX = 0.08;
    const rightX = 0.92;

    // Timeline events
    const events = [
      { x: 0.12, label: "SOURCE", sub: "Catch / Farm", color: C.source, icon: "fish" },
      { x: 0.30, label: "INVENTORY", sub: "Port Receipt", color: C.inventory, icon: "box" },
      { x: 0.48, label: "MANUFACTURING", sub: "Processing Plant", color: C.manufacturing, icon: "factory" },
      { x: 0.66, label: "WAREHOUSE", sub: "Cold Storage", color: C.warehouse, icon: "snow" },
      { x: 0.84, label: "DISTRIBUTION", sub: "Shipping", color: C.distribution, icon: "ship" },
    ];

    // Animation phases
    const GRID_DUR = 400;
    const LINE_DUR = 1200;
    const NODE_DUR = 500;
    const LABEL_DUR = 400;

    const LINE_START = 200;
    const NODES_START = 1000;
    const LABELS_START = 1400;

    const drawGrid = (alpha: number) => {
      ctx.strokeStyle = `rgba(19,34,56,${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      const cols = 20;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * W;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    };

    const drawTimelineLine = (progress: number) => {
      const maxX = leftX + (rightX - leftX) * progress;
      ctx.save();
      ctx.strokeStyle = C.lineDim;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(leftX * W, centerY * H);
      ctx.lineTo(maxX * W, centerY * H);
      ctx.stroke();

      // Leading dot
      if (progress < 1) {
        ctx.fillStyle = WHITE;
        ctx.shadowBlur = 10;
        ctx.shadowColor = C.line;
        ctx.beginPath();
        ctx.arc(maxX * W, centerY * H, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawNode = (
      x: number,
      y: number,
      color: string,
      progress: number,
      time: number
    ) => {
      if (progress <= 0) return;
      const px = x * W;
      const py = y * H;
      const eased = easeOutCubic(clamp01(progress));
      const pulse = 1 + Math.sin(time * 0.002) * 0.06;
      const r = 7 * eased * pulse;

      ctx.save();
      ctx.globalAlpha = eased;

      // Outer glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = color + "40";

      // Hollow ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();

      // Inner fill (subtle)
      ctx.fillStyle = color + "20";
      ctx.beginPath();
      ctx.arc(px, py, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawLabel = (
      x: number,
      y: number,
      label: string,
      sub: string,
      color: string,
      progress: number,
      position: "top" | "bottom"
    ) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const px = x * W;
      const py = y * H;
      const offset = position === "top" ? -28 : 28;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Label
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(label, px, py + offset);

      // Sublabel
      ctx.font = "10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = WHITE_50;
      ctx.fillText(sub, px, py + offset + 14);

      ctx.restore();
    };

    const drawConnectorLine = (
      x: number,
      y1: number,
      y2: number,
      color: string,
      progress: number
    ) => {
      if (progress <= 0) return;
      const eased = easeOutCubic(clamp01(progress));
      const px = x * W;
      const py1 = y1 * H;
      const py2 = y2 * H;
      const currY = py1 + (py2 - py1) * eased;

      ctx.save();
      ctx.strokeStyle = color + "40";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, py1);
      ctx.lineTo(px, currY);
      ctx.stroke();
      ctx.restore();
    };

    const drawStartBadge = (progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const x = leftX * W - 16;
      const y = centerY * H;
      const text = "ORIGIN";

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      const tw = ctx.measureText(text).width;
      const bw = tw + 16;
      const bh = 22;
      const bx = x - bw;
      const by = y - bh / 2;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = WHITE_70;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + bw / 2, y);
      ctx.restore();
    };

    const drawEndArrow = (progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutQuart(clamp01(progress));
      const x = rightX * W;
      const y = centerY * H;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.strokeStyle = C.consumer + "80";
      ctx.fillStyle = C.consumer + "80";
      ctx.lineWidth = 1.5;

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y - 5);
      ctx.lineTo(x - 8, y + 5);
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = C.consumer;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("CONSUMER", x + 8, y);

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

      // Grid
      drawGrid(easeOutCubic(clamp01(elapsed / GRID_DUR)));

      // Timeline line
      const lineProgress = clamp01((elapsed - LINE_START) / LINE_DUR);
      drawTimelineLine(easeOutCubic(lineProgress));

      // Start badge
      drawStartBadge(clamp01((elapsed - LINE_START - 200) / LABEL_DUR));

      // Events
      events.forEach((ev, i) => {
        const nodeDelay = i * 150;
        const labelDelay = i * 150 + 100;

        const nodeProgress = clamp01((elapsed - NODES_START - nodeDelay) / NODE_DUR);
        drawNode(ev.x, centerY, ev.color, nodeProgress, now);

        // Alternate labels top/bottom
        const position = i % 2 === 0 ? "top" : "bottom";
        const labelProgress = clamp01((elapsed - LABELS_START - labelDelay) / LABEL_DUR);
        drawLabel(ev.x, centerY, ev.label, ev.sub, ev.color, labelProgress, position);

        // Dashed connector from node to label area
        const connectorProgress = clamp01((elapsed - LABELS_START - labelDelay + 100) / 300);
        const labelY = position === "top" ? centerY - 0.08 : centerY + 0.08;
        drawConnectorLine(ev.x, centerY, labelY, ev.color, connectorProgress);
      });

      // End arrow
      const endProgress = clamp01((elapsed - NODES_START - events.length * 150) / LABEL_DUR);
      drawEndArrow(endProgress);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "320px" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-2xl" style={{ background: DEEP }} />
    </div>
  );
}
