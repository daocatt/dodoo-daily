# HUD Widget Iconography & Color Configuration

This document defines the standard dual-tone iconography and color palette for the "System Baustein" HUD widgets in DoDoo Daily, as of the 2026 Industrial UI Refinement.

## 1. Widget Icon Specifications

All 2x2 widget header icons follow a **"Deep Edge, Light Fill"** dual-tone aesthetic using **Lucide v1** (next) standards with a unified `strokeWidth: 2.2`.

| Widget Type | Display Name | Lucide Icon | Edge Color (Stroke) | Fill Color (Fill) | Design Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TASKS** | Tasks | `SquareCheckBig` | `#6ea1ff` (Blue-500) | `#c6daff` (Blue-100) | Cloud Blue feel |
| **NOTES** | Pinned | `StickyNote` | `#f8b15e` (Amber-600) | `#ffe4a0` (Amber-200) | Warm Amber feel |
| **JOURNAL** | Journal | `JournalIconFixed` | `#ff2442` (Rose-600) | `#fff1f2` (Rose-50) | XHS Red style (Custom Star fix) |
| **MILESTONE** | Milestones | `CircleStar` | `#be123c` (Rose-700) | `#ffe4e6` (Rose-100) | Emotional Milestone Rose |
| **LEDGER** | Ledger | `WalletCards` | `#8a94ff` (Indigo-500) | `#ced3ff` (Indigo-100) | Using `WalletCards` for solid fill |
| **PHOTOS** | Gallery | `Fan` | `#7e22ce` (Purple-700) | `#f3e8ff` (Purple-100) | Creative Lavender Purple |
| **STORAGE** | Storage | `Refrigerator` | `#10b981` (Emerald-500) | `#d1fae5` (Emerald-100) | Fresh Minty Green |
| **SHOP** | Shop | `ShoppingBag` | `currentColor` | `none` | Standard stroke-only |

## 2. Design Guidelines (v1 Industrial Standard)

1. **Dual-Tone Rendering**: 
   - Icons MUST use a deeper stroke color (`-600` or `-700` level) and a very light fill color (`-100` or `-50` level).
   - This creates a **Tactile Button / Physical Indicator** look rather than a flat vector.
2. **Path Closure (v1 Filling Bug)**:
   - For icons with overlapping open paths (e.g., `Wallet`), use "Minimal" or "Cards" variants with `rect` primitives to ensure gap-free filling.
   - For `SquareStar`, use the custom `JournalIconFixed` component to ensure the star is drawn on top of the background square.
3. **Stroke Precision**:
   - Unified `strokeWidth: 2.2` for all dual-tone icons to maintain industrial-grade legibility at small sizes.
4. **Hardware Well Integration**:
   - Header icons are nested within a `hardware-well-thin` or `rounded-xl` container with background/text-color derive from the widget's `accentColor`.

---
*Last Updated: 2026-03-24 - System Baustein UI Overhaul Phase 2*
