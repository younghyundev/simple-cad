# Phase 7: Cross-tab Reference Copy and Paste - Research

**Created:** 2026-04-26
**Status:** Complete

## Research Question

What needs to be known to plan cross-tab copy/paste, right-click menu commands, and reference-point placement in the current Web CAD codebase?

## Current Architecture Findings

### Editing State

- `src/ui/App.tsx` owns active document state, tab state, selected entity IDs, global keyboard shortcuts, and `fileMessage`.
- `useDocumentHistory` now supports tab-specific history snapshots, so paste operations must call `updateDocument` once per paste to create a single undo step.
- `selectedEntityIds` already supports multi-selection and is synced into the active tab.
- The CAD canvas receives `onDocumentChange`, `onDocumentBatchStart`, `onDocumentBatchCommit`, and `onSelectedEntityChange` callbacks.

### Geometry Utilities

- `src/cad/entityGeometry.ts` already contains `translateEntity(entity, delta)`, which handles line, rect, circle, arc, polyline, text, and dimension geometry.
- There is no clone helper yet. Pasted entities need a new helper that:
  - deep-copies geometry arrays and nested points,
  - assigns a unique ID,
  - remaps invalid layer IDs to the destination default layer,
  - applies a translation delta using `translateEntity`.

### Canvas Pointer Flow

- `src/ui/CadCanvas.tsx` converts pointer coordinates with `screenToWorld`.
- `resolveWorldPoint` wraps `snapPoint` and already returns endpoint, center, intersection, grid, or none.
- Snap markers are already rendered by `snapMarker`.
- Adding reference-point picking should reuse this pointer path rather than duplicating coordinate logic in `App.tsx`.

### UI and Styling

- `src/styles.css` uses Inter, white panels, light gray borders, `#0f766e` accent, and 6px radii.
- Existing interactive elements are simple CSS buttons, not a component library.
- `lucide-react` is already used in `App.tsx`; new context menu icons should come from the same library.

## Recommended Implementation Shape

1. Add pure CAD clipboard helpers under `src/cad/clipboard.ts`.
2. Keep the clipboard state in `App.tsx`, because it must survive tab switches but not refreshes.
3. Extend `CadCanvas` with event callbacks for:
   - context menu opening with screen/world point,
   - reference point picking with snapped world point,
   - Escape cancellation handled through the app-level mode.
4. Add context menu rendering in `App.tsx` or a small local component, with CSS in `src/styles.css`.
5. Add Ctrl/Cmd+C and Ctrl/Cmd+V to the existing global keydown handler, preserving input guards.
6. Add focused verification around:
   - layer fallback,
   - new IDs,
   - tab-to-tab paste,
   - undo/redo,
   - text input keyboard safety,
   - reference delta translation.

## Risks and Constraints

- `CadEntity` is a discriminated union with nested point arrays for polylines and dimensions; shallow cloning risks shared point references.
- Context menu screen coordinates need to be clamped to the canvas/workspace bounds to avoid offscreen menus.
- `CadCanvas` currently starts select/move behavior on pointer down; reference picking must take priority over normal tool behavior while active.
- Existing inline text input must keep native copy/paste behavior.
- `snapPoint` can be expensive on very dense drawings; reference picking uses the same existing snap path, so it inherits current performance caps.

## Validation Architecture

- Unit-test or utility-test clone/translate behavior where the test setup exists; otherwise use TypeScript/build verification and targeted manual checks.
- Build verification: `npm run build`.
- Manual UAT:
  1. Create two tabs.
  2. Select multiple entities in tab A.
  3. Copy via Ctrl/Cmd+C.
  4. Paste in tab B and confirm new IDs, preserved styles, and destination layer fallback.
  5. Undo in tab B and confirm tab A is unchanged.
  6. Use right-click menu copy/paste.
  7. Use reference copy with a snapped endpoint and reference paste to another snapped point.
  8. Edit a text entity and confirm Ctrl/Cmd+C/V still edits text, not CAD clipboard.

## Research Complete

Planning can proceed with three implementation plans: clipboard core, context menu/shortcuts, and reference-point canvas integration.
