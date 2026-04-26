---
phase: 10-save-workflow-and-file-state
plan: 2
type: execute
wave: 2
depends_on: [10-01-save-state-dirty-tracking]
files_modified:
  - src/ui/App.tsx
  - src/cad/io/fileManager.ts
  - src/styles.css
autonomous: true
requirements: [SAVE-01, SAVE-02]
---

<objective>
Implement real Save versus Save As semantics so users can save to the current target format or explicitly export to another format.
</objective>

<tasks>
  <task id="10-02-01" type="execute">
    <title>Make Save use the active save target</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/cad/io/fileManager.ts</file>
      <file>.planning/phases/10-save-workflow-and-file-state/10-CONTEXT.md</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
      <file action="modify">src/cad/io/fileManager.ts</file>
    </files>
    <action>
      Replace the current JSON-only `저장` behavior with `saveCurrentDocument`, which uses the active tab's current target type/name. Successful save updates saved revision, dirty state, sourceFile lastSavedAt, and status message.
    </action>
    <acceptance_criteria>
      <item>Save on an opened DXF targets DXF by default.</item>
      <item>Save on a JSON document targets JSON by default.</item>
      <item>Save on a new unsaved drawing uses a safe default target and updates dirty state after success.</item>
    </acceptance_criteria>
  </task>

  <task id="10-02-02" type="execute">
    <title>Add explicit Save As commands</title>
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
      Add compact Save As/export controls for JSON, DXF, SVG, and DWG. Save As should update the active save target when the chosen format is a document source format and show accurate Korean messages for export-only formats.
    </action>
    <acceptance_criteria>
      <item>Topbar keeps a clear primary Save action.</item>
      <item>Save As controls fit without text overflow.</item>
      <item>DWG messages do not imply native DWG writing when conversion API/mock is used.</item>
    </acceptance_criteria>
  </task>

  <task id="10-02-03" type="execute">
    <title>Update source file metadata on save</title>
    <read_first>
      <file>src/cad/types.ts</file>
      <file>src/ui/App.tsx</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
    </files>
    <action>
      Ensure successful saves update `document.sourceFile` name/type/lastSavedAt/fileHandleAvailable and tab title when appropriate.
    </action>
    <acceptance_criteria>
      <item>Statusbar and tab title reflect the saved file name.</item>
      <item>Recent documents store updated source metadata without runtime handles.</item>
      <item>`npm run build` and `npm run test:cad-fidelity` pass.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- Smoke-test Save and Save As JSON/DXF/SVG/DWG in dev server.
</verification>

<success_criteria>
- Save and Save As have distinct behavior.
- Current source format is respected.
- Dirty state clears after successful save.
</success_criteria>

<threat_model>
No secrets or remote URLs are introduced. Main risk is overwriting user expectations; keep Save target visible and provide fallback download behavior until handle writes are added.
</threat_model>
