"use client";

import React, { useEffect, useRef } from "react";

const DEEP = "#0a1628";
const WHITE = "#ffffff";
const WHITE_50 = "#ffffff80";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}
function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

/* ─── Types ─── */

type NodeType = "pill" | "circle";

interface BranchNode {
  type: NodeType;
  title: string;
  sub?: string;
}

interface Branch {
  stageX: number;
  side: "top" | "bottom";
  color: string;
  y: number;
  nodes: BranchNode[];
}

interface ComputedNode extends BranchNode {
  nx: number;
  ny: number;
  px: number;
  py: number;
  pillW: number;
  pillH: number;
}

interface ComputedBranch extends Branch {
  computedNodes: ComputedNode[];
  startX: number;
  endX: number;
}

/* ─── Data ─── */

const stages = [
  { x: 0.10, label: "SOURCE", color: "#00bf63" },
  { x: 0.22, label: "INVENTORY", color: "#3e96cc" },
  { x: 0.40, label: "MANUFACTURING", color: "#3e96cc" },
  { x: 0.54, label: "WAREHOUSE", color: "#ffc354" },
  { x: 0.62, label: "DISTRIBUTION", color: "#ffc354" },
];

const branches: Branch[] = [
  {
    stageX: 0.10,
    side: "top",
    color: "#00bf63",
    y: 0.13,
    nodes: [
      { type: "pill", title: "Catch Yellowfin", sub: "Bình Định" },
      { type: "circle", title: "humanProcess()" },
      { type: "pill", title: "graphCheck()" },
      { type: "circle", title: "mpcSign()" },
      { type: "circle", title: "mintBatch()", sub: "800kg on-chain" },
    ],
  },
  {
    stageX: 0.22,
    side: "bottom",
    color: "#3e96cc",
    y: 0.66,
    nodes: [
      { type: "pill", title: "Port Receipt", sub: "Weight · GPS · Time" },
      { type: "pill", title: "graphCheck()" },
      { type: "circle", title: "recordInventory()" },
    ],
  },
  {
    stageX: 0.40,
    side: "top",
    color: "#3e96cc",
    y: 0.24,
    nodes: [
      { type: "pill", title: "Processing", sub: "Canning · Labeling" },
      { type: "pill", title: "graphCheck()" },
      { type: "circle", title: "recordManufacturing()" },
    ],
  },
  {
    stageX: 0.54,
    side: "bottom",
    color: "#ffc354",
    y: 0.82,
    nodes: [
      { type: "pill", title: "Storage", sub: "Temp Monitor" },
      { type: "pill", title: "graphCheck()" },
      { type: "circle", title: "mpcSign()" },
      { type: "circle", title: "recordWarehouse()" },
    ],
  },
  {
    stageX: 0.62,
    side: "top",
    color: "#ffc354",
    y: 0.38,
    nodes: [
      { type: "pill", title: "Logistics", sub: "Delivery Tracking" },
      { type: "pill", title: "graphCheck()" },
      { type: "circle", title: "recordDistribution()" },
    ],
  },
];

/* ─── Component ─── */

export default function TraceTreeAnimation() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Baseline design size all constants below were tuned against.
    // `scale` is derived from actual container width / this baseline,
    // so every font size, radius, and gap shrinks/grows in proportion
    // to whatever width the container actually has — nothing depends
    // on a fixed 1200px canvas anymore, so nothing can render off-screen.
    const BASE_W = 1200;
    const BASE_H = 360;

    let W = BASE_W;
    let H = BASE_H;
    let scale = 1;

    const trunkY = 0.52;
    const leftX = 0.06;
    // rightX is computed per-resize below: the trunk extends as far right
    // as possible while reserving just enough space for the arrowhead and
    // the "CONSUMER" label, so the trunk is as long as it can be without
    // ever clipping the label again.
    let rightX = 0.92;

    let computedBranches: ComputedBranch[] = [];

    /* ─── Layout ─── */

    const computeLayout = () => {
      const minGap = 20 * scale;
      const startOffset = 16 * scale;

      computedBranches = branches.map((branch) => {
        let currentX = branch.stageX * W + startOffset;

        const computedNodes: ComputedNode[] = branch.nodes.map((node) => {
          let pillW = 0;
          let pillH = 0;
          // Horizontal slot the node reserves. For circles this includes the
          // label drawn beside/above them, so neighbouring labels never overlap.
          let extentW = 0;

          if (node.type === "pill") {
            ctx.font = `bold ${Math.max(8, 9 * scale)}px system-ui, -apple-system, sans-serif`;
            const titleW = ctx.measureText(node.title).width;
            let subW = 0;
            if (node.sub) {
              ctx.font = `${Math.max(7, 8 * scale)}px system-ui, -apple-system, sans-serif`;
              subW = ctx.measureText(node.sub).width;
            }
            const textW = Math.max(titleW, subW);
            pillW = Math.max(textW + 26 * scale, 78 * scale);
            pillH = node.sub ? 34 * scale : 24 * scale;
            extentW = pillW;
          } else {
            pillW = 26 * scale;
            pillH = 26 * scale;
            ctx.font = `bold ${Math.max(7, 9 * scale)}px monospace, system-ui, sans-serif`;
            let labelW = ctx.measureText(node.title).width;
            if (node.sub) {
              ctx.font = `${Math.max(7, 8 * scale)}px system-ui, -apple-system, sans-serif`;
              labelW = Math.max(labelW, ctx.measureText(node.sub).width);
            }
            extentW = Math.max(pillW, labelW + 12 * scale);
          }

          const px = currentX + extentW / 2;
          const nx = px / W;

          currentX += extentW + minGap;

          return {
            ...node,
            nx,
            ny: branch.y,
            px,
            py: branch.y * H,
            pillW,
            pillH,
          };
        });

        return {
          ...branch,
          computedNodes,
          startX: computedNodes[0].nx,
          endX: computedNodes[computedNodes.length - 1].nx,
        };
      });
    };

    const resize = () => {
      // Use the wrapper's actual rendered width instead of a fixed 1200px.
      // Fall back to BASE_W only if the container hasn't been laid out yet.
      const containerW = wrapper.clientWidth || BASE_W;
      W = containerW;
      scale = W / BASE_W;
      H = BASE_H * scale;

      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeLayout();
    };

    resize();
    document.fonts.ready.then(() => {
      resize();
    });

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(wrapper);

    /* ─── Drawing helpers ─── */

    const drawGrid = (alpha: number) => {
      ctx.strokeStyle = `rgba(19, 34, 56, ${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      const step = W / 26;
      for (let x = step; x < W; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    };

    const drawTrunk = (progress: number) => {
      const endX = leftX + (rightX - leftX) * easeOutCubic(progress);

      ctx.save();
      ctx.strokeStyle = "#3e96cc4d";
      ctx.lineWidth = 2 * scale;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(leftX * W, trunkY * H);
      ctx.lineTo(endX * W, trunkY * H);
      ctx.stroke();

      if (progress < 1) {
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor = "#3e96cc";
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(endX * W, trunkY * H, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    };

    const drawTrunkStage = (
      x: number,
      label: string,
      color: string,
      progress: number,
      time: number
    ) => {
      if (progress <= 0) return;
      const px = x * W;
      const py = trunkY * H;
      const eased = easeOutCubic(clamp01(progress));
      const pulse = 1 + Math.sin(time * 0.002 + x * 10) * 0.04;
      const r = 7 * scale * eased * pulse;

      ctx.save();
      ctx.globalAlpha = eased;

      ctx.shadowBlur = 10 * scale;
      ctx.shadowColor = color + "30";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = color + "18";
      ctx.beginPath();
      ctx.arc(px, py, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.fillStyle = color;
      ctx.font = `bold ${Math.max(8, 10 * scale)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, px, py + 20 * scale);

      ctx.restore();
    };

    const drawConnector = (
      sx: number,
      sy: number,
      ex: number,
      ey: number,
      color: string,
      progress: number
    ) => {
      if (progress <= 0) return;
      const eased = easeOutCubic(clamp01(progress));

      ctx.save();
      ctx.strokeStyle = color + "50";
      ctx.lineWidth = 1 * scale;
      ctx.setLineDash([4 * scale, 3 * scale]);
      ctx.lineCap = "round";

      const px1 = sx * W;
      const py1 = sy * H;
      const px2 = ex * W;
      const py2 = sy * H + (ey - sy) * H * eased;

      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.restore();
    };

    const drawBranchLine = (branch: ComputedBranch, progress: number) => {
      if (progress <= 0) return;
      const eased = easeOutCubic(clamp01(progress));

      const sx = branch.stageX * W;
      const sy = branch.y * H;
      const lastNode = branch.computedNodes[branch.computedNodes.length - 1];
      const ex = sx + (lastNode.px + 10 * scale - sx) * eased;

      ctx.save();
      ctx.strokeStyle = branch.color + "35";
      ctx.lineWidth = 1 * scale;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, sy);
      ctx.stroke();
      ctx.restore();
    };

    const drawPill = (
      node: ComputedNode,
      color: string,
      progress: number
    ) => {
      if (progress <= 0) return;
      const t = clamp01(progress);
      const eased = easeOutCubic(t);
      const pop = easeOutBack(t);
      const px = node.px;
      const py = node.py;
      const w = node.pillW * pop;
      const h = node.pillH;
      const r = 6 * scale;

      ctx.save();
      ctx.globalAlpha = eased;

      // Background
      ctx.fillStyle = "rgba(15, 30, 54, 0.88)";
      roundRect(ctx, px - w / 2, py - h / 2, w, h, r);
      ctx.fill();

      // Border
      ctx.strokeStyle = color + "55";
      ctx.lineWidth = 1 * scale;
      roundRect(ctx, px - w / 2, py - h / 2, w, h, r);
      ctx.stroke();

      // Glow
      ctx.shadowBlur = 10 * scale;
      ctx.shadowColor = color + "12";
      roundRect(ctx, px - w / 2, py - h / 2, w, h, r);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Title
      ctx.fillStyle = WHITE;
      ctx.font = `bold ${Math.max(8, 9 * scale)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const titleY = node.sub ? py - 4 * scale : py;
      ctx.fillText(
        truncateText(ctx, node.title, w - 16 * scale),
        px,
        titleY
      );

      // Sub
      if (node.sub) {
        ctx.fillStyle = WHITE_50;
        ctx.font = `${Math.max(7, 8 * scale)}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(
          truncateText(ctx, node.sub, w - 16 * scale),
          px,
          py + 8 * scale
        );
      }

      ctx.restore();
    };

    const drawCircleNode = (
      node: ComputedNode,
      color: string,
      progress: number,
      morphProgress: number,
      time: number,
      side: "top" | "bottom"
    ) => {
      if (progress <= 0) return;
      const eased = easeOutCubic(clamp01(progress));
      const px = node.px;
      const py = node.py;
      const pulse = 1 + Math.sin(time * 0.002 + node.nx * 10) * 0.04;
      const finalR = 8 * scale * pulse;

      // Time-driven verify morph:
      // small dot -> grows to fill the whole disc -> checkmark draws on top
      const t = clamp01(morphProgress);

      ctx.save();
      ctx.globalAlpha = eased;

      // Solid disc: dot grows to full radius, then stays filled
      const growT = easeOutCubic(clamp01(t / 0.35));
      const discR = Math.max(0.5, (2 + (finalR - 2) * growT) * eased);

      ctx.fillStyle = color;
      ctx.shadowBlur = 10 * scale;
      ctx.shadowColor = color + "60";
      ctx.beginPath();
      ctx.arc(px, py, discR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Checkmark "cut out" of the disc once the branch has passed.
      // Drawn stroke-by-stroke in the background colour.
      if (t > 0.55) {
        const checkEased = easeOutCubic(clamp01((t - 0.55) / 0.45));

        ctx.strokeStyle = DEEP;
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const s = scale * pulse;
        const x1 = px - 4 * s,
          y1 = py + 0.5 * s;
        const x2 = px - 1 * s,
          y2 = py + 3.5 * s;
        const x3 = px + 4.5 * s,
          y3 = py - 3.5 * s;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        if (checkEased < 0.5) {
          const k = checkEased / 0.5;
          ctx.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k);
        } else {
          ctx.lineTo(x2, y2);
          const k = (checkEased - 0.5) / 0.5;
          ctx.lineTo(x2 + (x3 - x2) * k, y2 + (y3 - y2) * k);
        }
        ctx.stroke();
      }

      // Label: top branches = above, bottom branches = below.
      // Layout already reserves label width per node, so a single row is enough.
      const isTop = side === "top";
      const baseOffset = discR + 6 * scale;

      ctx.fillStyle = color;
      ctx.font = `bold ${Math.max(7, 9 * scale)}px monospace, system-ui, sans-serif`;
      ctx.textAlign = "center";

      if (isTop) {
        ctx.textBaseline = "bottom";
        ctx.fillText(node.title, px, py - baseOffset);
        if (node.sub) {
          ctx.fillStyle = WHITE_50;
          ctx.font = `${Math.max(7, 8 * scale)}px system-ui, -apple-system, sans-serif`;
          ctx.fillText(node.sub, px, py - baseOffset - 10 * scale);
        }
      } else {
        ctx.textBaseline = "top";
        ctx.fillText(node.title, px, py + baseOffset);
        if (node.sub) {
          ctx.fillStyle = WHITE_50;
          ctx.font = `${Math.max(7, 8 * scale)}px system-ui, -apple-system, sans-serif`;
          ctx.fillText(node.sub, px, py + baseOffset + 10 * scale);
        }
      }

      ctx.restore();
    };

    /* ─── Timing constants ─── */
    const GRID_DUR = 800;
    const TRUNK_START = 600;
    const TRUNK_DUR = 6000;
    const CONNECTOR_DUR = 700;
    const BRANCH_LINE_DUR = 900;
    const NODE_POP_DUR = 500;
    const NODE_STAGGER = 420;
    const MORPH_DUR = 1200;
    const LABEL_FADE_DUR = 400;
    const LABEL_DELAY = 200;

    function trunkReachTime(spatialProgress: number): number {
      const t = 1 - Math.pow(1 - clamp01(spatialProgress), 1 / 3);
      return TRUNK_START + t * TRUNK_DUR;
    }

    /* ─── Main draw loop ─── */
    const startTime = performance.now();

    const draw = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP;
      ctx.fillRect(0, 0, W, H);

      drawGrid(easeOutCubic(clamp01(elapsed / GRID_DUR)));

      // ---- Trunk ----
      const trunkProgress = clamp01((elapsed - TRUNK_START) / TRUNK_DUR);
      drawTrunk(trunkProgress);

      // Traveling pulse looping along the completed trunk
      if (trunkProgress >= 1) {
        const cycle = 4200;
        const p = ((elapsed - TRUNK_START - TRUNK_DUR) % cycle) / cycle;
        const pulseX = (leftX + (rightX - leftX) * p) * W;
        ctx.save();
        ctx.globalAlpha = 0.85 * Math.sin(p * Math.PI);
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor = "#7db8e8";
        ctx.fillStyle = "#cfe6ff";
        ctx.beginPath();
        ctx.arc(pulseX, trunkY * H, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ---- Trunk stages ----
      stages.forEach((stage) => {
        const spatial = clamp01((stage.x - leftX) / (rightX - leftX));
        const reach = trunkReachTime(spatial);
        const nodeProgress = clamp01((elapsed - reach) / NODE_POP_DUR);
        drawTrunkStage(stage.x, stage.label, stage.color, nodeProgress, now);
      });

      // ---- Tick marks ----
      stages.forEach((stage) => {
        const spatial = clamp01((stage.x - leftX) / (rightX - leftX));
        const reach = trunkReachTime(spatial);
        const tickProgress = clamp01((elapsed - reach) / NODE_POP_DUR);
        if (tickProgress > 0) {
          ctx.save();
          ctx.globalAlpha = easeOutCubic(tickProgress) * 0.25;
          ctx.strokeStyle = stage.color;
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          ctx.moveTo(stage.x * W, trunkY * H - 8 * scale);
          ctx.lineTo(stage.x * W, trunkY * H + 8 * scale);
          ctx.stroke();
          ctx.restore();
        }
      });

      // ---- ORIGIN label ----
      const originReach = trunkReachTime(0);
      const originProgress = clamp01((elapsed - originReach) / LABEL_FADE_DUR);
      if (originProgress > 0) {
        ctx.save();
        ctx.globalAlpha = easeOutQuart(originProgress);
        ctx.font = `bold ${Math.max(8, 10 * scale)}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = WHITE_50;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("ORIGIN", leftX * W, trunkY * H - 12 * scale);
        ctx.restore();
      }

      // ---- CONSUMER arrow + label ----
      const endReach = trunkReachTime(1) + LABEL_DELAY;
      const endProgress = clamp01((elapsed - endReach) / LABEL_FADE_DUR);
      if (endProgress > 0) {
        const ey = trunkY * H;
        ctx.save();
        ctx.globalAlpha = easeOutQuart(endProgress);
        ctx.fillStyle = "#cb6ce6";
        ctx.font = `bold ${Math.max(8, 10 * scale)}px system-ui, -apple-system, sans-serif`;

        // Anchor the arrow's base to the exact point the trunk line ends at
        // (rightX * W), instead of deriving it from the label width. That
        // guarantees zero gap between the trunk and the arrowhead regardless
        // of font metrics or container width.
        const arrowBaseX = rightX * W;
        const arrowTipX = arrowBaseX + 9 * scale;
        const labelX = arrowTipX + 6 * scale;

        ctx.beginPath();
        ctx.moveTo(arrowTipX, ey);
        ctx.lineTo(arrowBaseX, ey - 4 * scale);
        ctx.lineTo(arrowBaseX, ey + 4 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("CONSUMERS", labelX, ey);
        ctx.restore();
      }

      // ---- Branches ----
      computedBranches.forEach((branch) => {
        const spatial = clamp01(
          (branch.stageX - leftX) / (rightX - leftX)
        );
        const trunkReach = trunkReachTime(spatial);

        // Connector (dashed vertical)
        const connectorStart = trunkReach + 250;
        const connectorProgress = clamp01(
          (elapsed - connectorStart) / CONNECTOR_DUR
        );
        drawConnector(
          branch.stageX,
          trunkY,
          branch.stageX,
          branch.y,
          branch.color,
          connectorProgress
        );

        // Junction dot
        const junctionStart = connectorStart + CONNECTOR_DUR;
        const junctionProgress = clamp01(
          (elapsed - junctionStart) / NODE_POP_DUR
        );
        if (junctionProgress > 0) {
          const jx = branch.stageX * W;
          const jy = branch.y * H;
          const jeased = easeOutCubic(junctionProgress);
          ctx.save();
          ctx.globalAlpha = jeased;
          ctx.strokeStyle = branch.color;
          ctx.lineWidth = 1.5 * scale;
          ctx.beginPath();
          ctx.arc(jx, jy, 4 * scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = branch.color + "30";
          ctx.fill();
          ctx.restore();
        }

        // Branch horizontal line
        const branchLineStart = connectorStart + CONNECTOR_DUR + 150;
        const branchLineProgress = clamp01(
          (elapsed - branchLineStart) / BRANCH_LINE_DUR
        );
        drawBranchLine(branch, branchLineProgress);

        // Nodes
        branch.computedNodes.forEach((node, i) => {
          const nodeStart = branchLineStart + 300 + i * NODE_STAGGER;
          const nodeProgress = clamp01((elapsed - nodeStart) / NODE_POP_DUR);

          if (node.type === "pill") {
            drawPill(node, branch.color, nodeProgress);
          } else {
            // Verify morph runs on its own clock once the node has popped in:
            // dot -> filled disc -> checkmark, slow enough to read each step
            const morphStart = nodeStart + NODE_POP_DUR + 150;
            const morphProgress = clamp01(
              (elapsed - morphStart) / MORPH_DUR
            );
            drawCircleNode(
              node,
              branch.color,
              nodeProgress,
              morphProgress,
              now,
              branch.side
            );
          }
        });
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Canvas now fills the container width responsively — no more
          fixed 1200px canvas requiring horizontal scroll to see content
          like the CONSUMER label at the far right. */}
      <div
        ref={wrapperRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ minHeight: "200px" }}
      >
        <canvas
          ref={canvasRef}
          style={{
            background: DEEP,
            width: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  const width = ctx.measureText(text).width;
  if (width <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 0 &&
    ctx.measureText(truncated + "…").width > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}