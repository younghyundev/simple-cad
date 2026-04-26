---
phase: 09-transform-productivity-tools
plan: 2
type: execute
wave: 2
depends_on: [09-01-transform-geometry-foundation]
files_modified:
  - src/cad/types.ts
  - src/cad/entityGeometry.ts
  - src/cad/entityTransform.ts
  - src/cad/render.ts
  - src/cad/snap.ts
  - src/cad/clipboard.ts
  - src/cad/io/exportService.ts
  - src/cad/io/dxfRoundTrip.ts
autonomous: true
requirements: [EDIT-11, EDIT-14, EDIT-15]
---

<objective>
Add a first-class group entity model and recursive CAD behavior so grouped objects can be selected, moved, copied, pasted, snapped, exported, and ungrouped predictably.
</objective>

<tasks>
  <task id="09-02-01" type="execute">
    <title>Add GroupEntity type and pure group helpers</title>
    <read_first>
      <file>src/cad/types.ts</file>
      <file>src/cad/entityTransform.ts</file>
      <file>.planning/phases/09-transform-productivity-tools/09-CONTEXT.md</file>
    </read_first>
    <files>
      <file action="modify">src/cad/types.ts</file>
      <file action="modify">src/cad/entityTransform.ts</file>
    </files>
    <action>
      Add `GroupEntity` to `CadEntity` with `type: 'group'`, `children`, and optional name metadata. Add helpers to create a group from selected entities, ungroup selected groups, recursively flatten groups, and recursively map child entities.
    </action>
    <acceptance_criteria>
      <item>Group helpers preserve child geometry and styling.</item>
      <item>Grouped child ids remain stable inside the group; the group receives a new top-level id.</item>
      <item>Ungroup returns children as top-level entities and selects them later via command layer.</item>
    </acceptance_criteria>
  </task>

  <task id="09-02-02" type="execute">
    <title>Support groups in geometry, render, snap, and clipboard</title>
    <read_first>
      <file>src/cad/entityGeometry.ts</file>
      <file>src/cad/render.ts</file>
      <file>src/cad/snap.ts</file>
      <file>src/cad/clipboard.ts</file>
    </read_first>
    <files>
      <file action="modify">src/cad/entityGeometry.ts</file>
      <file action="modify">src/cad/render.ts</file>
      <file action="modify">src/cad/snap.ts</file>
      <file action="modify">src/cad/clipboard.ts</file>
    </files>
    <action>
      Make group entities render recursively, hit-test as a top-level object, move by translating children, snap through child candidates, and clone recursively in copy/paste.
    </action>
    <acceptance_criteria>
      <item>A group can be selected by clicking any visible child geometry.</item>
      <item>Dragging a group moves all children together and remains undoable via existing batch history.</item>
      <item>Copy/paste of a group creates a new group with cloned children.</item>
      <item>Snap candidates include grouped children.</item>
    </acceptance_criteria>
  </task>

  <task id="09-02-03" type="execute">
    <title>Flatten groups for export and fidelity summaries</title>
    <read_first>
      <file>src/cad/io/exportService.ts</file>
      <file>src/cad/io/dxfRoundTrip.ts</file>
    </read_first>
    <files>
      <file action="modify">src/cad/io/exportService.ts</file>
      <file action="modify">src/cad/io/dxfRoundTrip.ts</file>
    </files>
    <action>
      Ensure SVG/DXF export and round-trip summaries flatten groups to child entities while JSON preserves the native group structure.
    </action>
    <acceptance_criteria>
      <item>DXF/SVG export does not throw when the document contains groups.</item>
      <item>Existing `npm run test:cad-fidelity` still passes.</item>
      <item>Round-trip summaries count flattened child entities rather than failing on group type.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- Manually create or use a temporary grouped document and confirm render, hit-test, move, copy/paste, and export do not fail.
</verification>

<success_criteria>
- Users can group and ungroup selected objects once command UI is added.
- Grouped objects behave as predictable top-level selectable objects.
- Export and verification paths remain stable with groups in the document.
</success_criteria>

<threat_model>
Group recursion can create accidental cycles only if code constructs invalid data. Helpers should avoid mutating existing child arrays and should not recurse unboundedly through external input beyond normal JSON document loading.
</threat_model>
