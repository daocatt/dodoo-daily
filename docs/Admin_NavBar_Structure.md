# Admin NavBar Architecture (System Baustein 3.0)

This document defines the modular structure and display logic for the `BausteinAdminNavbar`, ensuring a consistent, high-density industrial design across all administrative modules.

## 1. Core Components

The Navbar is divided into four functional modules, each encapsulated as a sub-component:

### 1.1 `LogoSubtitle`
*   **Role**: Brand identification and system status.
*   **Contents**: 
    *   Tactile Logo Button (Link to `/admin`).
    *   System Name (Uppercase).
    *   Node Status (NOMINAL/DEGRADED) + Heartbeat.
    *   System Version (from `version.json`).
*   **Visibility**: Always visible.

### 1.2 `HUD (Heads-Up Display)`
*   **Role**: Global telemetry and mode switching.
*   **Contents**:
    *   **Mode Toggle**: Quick switch between `Dashboard (/admin)` and `Console (/admin/console)`.
    *   **View Selectors**: (Optional) Quick jump to primary modules.
*   **Visibility Rules**:
    *   Only visible on `/admin` and `/admin/console` (entry-level pages).
    *   Mutual exclusivity: Hidden if the `BackButton` is active.
    *   Role-based: Content varies for `SUPERADMIN` vs `ADMIN`.

### 1.3 `BackButton`
*   **Role**: Contextual breadcrumb navigation.
*   **Contents**: 
    *   Tactile `ChevronLeft` button with "Back" behavior.
*   **Visibility Rules**:
    *   Visible on sub-module pages (e.g., `/admin/tasks`, `/admin/gallery`, or nested routes).
    *   Mutual exclusivity: Hidden if the `HUD` is active.
    *   Always returns to the "parent" level (e.g., sub-task -> task list -> dashboard).

### 1.4 `RightMenu`
*   **Role**: Contextual actions and user/global controls.
*   **Contents**:
    *   **Contextual Actions**: Module-specific buttons (e.g., "Add Task" when in Tasks).
    *   **Widget Toggle**: Grid adjustment tool.
    *   **User Capsule**: Avatar, Nickname, and Permission Role.
    *   **Global Toggles**: Language Switcher (Mechanical Slide).
    *   **Security**: Power/Logout button.
*   **Visibility**: Always visible, but internal actions change based on `pathname`.

## 2. Display Logic Matrix

| Page Context | LogoSubtitle | HUD | BackButton | RightMenu Actions |
| :--- | :---: | :---: | :---: | :--- |
| `/admin` | ✅ | ✅ | ❌ | Dashboard HUD Controls |
| `/admin/console` | ✅ | ✅ | ❌ | Console Settings Actions |
| `/admin/tasks/*` | ✅ | ❌ | ✅ | Task Management Actions |
| `/admin/(sub-modules)`| ✅ | ❌ | ✅ | Module-specific Actions |

## 3. Implementation Plan

1.  **Modularization**: Extraction of `LogoSubtitle`, `HUDCapsule`, and `RightActions` into `src/components/navbar/` sub-components.
2.  **Context Injection**: The `RightMenu` will accept a `slot` or high-order component pattern to render module-specific actions based on the current `pathname`.
3.  **Permission Guarding**: Centralize the `Stats` fetch and pass filtered data to sub-components based on user role.
