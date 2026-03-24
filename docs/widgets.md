# Widget System: Hot-Pluggable Architecture

Our dashboard uses a "System Baustein" (Modular System) design, where the interface is composed of independent, interactive widgets. This document outlines the existing widgets and our vision for a decoupled, hot-pluggable architecture.

---

## 1. Existing Widgets List

Below is the list of current functional modules available as Bento widgets:

| Widget ID | Label | Purpose | Key Data |
| :--- | :--- | :--- | :--- |
| `TASKS` | Tasks (任务) | Personalized task management & P2P delegation | `db.task` |
| `NOTES` | Pinned (便签) | Shared family notes and quick captures | `db.note` |
| `JOURNAL` | Journal (日志) | Daily logs, growth recordings, and memories | `db.journal` |
| `PHOTOS` | Gallery (画廊) | Artwork exhibition and visitor submissions | `db.artwork` |
| `SHOP` | Shop (商城) | Family-internal star/coin store | `db.shopItem` |
| `MILESTONE` | Milestone (大事记) | Highlighted achievements and life events | `db.journal` |
| `LEDGER` | Ledger (账本) | Family financial tracking and transfers | `db.ledgerRecord` |
| `STORAGE` | Storage (物资) | Shared inventory and item tracking | `db.inventory` |
| `PROFILE` | Profile (个人) | Personal stats and balance overview | `db.accountStats` |

---

## 2. Technical Blueprint: Hot-Pluggable Mechanism

To achieve a truly industrial, robust architecture, we are moving away from hardcoded switch statements in the `Home` page toward a **Widget Registry** system.

### 2.1 The Concept
Widgets should be "Plug-and-Play". Adding a new feature (like a "Habit Tracker" or "Weather") should only require creating a single component and registering it with the system, without touching the core grid logic.

### 2.2 Shared Interface (`WidgetProps`)
Every widget must adhere to a standard interface to ensure the Bento container can interact with it safely:

```typescript
interface WidgetProps {
  id: string;        // Unique instance ID
  size: WidgetSize;  // Current span (e.g., 'SQUARE', 'WIDE')
  cellSize: number;  // Current pixel size of a 1x1 unit (for scaling)
  isEditing: boolean; // Whether the dashboard is in edit mode
}
```

### 2.3 The Widget Registry
We will implement a `WidgetRegistry` that maps a type ID (e.g., `TASKS`) to its component and configuration:

```typescript
const WIDGET_REGISTRY = {
  TASKS: {
    component: LazyTasksWidget,
    config: {
      defaultSize: 'WIDE',
      supportedSizes: ['ICON', 'SQUARE', 'WIDE', 'TALL'],
      icon: SquareCheckBig,
      accentColor: 'indigo',
    }
  },
  // ... other widgets
}
```

### 2.4 Directory-Based Structure
For complex widgets, we recommend splitting the logic by size into a dedicated directory. This prevents monolithic files and improves maintainability:

```text
src/components/widgets/Tasks/
  ├── index.tsx         // Main entry / size switcher
  ├── size_icon.tsx     // 1x1 variant (badge)
  ├── size_square.tsx   // 2x2 variant (minimal list)
  ├── size_wide.tsx     // 4x2 variant (interative list)
  ├── size_giant.tsx    // 8x4 variant (full dashboard)
  └── types.ts          // Shared interfaces
```

---

## 3. Decoupling from Bento Container

The core goal is to separate **Layout Orchestration** from **Feature Execution**.

### 3.1 Responsibilities of the Bento Container
1.  **Persistence**: Loading and saving widget positions (`x`, `y`) and `size` to the database.
2.  **Layout Logic**: Handling grid math, collision detection, and drag-and-drop.
3.  **Frame Rendering**: Wrapping widgets in a standard "Hardware Frame" (`BausteinWidgetContainer`) that provides standard UI elements (Close button, Resize handles).
4.  **Scaling**: Passing down `cellSize` so internal widget content can respond to screen size changes.

### 3.2 Responsibilities of the Widget
1.  **Data Isolation**: Widgets fetch their own data via dedicated API routes.
2.  **Internal UX**: Handling their own local state (e.g., Tab switching within a Tasks widget).
3.  **Density Awareness**: Rendering different levels of detail based on the `size` prop. For example:
    - `ICON`: Just a counter badge.
    - `SQUARE`: A list of top 3 items.
    - `WIDE`: A full-featured interactive interface.

---

## 4. Implementation Workflow for New Widgets

To add a new widget `FUTURE_FEATURE`:
1.  **Create Component**: `src/components/widgets/FutureWidget.tsx`.
2.  **Define Styles**: Add specific "Industrial" styling following the System Baustein tokens.
3.  **Register**: Add to central `WIDGET_REGISTRY`.
4.  **Activate**: The "Add Widget" HUD will automatically detect the new entry and offer it to the user.

> [!TIP]
> This decoupling allows us to "lazy load" widgets. Only the code for the widgets currently on the user's dashboard is downloaded, significantly improving initial boot performance.
