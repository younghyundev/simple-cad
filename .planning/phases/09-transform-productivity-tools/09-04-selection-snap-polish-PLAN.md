---
phase: 09-transform-productivity-tools
plan: 4
type: execute
wave: 4
depends_on: [09-03-transform-commands]
files_modified:
  - src/cad/entityGeometry.ts
  - src/cad/entityTransform.ts
  - src/cad/snap.ts
  - src/ui/CadCanvas.tsx
  - src/ui/App.tsx
  - README.md
autonomous: true
requirements: [EDIT-14, EDIT-15]
---

<objective>
Polish group and rotated-entity selection, snapping, and documentation so the new transform tools feel predictable in normal CAD workflows.
</objective>

<tasks>
  <task id="09-04-01" type="execute">
    <title>Audit selection and hit testing after transforms</title>
    <read_first>
      <file>src/cad/entityGeometry.ts</file>
      <file>src/cad/entityTransform.ts</file>
      <file>src/ui/CadCanvas.tsx</file>
    </read_first>
    <files>
      <file action="modify">src/cad/entityGeometry.ts</file>
      <file action="modify">src/cad/entityTransform.ts</file>
      <file action="modify">src/ui/CadCanvas.tsx</file>
    </files>
    <action>
      Check and refine click hit-testing, drag-box selection, group movement, and rotated entity bounds after the commands from previous plans are in place.
    </action>
    <acceptance_criteria>
      <item>Rotated lines, polylines, text, dimensions, and groups remain selectable.</item>
      <item>Drag-box selection includes transformed objects based on visible bounds.</item>
      <item>Existing resize handles still work for non-group single entities.</item>
    </acceptance_criteria>
  </task>

  <task id="09-04-02" type="execute">
    <title>Audit snapping after groups and rotation</title>
    <read_first>
      <file>src/cad/snap.ts</file>
      <file>src/cad/entityTransform.ts</file>
    </read_first>
    <files>
      <file action="modify">src/cad/snap.ts</file>
      <file action="modify">src/cad/entityTransform.ts</file>
    </files>
    <action>
      Ensure snap candidates and intersection segments account for grouped and rotated geometry. Keep existing performance guards for large polylines and intersection counts.
    </action>
    <acceptance_criteria>
      <item>Group child endpoints and centers are snap candidates.</item>
      <item>Rotated line/polyline/dimension endpoints snap at their transformed coordinates.</item>
      <item>Intersection guard behavior remains bounded for large files.</item>
    </acceptance_criteria>
  </task>

  <task id="09-04-03" type="execute">
    <title>Final docs and regression verification</title>
    <read_first>
      <file>README.md</file>
      <file>package.json</file>
      <file>.planning/phases/09-transform-productivity-tools/09-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="modify">README.md</file>
    </files>
    <action>
      Update README with the new transform tools and run final regression checks for the whole phase.
    </action>
    <acceptance_criteria>
      <item>README mentions grouping, ungrouping, rotation, and alignment.</item>
      <item>`npm run build` passes.</item>
      <item>`npm run test:cad-fidelity` passes.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- Start the dev server and verify:
  - group two objects
  - move the group
  - copy/paste the group
  - ungroup
  - rotate selected objects
  - align selected objects
  - undo and redo every command
  - snap to a grouped child point
</verification>

<success_criteria>
- Grouped and rotated objects select and snap predictably.
- New transform tools do not regress existing draw/select/move/file flows.
- Documentation matches implemented behavior.
</success_criteria>

<threat_model>
Transform operations are local document mutations. The main safety concern is data loss from incorrect group/ungroup or undo behavior; preserve history and verify selected/unselected entity sets carefully.
</threat_model>
