# DoDoo Daily — Design System & Visual Guidelines
>
> Version 1.0 · March 2026  
> A family app for both parents and children. Always balance child-friendliness with parental utility.

---

## 1. Design Philosophy

DoDoo Daily is a **family-first app** used by both children (primary users) and parents (administrators). The design must:

- Feel **warm, safe, and joyful** to children without being patronizing.
- Feel **clear, efficient, and trustworthy** to parents in management views.
- Maintain a **nature-inspired** palette — organic, soft, earthy tones.
- Prioritize **legibility** over decoration.

---

## 2. Color Palette

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#2c2416` | Body text, headings |
| `--text-secondary` | `#6b5c45` | Secondary labels |
| `--text-muted` | `#a89880` | Placeholder, disabled |
| `--surface-base` | `#f5f0e8` | Page background |
| `--surface-warm` | `#faf7f0` | Card background |
| `--border-subtle` | `#d6cdc0` | Borders, dividers |
| `--accent-moss` | `#5a7a5a` | CTA green |
| `--accent-forest` | `#3d5c3d` | CTA hover |
| `--warm-amber` | `#c8843c` | Highlights, coins |
| `--danger-terra` | `#c0503c` | Destructive actions |

### Section Accent Colors

Each app section has an assigned accent color to aid navigation recognition:

| Section | Color | Tailwind Class | Usage |
|---|---|---|---|
| Tasks | `#43aa8b` | `text-[#43aa8b]` / `bg-[#43aa8b]/10` | Emerald green |
| Emotions | `#f8961e` | `text-[#f8961e]` / `bg-[#f8961e]/10` | Orange |
| Gallery | `#f9c74f` | `text-[#f9c74f]` / `bg-[#f9c74f]/10` | Yellow |
| Journal | `#277da1` | `text-[#277da1]` / `bg-[#277da1]/10` | Blue |
| Shop | `#907a67` | `text-[#907a67]` / `bg-[#907a67]/10` | Brown |

> **Rule:** Never mix section accent colors. Always apply a section's color consistently to its icon, header, and interactive elements.

---

## 3. Border Radius — The Core Rule

### General Principle
>
> **Use small, consistent border radii.** Avoid large rounded corners (e.g., `rounded-3xl`, `rounded-[3rem]`) on interactive form elements, cards, and buttons. Reserve sharp-to-medium radius for a modern, readable layout.

### Radius Scale

| Token | Value | Usage |
|---|---|---|
| `rounded-md` | 6px | Small UI elements: icon containers in menus, chips |
| `rounded-lg` | 8px | Standard buttons, input fields, select boxes, small cards |
| `rounded-xl` | 12px | Modal form inputs, panel cards |
| `rounded-2xl` | 16px | Modals, sheet panels, artwork cards |
| `rounded-3xl` | 24px | Large feature cards (homepage left panel cards) |
| `rounded-full` | 50% | Pill badges, tags, avatar circles ONLY |

### Exceptions (large radius OK)

- **Artwork display cards** (homepage stack): `rounded-[2rem]` — intentional skeuomorphic feel.
- **Nature background elements**: free to use organic curves.

---

## 4. Avatar & Profile Image Guidelines

Avatars appear in two main contexts: **list/overview** and **focused/detail**. Follow these rules consistently:

### ✅ Use Circular Avatar (`rounded-full`)

- **Navigation headers** — small avatar in top-right of Home/Parent pages (≤ 40px)
- **Profile selector** on Login page (for the identity selection grid)
- **Comment/author attribution** in journal feeds

### ✅ Use Rounded Square Avatar (`rounded-xl` or `rounded-2xl`)

- **Profile page settings** — the avatar you are editing (large, 80–96px)
- **Child management cards** in Parent dashboard
- **Journal entry author avatar** within the detail post

### Border Width Rules

| Context | Border Style |
|---|---|
| Navigation avatar (small, circular) | `border-2 border-white shadow-sm` |
| Login identity card avatar | `border-2 border-[accent-color]` (role-coded) |
| Profile edit avatar | `border-4 border-white shadow-lg` (large, prominent) |
| Journal feed author | `border-2 border-white shadow-sm` |

> **Rule:** Never apply a thick border (`border-4`) to small or inline avatars. Reserve thick borders for large, prominent avatar displays only.

---

## 5. Typography

### Font Stack

```
'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif
```

- **Inter**: Latin characters, clean geometric sans-serif, excellent for UI.
- **Noto Sans SC**: Simplified Chinese fallback, harmonizes well with Inter.

### Size Scale

| Usage | Class | Size |
|---|---|---|
| Page title (h1) | `text-3xl font-black` | 30px, child-facing pages |
| Page title (h1) | `text-2xl font-black` | 24px, parent-facing management |
| Section heading (h2) | `text-xl font-black` | 20px |
| Card title (h3) | `text-lg font-bold` | 18px |
| Body / description | `text-sm font-medium` | 14px |
| Label / meta | `text-xs font-bold` | 12px |
| Micro label (uppercase) | `text-[9px] md:text-[10px] font-black uppercase tracking-widest` | 9–10px |

### Font Weight Philosophy

- **`font-black` (900)**: Reserved for page titles, section headings, primary labels. Creates strong visual hierarchy.
- **`font-bold` (700)**: Card titles, button text, important body content.
- **`font-medium` (500)**: Secondary text, descriptions, regular body.
- Avoid `font-normal` or `font-light` — insufficient contrast for this age group.

### Child-Facing vs. Parent-Facing Typography

| View | Guideline |
|---|---|
| Child-facing (Home, Tasks, Shop, Gallery) | Larger type, higher contrast, more expressive |
| Parent-facing (Parent Dashboard, Modals) | Compact type, tighter spacing, efficiency-first |

---

## 6. Spacing

### Component Internal Spacing

| Component | Padding |
|---|---|
| Page content area | `p-4 md:p-12` |
| Card (standard) | `p-5` or `p-6` |
| Modal inner | `p-6 md:p-10` |
| Form field label → input gap | `space-y-1.5` |
| Form section gaps | `space-y-5` |
| Button height (standard) | `h-11` (44px) |
| Button height (large CTA) | `h-12` (48px) |

---

## 7. Buttons

### Primary Action Button

```tsx
<button className="h-12 px-6 bg-[#43aa8b] text-white rounded-lg font-bold text-sm
                   hover:bg-[#328a6f] active:scale-95 transition-all shadow-md">
  Confirm
</button>
```

### Secondary / Cancel Button

```tsx
<button className="h-12 px-6 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm
                   hover:bg-slate-200 transition-all">
  Cancel
</button>
```

### Icon Button (small, square)

```tsx
<button className="w-10 h-10 flex items-center justify-center rounded-md
                   bg-slate-50 border border-slate-200 text-slate-400
                   hover:text-slate-700 transition-all">
  <Edit2 className="w-5 h-5" />
</button>
```

### Pill/Tags (badge-style, no radius change)

```tsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-[#43aa8b]/10 text-[#43aa8b]">
  Badge
</span>
```

> **Rule:** The only place `rounded-full` is allowed on a button is for a pill/tag badge or a circular icon button. Regular rectangular buttons always use `rounded-lg`.

---

## 8. Form Controls

### Text Input

```tsx
<input
  className="w-full h-11 px-5 bg-slate-50 rounded-lg border border-slate-200
             focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100
             outline-none font-bold text-slate-800 transition-all text-sm"
/>
```

### Select

```tsx
<select
  className="w-full h-11 px-5 bg-slate-50 rounded-lg border border-slate-200
             focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100
             outline-none font-bold text-slate-800 transition-all appearance-none text-sm"
/>
```

### Textarea

```tsx
<textarea
  className="w-full h-24 p-5 bg-slate-50 rounded-xl border border-slate-200
             focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100
             outline-none font-bold text-slate-800 transition-all resize-none text-sm"
/>
```

### Label Style

```tsx
<label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
  Field Label
</label>
```

> **Key rule:** All inputs always have a visible `border border-slate-200`. Never use `border-none` on inputs in forms — visibility of form field boundaries is required. Focus state always uses yellow ring for consistency.

---

## 9. Cards

### Standard Card

- Background: `bg-white`
- Radius: `rounded-xl` (12px) for parent-facing; `rounded-2xl` (16px) for child-facing
- Border: `border border-slate-100` — always present, never absent
- Shadow: `shadow-sm`; `hover:shadow-xl` on interactive cards

### Feature / Hero Card (child-facing)

- Background: themed `bg-[color]`
- Radius: `rounded-2xl`
- Border: `border-2 border-white/40`
- Shadow: `shadow-lg`

---

## 10. Modals

### Structure

- Max width: `max-w-xl`
- Max height: `max-h-[90dvh]` with internal `overflow-y-auto`
- Radius: `rounded-2xl`
- Backdrop: `bg-slate-900/60 backdrop-blur-md`
- Animation: `scale(0.95) + opacity 0 → 1`

### Internal padding: `p-6 md:p-10`

---

## 11. Elevation & Shadows

| Level | Class | Use |
|---|---|---|
| 0 — Flat | _(none)_ | Disabled, background elements |
| 1 — Subtle | `shadow-sm` | Cards at rest |
| 2 — Resting | `shadow-md` | Primary buttons, inputs on focus |
| 3 — Raised | `shadow-xl` | Cards on hover, active modals |
| 4 — Overlay | `shadow-2xl` | Modals, dropdowns over content |

---

## 12. Animation Guidelines

| Type | Duration | Easing | Trigger |
|---|---|---|---|
| Page enter | 300–400ms | `ease-out` | Mount |
| Button press | 100ms | `ease-in-out` | `active:scale-95` |
| Modal open | 200ms | `ease-out` | AnimatePresence |
| List stagger | 80–100ms per item | `ease-out` | Mount |
| Hover translate | 200–300ms | `ease-in-out` | Hover |

> **Rule:** Keep animations subtle and purposeful. Children's views can be slightly more expressive (spring physics, larger scale shifts). Parent management views should remain clean and quick.

---

## 13. Homepage Menu Buttons

The right-side section navigation is styled as **colored pill rows**:

```tsx
// Each item uses its section's bg color as the button background
className={`flex items-center justify-between p-3 md:p-4 rounded-lg w-full
            border border-white/20 ${item.bg} hover:brightness-95 hover:shadow-lg
            transition-all`}
```

- Icon container: `w-10 h-10 rounded-md bg-white/30` (small, frosted)
- Text: `text-lg md:text-xl font-black text-[#2c2416]`

---

## 14. Checklist — Before Shipping a New Component

- [ ] Border radius follows scale (no arbitrary large radii on form elements)
- [ ] Avatar shape rule applied (round = nav/list, rounded-square = profile/edit)
- [ ] All inputs have `border border-slate-200` and yellow focus ring
- [ ] Labels use `slate-600` or darker, `font-black`, `uppercase`, `tracking-widest`
- [ ] Buttons use `rounded-lg` (not `rounded-2xl` or larger)
- [ ] Parent-facing components use compact spacing (`space-y-5`, `h-11` buttons)
- [ ] Child-facing text is at minimum `text-base` (16px) for readability
- [ ] Animation timing does not exceed 400ms
- [ ] Colors reference the section's assigned accent, not generic Tailwind colors
