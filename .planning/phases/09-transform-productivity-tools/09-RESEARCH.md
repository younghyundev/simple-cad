# Phase 9: Transform Productivity Tools - Research

**Created:** 2026-04-26
**Scope:** Group, rotate, align, selection, snap, undo/redo integration.

## Current Architecture

- `CadEntity` is a discriminated union of line, rect, circle, arc, polyline, text, and dimension.
- Movement is centralized in `translateEntity`.
- Resize and handles are single-entity only.
- Hit testing is centralized in `hitTestEntity`.
- Rendering uses a local `drawEntity` function in `render.ts`.
- Selection box logic in `CadCanvas.tsx` calculates entity screen rects locally, duplicating bounds logic from `render.ts`.
- Snapping uses entity-specific snap points and segment intersections.
- Undo/redo is document-level. Normal commands use `updateDocument`; drag/resize uses batch history.
- Copy/paste clones entities through `clipboard.ts`.
- Export currently switches over entity types directly.

## Risks

### Bounds Duplication

Bounds logic exists in at least `render.ts` and `CadCanvas.tsx`. Alignment and group selection will add more uses. This should be moved into a reusable helper before adding group logic.

### Group Entity Exhaustiveness

Adding a `group` variant to `CadEntity` will require updating every switch-like branch:

- geometry movement / hit testing / resize handles
- render
- snap candidates and segments
- clipboard clone
- export flattening
- import/export summary comparisons
- property panel type display

TypeScript should catch many branches, but some code uses broad final fallbacks that may treat a group like a dimension unless explicitly updated.

### Rotation Semantics

The existing `rotation` base field is mostly metadata; shapes are drawn and hit-tested in unrotated world coordinates. Phase 9 should make rotation real by transforming geometry around a pivot or by having geometry helpers apply inverse transforms for hit testing. For this app, physically transforming coordinates is simpler and keeps export/snap logic predictable.

Recommendation: implement `rotateEntity(entity, pivot, angleDegrees)` as a geometry transform that updates coordinates. For text, update position and optionally accumulate `rotation` for future rendering. For rect, either convert to polyline or support rotated rect geometry. To avoid breaking rect editing, prefer keeping rect as rect only for 90-degree multiples, or convert rotated rects to polyline. If conversion is too disruptive, store rotation and add rotated rendering/hit-testing for rect/text in the same plan.

### Export Expectations

DXF export should flatten groups to child entities. SVG export should also flatten or render recursively. JSON preserves the group object natively.

## Recommended Implementation Shape

1. Add shared `entityTransform.ts` or extend `entityGeometry.ts` with:
   - `getEntityBounds`
   - `getEntityBoundsPoints`
   - `getSelectionBounds`
   - `translateEntity`
   - `rotateEntity`
   - `flattenEntities`
   - `alignEntities`

2. Add `GroupEntity` to `types.ts`:
   - `type: 'group'`
   - `children: CadEntity[]`
   - optional `name`

3. Update foundational systems:
   - render group recursively
   - hit-test group by children
   - snap group by children
   - copy/paste clone group recursively
   - export group children recursively

4. Add command layer in `App.tsx`:
   - group selected
   - ungroup selected group(s)
   - rotate selected
   - align selected
   - context menu entries and compact transform panel controls

5. Verify:
   - `npm run build`
   - `npm run test:cad-fidelity`
   - manual smoke in dev server: group, move, copy, ungroup, rotate, align, undo/redo

## UI Notes

- Keep controls dense and work-focused.
- Use existing panel and context menu patterns.
- Avoid instructional text blocks; button labels should be command names.
- Multi-selection properties can show command controls instead of a full property list.

## Open Implementation Choices

- Whether to introduce test scripts in Phase 9 or defer automated browser tests to Phase 11.
- Whether rotation uses direct geometry mutation for all types or mixed coordinate + `rotation` rendering.

Recommendation: keep Phase 9 implementation pragmatic and add minimal pure helper tests only if the project gains a runner. Broader browser automation belongs to Phase 11.
