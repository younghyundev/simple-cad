---
phase: 10-save-workflow-and-file-state
plan: 3
type: execute
wave: 3
depends_on: [10-02-save-save-as-semantics]
files_modified:
  - src/cad/io/fileSystemAccess.ts
  - src/ui/App.tsx
  - src/node-globals.d.ts
  - README.md
autonomous: true
requirements: [SAVE-02, SAVE-03]
---

<objective>
Add File System Access API support so compatible browsers can save back to a chosen file handle, while unsupported browsers continue to download files.
</objective>

<tasks>
  <task id="10-03-01" type="execute">
    <title>Create File System Access helper</title>
    <read_first>
      <file>src/cad/io/fileManager.ts</file>
      <file>src/node-globals.d.ts</file>
      <file>.planning/phases/10-save-workflow-and-file-state/10-PATTERNS.md</file>
    </read_first>
    <files>
      <file action="create">src/cad/io/fileSystemAccess.ts</file>
      <file action="modify">src/node-globals.d.ts</file>
    </files>
    <action>
      Add feature detection, narrow local type declarations if needed, `showSaveFilePicker` wrapper, and `writeBlobToFileHandle` helper. Keep all helpers safe when the API is unavailable.
    </action>
    <acceptance_criteria>
      <item>Unsupported browsers build and fall back without throwing at import time.</item>
      <item>File handles are typed narrowly and not serialized.</item>
      <item>Helper can write a Blob to a selected handle.</item>
    </acceptance_criteria>
  </task>

  <task id="10-03-02" type="execute">
    <title>Integrate handle save and Save As picker</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/cad/io/fileSystemAccess.ts</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
    </files>
    <action>
      Use file handles for Save when available. Let Save As request a save handle in compatible browsers and fall back to download otherwise. Preserve handle only in runtime tab state.
    </action>
    <acceptance_criteria>
      <item>Save to a handle writes without triggering download when permission is available.</item>
      <item>If handle write fails, fallback download occurs and the user sees a Korean status message.</item>
      <item>`fileHandleAvailable` reflects runtime capability but no handle is stored in recent documents.</item>
    </acceptance_criteria>
  </task>

  <task id="10-03-03" type="execute">
    <title>Document browser support and fallback behavior</title>
    <read_first>
      <file>README.md</file>
    </read_first>
    <files>
      <file action="modify">README.md</file>
    </files>
    <action>
      Document File System Access API support and fallback download behavior without overstating browser coverage.
    </action>
    <acceptance_criteria>
      <item>README explains supported-browser direct save and fallback download.</item>
      <item>`npm run build` passes.</item>
      <item>`npm run test:cad-fidelity` passes.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- In a compatible browser, smoke-test Save As with native picker if possible.
- In unsupported path or via helper fallback, confirm download still occurs.
</verification>

<success_criteria>
- Compatible browsers can save through file handles.
- Unsupported browsers keep working through downloads.
- File handles never enter serialized recent document data.
</success_criteria>

<threat_model>
File System Access writes to user-selected files. Only write after explicit picker/handle use, never infer paths, never log file contents, and provide fallback on permission failure.
</threat_model>
