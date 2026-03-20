# DoDoo Daily — Modular Design System "System Baustein"
>
> Version 3.0 · March 2026  
> Theme: Industrial Precision (Vintage Putty)
> Style: Tactile hardware inspired by Dieter Rams and early Braun electronics.

---

## 1. Visual Manifesto: "Modular Tactility"

The **System Baustein** language treats the UI as a physical machine. Elements are not just pixels; they are **castings**, **well-slots**, and **actuators**.

### Key Primitives
-   **Panel (Casing)**: The main container (`.baustein-panel`). A heavy, rounded casing with subtle outer shadows and high-contrast inner highlights.
-   **Well (Recessed Slot)**: A "hole" cut into the panel (`.hardware-well`). Uses deep inset shadows (`--shadow-well`) to represent physical depth.
-   **Cap (Actuator/Button)**: The movable part sitting inside a well (`.hardware-cap`). It should have a 3D thickness (`--shadow-cap`) and respond to physical "travel" on click.

---

## 2. Design Tokens (v3.0)

### Colors: "Vintage Putty" Palette
| Token | Hex | Usage |
|---|---|---|
| `--surface-base` | `#D1CDBC` | Global desktop background (Industrial Grey-Beige) |
| `--surface-warm` | `#E6E2D1` | Main panel / machine casing |
| `--surface-white`| `#F4F4F2` | Primary button caps / Highlight segments |
| `--well-bg` | `#D9D5C4` | Bottom of recessed slots |
| `--text-primary`| `#1A1A1A` | Functional labels and active text |
| `--accent-moss` | `#00853E` | Success / OK status |
| `--warm-amber`  | `#F2A900` | Warning / Active signal |

### Typography
-   **Brand/UI**: `Inter` (sans-serif) for high readability.
-   **Technical**: `JetBrains Mono` or any clean Monospace for status, versions, and "Entry Point" labels.

---

## 3. Structural Rules & Spacing

To maintain "Industrial Density" while preventing clutter (Zero Scroll):

-   **Global Padding**: `p-4 md:p-8` for the main canvas.
-   **Header Height**: Compact `pt-6 pb-4` with 12px panel rounding.
-   **The 8px "Hardware Gap"**: Standard buttons should have an `inset-2` (8px) gap between the cap and the well walls to show architectural depth.
-   **Standard Button Height**: `h-20` (80px) provides a generous touch target that looks proportional to large panels.

---

## 4. UI Patterns for All Modules

### 1. Header (Panel Identification)
-   Top-left: System Title (Bold, Black) + Version (Mono).
-   Top-right: Model ID (e.g., `Do-19 DAILY MODULE`) in a pill container.

### 2. Main Layout (Visual + Controls)
-   Split layout: Left side for **integrated screen** (visual/image), right side for **controls**.
-   Between sections: A 2px "Groove" (`.hardware-groove`).

### 3. Technical Micro-details (Status)
-   Use `Disc` icons with `animate-spin-slow` in rounded-full `hardware-well` slots for "System Active" indicators.
-   Use uppercase monospaced labels for everything technical.

---

## 5. Interaction Model

-   **Hover**: Increase background brightness/clarity.
-   **Active (Click)**: `transform: translateY(2px)` + inset shadow change to simulate mechanical switch travel.

---

## 6. Implementation Reference (CSS)
```css
.hardware-well {
  background: var(--well-bg);
  box-shadow: var(--shadow-well);
  position: relative;
}

.hardware-cap {
  box-shadow: var(--shadow-cap);
  transition: all 0.08s cubic-bezier(0.25, 1, 0.5, 1);
}

.hardware-btn:active .hardware-cap {
  transform: translateY(2px);
}
```
