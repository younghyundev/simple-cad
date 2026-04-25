# Phase 7: Pattern Map

**Created:** 2026-04-26
**Status:** Complete

## Files to Modify

### `src/cad/clipboard.ts`

**Role:** New pure helper module for CAD copy/paste payloads.

**Closest analogs:**
- `src/cad/entityGeometry.ts` for pure geometry transforms.
- `src/cad/types.ts` for shared domain types.

**Pattern to follow:**
- Export small typed helpers.
- Avoid React imports.
- Keep functions deterministic and testable.

### `src/ui/App.tsx`

**Role:** Own app-level CAD clipboard state, context menu state, command handlers, and keyboard shortcuts.

**Closest analogs:**
- Existing `deleteSelectedEntity`, `saveAs`, and global keydown effect.
- Existing tab state persistence effect.

**Pattern to follow:**
- Use `useCallback` for command handlers.
- Use `updateDocument` for history-tracked document mutations.
- Use `fileMessage` for transient Korean status text.

### `src/ui/CadCanvas.tsx`

**Role:** Surface canvas context-menu events and reference-point clicks using the existing coordinate/snap path.

**Closest analogs:**
- Existing pointer down/move coordinate handling.
- Existing `snapMarker` rendering.

**Pattern to follow:**
- Keep coordinate conversion local to the canvas.
- Let parent app decide command meaning.
- Reference pick mode should short-circuit normal select/draw behavior.

### `src/styles.css`

**Role:** Add context menu CSS matching the current tool UI.

**Closest analogs:**
- `.tool-button`, `.mini-button`, `.selection-box`, `.canvas-text-input`.

**Pattern to follow:**
- 6px border radius.
- White surface, gray border, teal hover.
- Fixed dimensions to avoid layout shift.

## Data Flow

1. Selection in `App.tsx` -> copy command -> `CadClipboardPayload`.
2. Payload persists in app state while tabs switch.
3. Paste command -> helper clones entities with new IDs and layer fallback.
4. `updateDocument` inserts the entities into the active tab.
5. `setSelectedEntityIds` selects pasted IDs.
6. `useDocumentHistory` records the paste as one undo step.

## Plan Boundaries

- Plan 1 should be pure data helpers and minimal tests/build compatibility.
- Plan 2 should wire app commands, shortcuts, and context menu UI.
- Plan 3 should wire reference-point pick mode through `CadCanvas` and complete UAT.
