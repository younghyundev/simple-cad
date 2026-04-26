# Phase 9: Transform Productivity Tools - Patterns

**Created:** 2026-04-26

## Existing Patterns to Preserve

- `CadDocument` is the source of truth.
- `updateDocument` owns history for command-style changes.
- Drag/resize uses `beginHistoryBatch` and `commitHistoryBatch`.
- Canvas input state lives in `CadCanvas.tsx`; command state lives in `App.tsx`.
- Geometry logic belongs under `src/cad/`, not inside UI components.
- UI text is Korean.
- Right panel uses compact `panel-section`, `property-list`, `mini-button`, and dense grid styles.

## New Patterns for Phase 9

### Shared Geometry Helpers

Create or extend a pure helper module for entity bounds and transforms. Use it from:

- `render.ts`
- `CadCanvas.tsx`
- `snap.ts`
- `clipboard.ts`
- `exportService.ts`
- `App.tsx` transform commands

### Recursive Entity Handling

Group handling must be recursive but shallow UX-wise:

- Rendering: draw children.
- Hit testing: any child hit means the group is hit.
- Movement: translate children.
- Rotation: rotate children around the chosen pivot.
- Export: flatten group children.
- Clipboard: clone group children deeply.
- Snap: include child snap candidates and segments.

### Command Helpers

Keep group, ungroup, align, and rotate operations as pure helpers where possible. `App.tsx` should mostly call helpers and set selection/status messages.

### Safety

- Ignore locked entities and locked layers consistently with existing selection behavior.
- Do not mutate entity objects in place.
- Preserve ids of existing entities unless a group/ungroup operation intentionally creates a new top-level wrapper.

## Likely Files

- `src/cad/types.ts`
- `src/cad/entityGeometry.ts`
- `src/cad/entityTransform.ts`
- `src/cad/render.ts`
- `src/cad/snap.ts`
- `src/cad/clipboard.ts`
- `src/cad/io/exportService.ts`
- `src/cad/io/dxfRoundTrip.ts`
- `src/ui/App.tsx`
- `src/ui/CadCanvas.tsx`
- `src/styles.css`

## Verification Pattern

After every plan:

- `npm run build`
- If export/import code changed: `npm run test:cad-fidelity`

For UI plans:

- Start Vite dev server and manually smoke-test the commands in the browser when feasible.
