#!/usr/bin/env python3
"""Generate TORO blockchain architecture diagrams."""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle
import numpy as np

# TORO color palette
DEEP = "#0a1628"
OCEAN = "#3e96cc"
GOLD = "#ffc354"
GREEN = "#00bf63"
RED = "#ef4444"
SURFACE = "#0f1e36"
SURFACE_LIGHT = "#162744"
WHITE = "#ffffff"
WHITE_60 = "#ffffff99"
WHITE_40 = "#ffffff66"
WHITE_20 = "#ffffff33"

def setup_fig(width=14, height=8):
    fig, ax = plt.subplots(1, 1, figsize=(width, height))
    ax.set_facecolor(DEEP)
    fig.patch.set_facecolor(DEEP)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    return fig, ax

def rounded_box(ax, x, y, w, h, color, text, text_color=WHITE, fontsize=10, radius=0.02):
    box = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0.02,rounding_size={radius*max(w,h)}",
                         facecolor=color, edgecolor=WHITE_20, linewidth=1.5, zorder=2)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha="center", va="center", color=text_color,
            fontsize=fontsize, fontweight="bold", zorder=3)
    return box

def arrow(ax, x1, y1, x2, y2, color=WHITE_40):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=color, lw=2, mutation_scale=15),
                zorder=1)

def save(fig, name):
    fig.savefig(f"docs/diagrams/{name}.png", dpi=200, bbox_inches="tight", facecolor=DEEP, edgecolor="none")
    fig.savefig(f"docs/diagrams/{name}.svg", bbox_inches="tight", facecolor=DEEP, edgecolor="none")
    plt.close(fig)
    print(f"Saved {name}.png + .svg")

# ═══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 1: Supply Chain Stage Flow
# ═══════════════════════════════════════════════════════════════════════════════

fig, ax = setup_fig(16, 6)

# Title
ax.text(50, 94, "TORO Supply Chain Flow", ha="center", va="center", color=WHITE,
        fontsize=20, fontweight="bold")
ax.text(50, 88, "From Ocean to Shelf — Every Stage Immutable on Arbitrum", ha="center",
        va="center", color=WHITE_60, fontsize=11)

stages = [
    ("1. SOURCE", "Catch / Farm", "Bình Định, Phú Yên...", GREEN, "🎣"),
    ("2. INVENTORY", "Receive at Port", "Weight check, log", OCEAN, "📦"),
    ("3. MANUFACTURING", "Processing Plant", "Clean, can, label", OCEAN, "🏭"),
    ("4. WAREHOUSE", "Cold Storage", "2°C, track duration", GOLD, "❄️"),
    ("5. DISTRIBUTION", "Shipping", "Departure → Arrival", GOLD, "🚢"),
]

box_w = 16
box_h = 22
gap = 3
start_x = (100 - len(stages)*(box_w + gap) + gap) / 2

for i, (title, subtitle, detail, color, emoji) in enumerate(stages):
    x = start_x + i * (box_w + gap)
    y = 30
    
    # Stage box
    rounded_box(ax, x, y, box_w, box_h, SURFACE, "", radius=0.03)
    
    # Color accent bar at top
    bar = Rectangle((x+1, y+box_h-3), box_w-2, 2.5, facecolor=color, alpha=0.8, zorder=3)
    ax.add_patch(bar)
    
    # Number circle
    circle = Circle((x + box_w/2, y + box_h + 5), 4, facecolor=color, edgecolor=WHITE_40, linewidth=1.5, zorder=4)
    ax.add_patch(circle)
    ax.text(x + box_w/2, y + box_h + 5, str(i+1), ha="center", va="center", color=DEEP,
            fontsize=12, fontweight="bold", zorder=5)
    
    # Title
    ax.text(x + box_w/2, y + box_h - 8, title, ha="center", va="center", color=WHITE,
            fontsize=10, fontweight="bold")
    
    # Subtitle
    ax.text(x + box_w/2, y + box_h - 14, subtitle, ha="center", va="center", color=WHITE_60,
            fontsize=9)
    
    # Detail
    ax.text(x + box_w/2, y + box_h - 19, detail, ha="center", va="center", color=WHITE_40,
            fontsize=8)
    
    # Arrow between stages
    if i < len(stages) - 1:
        ax.annotate("", xy=(x + box_w + gap - 1, y + box_h/2), xytext=(x + box_w + 1, y + box_h/2),
                    arrowprops=dict(arrowstyle="->", color=WHITE_40, lw=1.5, mutation_scale=12),
                    zorder=1)

# Merge annotation
ax.text(start_x + box_w + gap/2, 18, "↓ merge at createProductLot()", ha="center", va="center",
        color=WHITE_40, fontsize=8, style="italic")

# Batch vs Lot labels
ax.text(start_x + box_w * 1.5 + gap, 10, "━ Batch Lifecycle (1→2→3)", ha="center", va="center",
        color=OCEAN, fontsize=9, fontweight="bold")
ax.text(start_x + box_w * 3.5 + gap * 3, 10, "━ Lot Lifecycle (3→4→5)", ha="center", va="center",
        color=GOLD, fontsize=9, fontweight="bold")

save(fig, "01_supply_chain_flow")

# ═══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 2: State Machine
# ═══════════════════════════════════════════════════════════════════════════════

fig, ax = setup_fig(14, 10)

ax.text(50, 96, "TORO State Machine", ha="center", va="center", color=WHITE,
        fontsize=20, fontweight="bold")
ax.text(50, 91, "Batch stages (left) advance independently. Lots (right) merge batches at stage 3.",
        ha="center", va="center", color=WHITE_60, fontsize=10)

# ── Batch State Machine (left side) ──
ax.text(22, 82, "BATCH LIFECYCLE", ha="center", va="center", color=OCEAN,
        fontsize=13, fontweight="bold")

batch_stages = [
    (22, 65, "0\n(none)", SURFACE_LIGHT),
    (22, 50, "1\nSOURCE", GREEN),
    (22, 35, "2\nINVENTORY", OCEAN),
    (22, 20, "3\nMANUF.", OCEAN),
]

for i, (x, y, text, color) in enumerate(batch_stages):
    circle = Circle((x, y), 5, facecolor=color, edgecolor=WHITE_40, linewidth=2, zorder=3)
    ax.add_patch(circle)
    ax.text(x, y, text, ha="center", va="center", color=WHITE if color != SURFACE_LIGHT else WHITE_40,
            fontsize=8, fontweight="bold", zorder=4)
    if i < len(batch_stages) - 1:
        ax.annotate("", xy=(x, y - 8), xytext=(x, batch_stages[i+1][1] + 8),
                    arrowprops=dict(arrowstyle="->", color=OCEAN, lw=2, mutation_scale=12), zorder=2)

# Batch functions
batch_funcs = ["mintBatch()", "recordInventory()", "recordManufacturing()"]
for i, func in enumerate(batch_funcs):
    y = (batch_stages[i][1] + batch_stages[i+1][1]) / 2
    ax.text(32, y, func, ha="left", va="center", color=WHITE_60, fontsize=9)

# ── Lot State Machine (right side) ──
ax.text(72, 82, "LOT LIFECYCLE", ha="center", va="center", color=GOLD,
        fontsize=13, fontweight="bold")

lot_stages = [
    (72, 65, "0\n(none)", SURFACE_LIGHT),
    (72, 50, "3\nMANUF.", OCEAN),
    (72, 35, "4\nWAREHOUSE", GOLD),
    (72, 20, "5\nDISTRIB.", GOLD),
]

for i, (x, y, text, color) in enumerate(lot_stages):
    circle = Circle((x, y), 5, facecolor=color, edgecolor=WHITE_40, linewidth=2, zorder=3)
    ax.add_patch(circle)
    ax.text(x, y, text, ha="center", va="center", color=WHITE if color != SURFACE_LIGHT else WHITE_40,
            fontsize=8, fontweight="bold", zorder=4)
    if i < len(lot_stages) - 1:
        ax.annotate("", xy=(x, y - 8), xytext=(x, lot_stages[i+1][1] + 8),
                    arrowprops=dict(arrowstyle="->", color=GOLD, lw=2, mutation_scale=12), zorder=2)

# Lot functions
lot_funcs = ["createProductLot()", "recordWarehouse()", "recordDistribution()"]
for i, func in enumerate(lot_funcs):
    y = (lot_stages[i][1] + lot_stages[i+1][1]) / 2
    ax.text(82, y, func, ha="left", va="center", color=WHITE_60, fontsize=9)

# Merge arrow (batch 3 → lot 3)
ax.annotate("", xy=(67, 50), xytext=(27, 20),
            arrowprops=dict(arrowstyle="->", color=WHITE_60, lw=2, mutation_scale=12,
                           connectionstyle="arc3,rad=0.2"), zorder=2)
ax.text(47, 38, "merge batches\nat stage 3", ha="center", va="center", color=WHITE_60,
        fontsize=9, style="italic", bbox=dict(boxstyle="round,pad=0.3", facecolor=SURFACE, edgecolor=WHITE_20))

# Guard conditions
ax.text(22, 8, "Guard: onlyFactorySigner\n  onlyStation", ha="center", va="center",
        color=WHITE_40, fontsize=8, family="monospace")
ax.text(72, 8, "Guard: onlyFactorySigner\n  onlyStation", ha="center", va="center",
        color=WHITE_40, fontsize=8, family="monospace")

save(fig, "02_state_machine")

# ═══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 3: Full System Architecture
# ═══════════════════════════════════════════════════════════════════════════════

fig, ax = setup_fig(16, 10)

ax.text(50, 96, "TORO System Architecture", ha="center", va="center", color=WHITE,
        fontsize=20, fontweight="bold")
ax.text(50, 91, "Zero-Trust Seafood Traceability — From Physical World to Blockchain to Consumer",
        ha="center", va="center", color=WHITE_60, fontsize=10)

layers = [
    ("LAYER 1\nPhysical World", 82, [
        "🎣 Catch / Farm", "📦 Port Receipt", "🏭 Processing", "❄️ Cold Storage", "🚢 Shipping"
    ], GREEN),
    ("LAYER 2\nHuman Oracle", 66, [
        "Factory Signer", "Authorized Station", "Media Upload (GPS + Timestamp)", "Rule Validation"
    ], OCEAN),
    ("LAYER 3\nSmart Contract", 48, [
        "ToroRegistry.sol", "State Machine (batchStage / lotStage)", "Role-based Access",
        "Events: BatchMinted, TraceRecorded, LotCreated"
    ], GOLD),
    ("LAYER 4\nIndexer", 30, [
        "eth_getLogs (chunked)", "Decode (codes, values)", "Deduplicate", "traceIndex.json"
    ], "#cb6ce6"),
    ("LAYER 5\nConsumer UI", 14, [
        "Next.js Static Export", "traceIndex.json at build time", "Zero RPC calls",
        "QR Scan → /trace/TORO-01"
    ], WHITE_60),
]

for title, y, items, color in layers:
    # Layer background
    bg = FancyBboxPatch((5, y-10), 90, 18, boxstyle="round,pad=0.02,rounding_size=1",
                        facecolor=SURFACE, edgecolor=color, linewidth=1.5, alpha=0.5, zorder=1)
    ax.add_patch(bg)
    
    # Layer title
    ax.text(10, y, title, ha="left", va="center", color=color, fontsize=11, fontweight="bold")
    
    # Items
    item_text = "  •  ".join(items)
    ax.text(10, y - 5, item_text, ha="left", va="center", color=WHITE_60, fontsize=8.5)
    
    # Down arrow between layers
    if y > 20:
        ax.annotate("", xy=(50, y - 12), xytext=(50, y - 2),
                    arrowprops=dict(arrowstyle="->", color=WHITE_20, lw=1.5, mutation_scale=10), zorder=2)

# Blockchain badge
badge = FancyBboxPatch((38, 42), 24, 8, boxstyle="round,pad=0.02,rounding_size=1",
                       facecolor=SURFACE, edgecolor=GOLD, linewidth=2, zorder=3)
ax.add_patch(badge)
ax.text(50, 46, "Arbitrum Sepolia", ha="center", va="center", color=GOLD,
        fontsize=10, fontweight="bold", zorder=4)

save(fig, "03_system_architecture")

# ═══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 4: Entity Relationship (Batch → Lot)
# ═══════════════════════════════════════════════════════════════════════════════

fig, ax = setup_fig(14, 9)

ax.text(50, 95, "Entity Relationship: Batches → Lot", ha="center", va="center", color=WHITE,
        fontsize=18, fontweight="bold")

# Batch 1
rounded_box(ax, 8, 55, 22, 28, SURFACE, "", radius=0.03)
bar1 = Rectangle((9, 78), 20, 3, facecolor=GREEN, alpha=0.8, zorder=3)
ax.add_patch(bar1)
ax.text(19, 72, "WILD-CATCH-001", ha="center", va="center", color=WHITE, fontsize=10, fontweight="bold")
ax.text(19, 66, "Bình Định", ha="center", va="center", color=WHITE_60, fontsize=9)
ax.text(19, 61, "800kg → 3900 cans", ha="center", va="center", color=WHITE_40, fontsize=8)
ax.text(19, 56, "Stage: 3 (Manuf.)", ha="center", va="center", color=OCEAN, fontsize=8, family="monospace")

# Batch 2
rounded_box(ax, 8, 18, 22, 28, SURFACE, "", radius=0.03)
bar2 = Rectangle((9, 41), 20, 3, facecolor=GREEN, alpha=0.8, zorder=3)
ax.add_patch(bar2)
ax.text(19, 35, "FARM-001", ha="center", va="center", color=WHITE, fontsize=10, fontweight="bold")
ax.text(19, 29, "Khánh Hòa", ha="center", va="center", color=WHITE_60, fontsize=9)
ax.text(19, 24, "2500kg → 4800 cans", ha="center", va="center", color=WHITE_40, fontsize=8)
ax.text(19, 19, "Stage: 3 (Manuf.)", ha="center", va="center", color=OCEAN, fontsize=8, family="monospace")

# Merge arrow
ax.annotate("", xy=(42, 52), xytext=(30, 68),
            arrowprops=dict(arrowstyle="->", color=WHITE_40, lw=2, mutation_scale=12,
                           connectionstyle="arc3,rad=-0.1"), zorder=2)
ax.annotate("", xy=(42, 48), xytext=(30, 32),
            arrowprops=dict(arrowstyle="->", color=WHITE_40, lw=2, mutation_scale=12,
                           connectionstyle="arc3,rad=0.1"), zorder=2)

# Merge function
merge_box = FancyBboxPatch((36, 46), 18, 8, boxstyle="round,pad=0.02,rounding_size=1",
                           facecolor=SURFACE, edgecolor=GOLD, linewidth=2, zorder=3)
ax.add_patch(merge_box)
ax.text(45, 50, "createProductLot()", ha="center", va="center", color=GOLD,
        fontsize=9, fontweight="bold", family="monospace")

# Lot
rounded_box(ax, 62, 35, 30, 38, SURFACE, "", radius=0.03)
bar3 = Rectangle((63, 69), 28, 3, facecolor=GOLD, alpha=0.8, zorder=3)
ax.add_patch(bar3)
ax.text(77, 63, "TORO-02", ha="center", va="center", color=WHITE, fontsize=14, fontweight="bold")
ax.text(77, 56, "Product: cá ngừ đóng hộp", ha="center", va="center", color=WHITE_60, fontsize=9)
ax.text(77, 50, "Total: 8800 cans", ha="center", va="center", color=WHITE_40, fontsize=9)
ax.text(77, 44, "Input Batches: 2", ha="center", va="center", color=WHITE_40, fontsize=9)
ax.text(77, 38, "Stage: 5 (Distributed)", ha="center", va="center", color=GOLD, fontsize=9, family="monospace")

# Arrow to consumer
ax.annotate("", xy=(95, 54), xytext=(92, 54),
            arrowprops=dict(arrowstyle="->", color=WHITE_40, lw=2, mutation_scale=12), zorder=2)
ax.text(97, 54, "📱\nConsumer\nQR Scan", ha="left", va="center", color=WHITE_60, fontsize=9)

# Events annotation
ax.text(50, 8, "Events emitted: BatchMinted + TraceRecorded (stages 1-3) → LotCreated + TraceRecorded (stages 3-5)",
        ha="center", va="center", color=WHITE_40, fontsize=9, family="monospace",
        bbox=dict(boxstyle="round,pad=0.4", facecolor=SURFACE, edgecolor=WHITE_20))

save(fig, "04_entity_relationship")

print("\nAll diagrams generated!")
