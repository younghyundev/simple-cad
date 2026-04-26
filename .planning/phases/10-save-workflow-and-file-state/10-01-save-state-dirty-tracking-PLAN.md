---
phase: 10-save-workflow-and-file-state
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/ui/App.tsx
  - src/cad/types.ts
  - src/styles.css
autonomous: true
requirements: [SAVE-01, SAVE-04]
---

<objective>
Add tab-aware save state and dirty tracking so the UI can show whether each drawing has unsaved changes before changing the actual save command behavior.
</objective>

<tasks>
  <task id="10-01-01" type="execute">
    <title>Add save state model to workspace tabs</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/cad/types.ts</file>
      <file>.planning/phases/10-save-workflow-and-file-state/10-RESEARCH.md</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
      <file action="modify">src/cad/types.ts</file>
    </files>
    <action>
      Add runtime save metadata for each workspace tab: current target file name/type, optional handle availability marker, revision counter, saved revision, dirty flag, and last saved timestamp. Keep this metadata out of recent document serialization.
    </action>
    <acceptance_criteria>
      <item>Each tab can independently track dirty/saved state.</item>
      <item>Recent documents remain JSON-serializable and do not contain file handles.</item>
      <item>Opened documents initialize save target from file extension/sourceFile.</item>
    </acceptance_criteria>
  </task>

  <task id="10-01-02" type="execute">
    <title>Mark documents dirty on edits</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/cad/useDocumentHistory.ts</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
    </files>
    <action>
      Wrap document update flows so command edits, draw operations, layer changes, paste, transform commands, undo, and redo increment the active tab revision and mark it dirty. Avoid marking dirty for tab activation or file open.
    </action>
    <acceptance_criteria>
      <item>New drawings become dirty after the first edit.</item>
      <item>Undo/redo updates dirty state consistently.</item>
      <item>Switching tabs preserves each tab's dirty state.</item>
    </acceptance_criteria>
  </task>

  <task id="10-01-03" type="execute">
    <title>Display dirty state in tabs and statusbar</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/styles.css</file>
      <file>.planning/phases/10-save-workflow-and-file-state/10-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
      <file action="modify">src/styles.css</file>
    </files>
    <action>
      Show a compact dirty marker on dirty tabs and a Korean save-state text in the statusbar. Keep layout stable and dense.
    </action>
    <acceptance_criteria>
      <item>Dirty marker appears on dirty tabs without changing tab height.</item>
      <item>Statusbar shows saved/unsaved state and target format.</item>
      <item>`npm run build` passes.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- Start dev server and verify dirty marker appears after edit and remains per tab.
</verification>

<success_criteria>
- Save state is explicit and tab-aware.
- Dirty state is visible in tab and statusbar.
- No save command behavior changes are required yet.
</success_criteria>

<threat_model>
No external input is introduced. Main risk is state drift between active document and tab metadata; keep active tab updates centralized.
</threat_model>
