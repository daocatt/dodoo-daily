---
name: homepage-manager
description: Instructions for extending the Bento-style multi-screen homepage, adding pages, and registering new widgets.
---

# Homepage Management & Extension Skill

This skill provides the technical procedures for scaling the "DoDoo Daily" homepage architecture. Use this when you need to add more screens (Pages) or introduce new widget types.

## 1. Adding a New Page

The homepage architecture is designed to be horizontally scalable by simply adjusting the `pageCount` constant and updating the coordinate clamping.

### Steps:
1.  **Update `pageCount`**: In `src/app/page.tsx`, find `const pageCount` and increment it.
    ```typescript
    const pageCount = 3; // Increase as needed
    ```
2.  **Verify UI Elements**:
    *   The bottom Pagination Dots dynamically use `pageCount`.
    *   The Edit HUD Page Switcher dynamically use `pageCount`.
    *   The drag-and-drop boundary logic automatically scales using `gridCols * pageCount`.

---

## 2. Registering a New Widget

Adding a new widget involves updates in three areas: Type Definition, UI Interaction, and Content Rendering.

### Step A: API & Types
1.  **Define Type**: Add the new widget type string to the `HomeWidget` table in `src/lib/schema.ts` (commentary) and use it in the frontend.
2.  **Check Size Map**: If the new widget requires a unique grid span, update `SIZE_MAP` in `src/app/page.tsx`.

### Step B: Edit HUD
1.  **Add to Toolbar**: In `src/app/page.tsx`, find the widget list in the `isEditing` block and add your new type and icon.
    ```tsx
    { type: 'NEW_WIDGET', Icon: NewIcon }
    ```

### Step C: Content Rendering
1.  **Update `renderWidgetContent`**: Add a case to the switch statement in `renderWidgetContent`:
    ```tsx
    case 'NEW_WIDGET': 
      return <NewWidgetComponent size={w.size} cellSize={cellSize} />;
    ```
2.  **Icon Mode**: If the widget supports `ICON` size, add its color/icon configuration to the `ICON` block in `renderWidgetContent`.

---

## 3. Technical Constraints (Strict)

*   **Zero Scroll**: Never add components that would increase the height of the main container.
*   **Min Cell Size**: High-density pages may cause `cellSize` to shrink. Ensure widgets handle small dimensions (min 30px) gracefully via CSS scale or conditional rendering.
*   **Coordinate Integrity**: Always use `% gridCols` for local positioning and `Math.floor(x / gridCols)` for page identification.
