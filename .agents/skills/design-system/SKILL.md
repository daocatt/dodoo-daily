# Design System Skill: System Baustein (v3.0)

This skill defines the interaction and visual standards for the "System Baustein" (Modular Industrial) design language. It focuses on tactile, hardware-inspired UI elements, precise typography, and a modular layout system with a "Vintage Putty" aesthetic.

## 1. Core Principles

## 2. Visual Tokens

### Colors (Theme: Default / Baustein)
| Variable | Value | Description |
|---|---|---|
| `--theme-bg` | `#C8C9C4` | Global page background |
| `--theme-surface` | `#E3E4DF` | Component casing / card background |
| `--theme-text` | `#1A1A1A` | Primary body text |
| `--theme-text-muted` | `#555555` | Secondary/meta text |
| `--theme-text-label` | `#6A6B66` | Technical labels (Mono) |
| `--theme-accent-red` | `#D03027` | Primary action / Critical |
| `--theme-accent-blue` | `#0055A4` | Info / Nav |
| `--theme-accent-yellow`| `#F2A900` | Warning / Highlights |
| `--theme-accent-green` | `#00853E` | Success / Active |

### Typography
- **Primary Sans**: `Inter` (Font metrics: `font-sans`)
- **Precise Mono**: `JetBrains Mono` (Font metrics: `font-mono`)
- **Heading Rule**: Use `font-black` and `tracking-tight` for display titles.
- **Label Rule**: Use `font-mono`, `text-[10px]`, `font-bold`, `uppercase`, `tracking-widest`.

### Geometry & Elevation
- **Card Radius**: `12px` (`rounded-xl`)
- **Button Radius**: `50%` (`rounded-full`) for hardware toggles; `3px` for smaller action buttons.
- **Tactile Shadows**:
  - `shadow-hardware`: Outer shadow with depth.
  - `shadow-well`: Inset shadow for sunken elements.
  - `shadow-cap`: Raised shadow for physical caps.

## 3. Component Implementation Rules

### Hardware Buttons (Toggle)
Always implement as a "Well" and a "Cap":
```tsx
<button className="hardware-btn active:translate-y-1 transition-all">
  <div className="btn-well bg-[#DADBD4] shadow-well rounded-full p-1">
    <div className="btn-cap bg-theme-accent shadow-cap rounded-full w-full h-full" />
  </div>
</button>
```

### Modular Dividers
Instead of a simple line, use the "Groove" pattern:
```tsx
<div className="h-0.5 w-full bg-black/15 border-b border-white/80" />
```

### Data Grids
- Use `font-mono` for all numeric and ID data.
- Headers should be microscopic but bold and uppercase.

## 4. Interaction Patterns
- **Button Press**: Active state must shift the element down (translate-y) to simulate physical travel.
- **Panel Hover**: Use subtle brightness shifts or inner glow, not just shadow changes.
- **Transitions**: Keep it snappy (`0.1s - 0.2s`) to feel like mechanical hardware.
