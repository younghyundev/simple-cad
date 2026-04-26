# Phase 9: Transform Productivity Tools - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** Roadmap + current codebase scan

<domain>
## Phase Boundary

Phase 9 adds editing productivity tools to the existing 2D canvas editor:

- group / ungroup selected objects
- rotate selected objects or groups around a predictable pivot
- align selected objects to left/right/top/bottom/center/middle
- preserve undo/redo behavior for those operations
- keep selection, hit testing, snapping, rendering, copy/paste, and file IO predictable after grouping and rotation

This phase does not add nested group editing, advanced transform handles, scale/skew, constraints, or parametric CAD behavior.

</domain>

<decisions>
## Implementation Decisions

### Group Model
- Add a first-class group entity or group wrapper to the SimpleCAD model instead of only tagging entities with a group id.
- Grouping should preserve member entity properties and allow ungrouping back into normal editable entities.
- Keep one-level grouping for this phase. If a selected entity is already grouped, the implementation may either block nested grouping or flatten consistently.
- Existing file import/export should not break. JSON should preserve groups. DXF/SVG export can flatten groups to member entities.

### Rotation
- Rotation should work on a single entity, multiple selected entities, and group entities.
- Rotation pivot should default to the selected bounds center.
- Rotation should be represented in geometry, hit testing, rendering, and snapping. Do not only store a visual angle that tools ignore.
- A compact numeric rotation control in the right panel is acceptable for this phase. A dedicated canvas rotation handle can be deferred unless straightforward.

### Alignment
- Alignment commands should operate on two or more selected top-level editable entities.
- Provide left, horizontal center, right, top, vertical center, and bottom alignment.
- Alignment should move each entity as a whole and commit one undo history entry.

### Undo/Redo and Selection
- Group, ungroup, rotate, and align must use existing `updateDocument` history semantics.
- Canvas drag and resize behavior should remain unchanged for existing non-group entities.
- Grouped entities should select, move, copy, paste, delete, and snap as predictable top-level objects.

### UI
- Add compact command controls near existing selection/context menu/property areas.
- Do not add a landing page or explanatory in-app help text.
- Use existing utilitarian SimpleCAD styling and lucide icons where available.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` — Phase 9 goal, dependencies, and success criteria.
- `.planning/REQUIREMENTS.md` — EDIT-11 through EDIT-15 requirements.
- `.planning/phases/08-file-fidelity-hardening/08-VERIFICATION.md` — Confirms Phase 8 baseline is passed before editing changes.

### Current Implementation
- `src/cad/types.ts` — CadEntity union and document model.
- `src/cad/entityGeometry.ts` — create/move/resize/hit-test helpers.
- `src/cad/render.ts` — canvas rendering and selection handles.
- `src/cad/snap.ts` — snap candidates and intersections.
- `src/cad/clipboard.ts` — copy/paste behavior.
- `src/cad/io/exportService.ts` — JSON/SVG/DXF export behavior.
- `src/cad/io/dxfRoundTrip.ts` — fidelity summary expectations that should not regress.
- `src/ui/App.tsx` — toolbar, context menu, property panel, document history integration.
- `src/ui/CadCanvas.tsx` — canvas selection, drag, resize, box selection, text editing.
- `src/styles.css` — existing dense desktop tool UI styling.

</canonical_refs>

<specifics>
## Specific Ideas

- Create a geometry module for common bounds/transform operations so `render.ts`, `CadCanvas.tsx`, snapping, alignment, and tests do not duplicate entity bounds logic.
- Represent group membership as a `group` entity containing `children: CadEntity[]`.
- Flatten groups for DXF/SVG export by recursively rendering/exporting child entities after applying transforms.
- The right panel can show a multi-selection transform section when more than one object is selected.
- Context menu should expose group/ungroup and align commands because the app already has a right-click command surface.

</specifics>

<deferred>
## Deferred Ideas

- Nested group editing mode.
- Rotation handles on the canvas.
- Scale, mirror, skew, and numeric coordinate inspector.
- Constraint-based alignment/distribution.
- DXF BLOCK export for groups.

</deferred>

---
*Phase: 09-transform-productivity-tools*
*Context gathered: 2026-04-26*
