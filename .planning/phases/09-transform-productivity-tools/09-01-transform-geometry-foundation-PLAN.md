---
phase: 09-transform-productivity-tools
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/cad/types.ts
  - src/cad/entityGeometry.ts
  - src/cad/entityTransform.ts
  - src/cad/render.ts
  - src/ui/CadCanvas.tsx
autonomous: true
requirements: [EDIT-12, EDIT-13, EDIT-15]
---

<objective>
Create the shared geometry and transform foundation needed for grouping, rotation, alignment, and predictable selection behavior without duplicating bounds logic across UI and CAD modules.
</objective>

<tasks>
  <task id="09-01-01" type="execute">
    <title>Extract reusable bounds helpers</title>
    <read_first>
      <file>src/cad/entityGeometry.ts</file>
      <file>src/cad/render.ts</file>
      <file>src/ui/CadCanvas.tsx</file>
      <file>.planning/phases/09-transform-productivity-tools/09-PATTERNS.md</file>
    </read_first>
    <files>
      <file action="create">src/cad/entityTransform.ts</file>
      <file action="modify">src/cad/render.ts</file>
      <file action="modify">src/ui/CadCanvas.tsx</file>
    </files>
    <action>
      Add pure helpers for entity bounds, bounds points, selection bounds, and top-level entity lookup. Replace local duplicated bounds logic in render and canvas selection with the helper where safe.
    </action>
    <acceptance_criteria>
      <item>Selection box behavior remains unchanged for existing entity types.</item>
      <item>Render selection bounds and canvas selection hit boxes use the same helper.</item>
      <item>Helpers are React-free and avoid mutating entities.</item>
    </acceptance_criteria>
  </task>

  <task id="09-01-02" type="execute">
    <title>Add generic transform primitives</title>
    <read_first>
      <file>src/cad/entityGeometry.ts</file>
      <file>src/cad/types.ts</file>
      <file>.planning/phases/09-transform-productivity-tools/09-RESEARCH.md</file>
    </read_first>
    <files>
      <file action="modify">src/cad/entityTransform.ts</file>
      <file action="modify">src/cad/entityGeometry.ts</file>
    </files>
    <action>
      Add pure helpers for rotating a point, rotating supported entities around a pivot, aligning selected entities to a selection bounds edge/center, and flattening nested entity lists for future group support.
    </action>
    <acceptance_criteria>
      <item>Rotation helper supports line, circle, arc, polyline, text, and dimension.</item>
      <item>Rect rotation behavior is explicit: either represented safely or converted to a polyline when needed.</item>
      <item>Alignment helper returns only changed copies and preserves unselected entities.</item>
    </acceptance_criteria>
  </task>

  <task id="09-01-03" type="execute">
    <title>Wire foundation without UI command changes</title>
    <read_first>
      <file>src/cad/render.ts</file>
      <file>src/ui/CadCanvas.tsx</file>
      <file>src/cad/snap.ts</file>
    </read_first>
    <files>
      <file action="modify">src/cad/render.ts</file>
      <file action="modify">src/ui/CadCanvas.tsx</file>
    </files>
    <action>
      Keep user-facing behavior unchanged while routing bounds and selection computations through the new shared helpers. Do not add group/rotate/align UI in this plan.
    </action>
    <acceptance_criteria>
      <item>`npm run build` passes.</item>
      <item>`npm run test:cad-fidelity` passes.</item>
      <item>Existing drag box selection still selects lines, rectangles, circles, text, dimensions, and polylines.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- Smoke-test existing select, box select, move, resize, and text edit behavior in the dev server if a browser is available.
</verification>

<success_criteria>
- Bounds and transform logic has a single reusable home.
- Later group/rotation/alignment plans can use pure helpers instead of adding geometry code inside React components.
- Existing editing behavior is preserved.
</success_criteria>

<threat_model>
No new network or file input is introduced. Main risk is selection regression from changed bounds logic; verify existing canvas workflows before proceeding.
</threat_model>
