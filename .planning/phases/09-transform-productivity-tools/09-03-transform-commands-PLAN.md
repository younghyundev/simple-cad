---
phase: 09-transform-productivity-tools
plan: 3
type: execute
wave: 3
depends_on: [09-02-group-entity-model]
files_modified:
  - src/ui/App.tsx
  - src/ui/CadCanvas.tsx
  - src/cad/entityTransform.ts
  - src/styles.css
autonomous: true
requirements: [EDIT-11, EDIT-12, EDIT-13, EDIT-14]
---

<objective>
Expose group, ungroup, rotate, and align as user-facing commands integrated with selection state, context menus, right-panel controls, and undo/redo.
</objective>

<tasks>
  <task id="09-03-01" type="execute">
    <title>Add command handlers in App</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/cad/entityTransform.ts</file>
      <file>src/cad/useDocumentHistory.ts</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
    </files>
    <action>
      Add App-level command handlers for grouping selected entities, ungrouping selected group entities, rotating selected entities around selection center, and aligning selected entities. Use `updateDocument` so each command creates one undo step.
    </action>
    <acceptance_criteria>
      <item>Group command is enabled for two or more selected entities.</item>
      <item>Ungroup command is enabled when selection includes at least one group.</item>
      <item>Rotate and align commands preserve selection after execution.</item>
      <item>Undo/redo reverses each command as one history step.</item>
    </acceptance_criteria>
  </task>

  <task id="09-03-02" type="execute">
    <title>Add context menu transform commands</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>.planning/phases/09-transform-productivity-tools/09-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
      <file action="modify">src/styles.css</file>
    </files>
    <action>
      Extend the existing right-click context menu with group, ungroup, quick rotate, and alignment commands using compact Korean labels.
    </action>
    <acceptance_criteria>
      <item>Existing copy, reference copy/paste, paste, and delete menu commands remain available.</item>
      <item>Disabled commands use `disabled` and do not perform partial actions.</item>
      <item>Context menu closes after successful commands.</item>
    </acceptance_criteria>
  </task>

  <task id="09-03-03" type="execute">
    <title>Add right-panel transform controls</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/styles.css</file>
      <file>.planning/phases/09-transform-productivity-tools/09-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
      <file action="modify">src/styles.css</file>
    </files>
    <action>
      Add compact transform controls in the properties panel for single group selection and multi-selection: selected count, group/ungroup, alignment buttons, rotation degree input, and apply action.
    </action>
    <acceptance_criteria>
      <item>Single group selection shows child count and ungroup command.</item>
      <item>Multi-selection shows command controls instead of only an empty-state sentence.</item>
      <item>Rotation input text fits in the panel and does not shift layout.</item>
      <item>All visible labels are Korean.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- In the dev server, verify group, ungroup, rotate, align, undo, redo, context menu, and panel commands.
</verification>

<success_criteria>
- Users can perform group, ungroup, rotate, and align from command surfaces.
- Commands are history-aware and keep selection understandable.
- UI follows the Phase 9 UI spec.
</success_criteria>

<threat_model>
No API or unsafe HTML is introduced. Main risk is destructive command behavior; commands must no-op safely when selection is insufficient and must not delete unselected entities.
</threat_model>
