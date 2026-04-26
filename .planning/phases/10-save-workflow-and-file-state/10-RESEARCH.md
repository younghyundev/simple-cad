# Phase 10: Save Workflow and File State - Research

**Created:** 2026-04-26
**Scope:** Dirty state, Save/Save As, File System Access API, close/reload warnings.

## Current Architecture

- `App.tsx` owns tabs, active tab id, selected ids, viewport, file messages, and file input.
- `WorkspaceTab` stores `document`, `history`, `viewport`, `selectedEntityIds`, and `lastOpenedAt`.
- `saveAs(type)` always calls `fileManager.save(document, { fileName, type })`, creates a blob URL, and downloads.
- The topbar `저장` button currently means JSON export, not true Save.
- `openFile(file)` uses regular `<input type="file">`, so no persistent browser file handle is available.
- `sourceFile` contains name/type/lastSavedAt/fileHandleAvailable but the app currently sets `fileHandleAvailable: false`.
- Autosave writes current document to localStorage but does not control dirty/saved state.
- Closing tabs is immediate and does not check dirty state.
- `beforeunload` warning is not implemented.

## File System Access API Notes

Use feature detection:

- `window.showOpenFilePicker`
- `window.showSaveFilePicker`

Potential local type declarations are needed because DOM lib support can vary. Keep them narrow:

- `FileSystemFileHandle`
- `FileSystemWritableFileStream`

Do not serialize file handles. They are runtime browser objects and not suitable for localStorage recent docs.

## Recommended Implementation Shape

1. Add a runtime save target model:
   - file name
   - file type
   - file handle optional
   - last saved document revision or serialized snapshot hash/token
   - dirty boolean

2. Add a simple revision counter:
   - increment when `updateDocument` changes document
   - track `savedRevision` on successful save
   - dirty is `currentRevision !== savedRevision`

3. Implement save helpers:
   - `saveCurrentDocument()`
   - `saveAs(type)`
   - `writeBlobToHandle(blob, handle)`
   - fallback to download when no handle is available

4. Update UI:
   - tab dirty marker
   - statusbar save status
   - Save and Save As actions
   - file handle availability message where relevant

5. Add guards:
   - close tab confirm if dirty
   - `beforeunload` if any dirty tab/current doc

## Risks

### Dirty State Drift

Tabs already snapshot document/history/viewport via an effect. Dirty state must travel with the tab and active document. If current active dirty state only lives outside tabs, switching tabs can lose it.

### Handle Availability

File handles are unavailable through regular file input and recent documents. The UI should not imply direct overwrite unless a handle exists.

### DWG Save

DWG export goes through conversion API and may be mock in development. Save messages should not imply native DWG write support.

## Verification

- `npm run build`
- `npm run test:cad-fidelity`
- Manual dev server checks:
  - new drawing shows dirty after edit
  - Save As JSON downloads or writes
  - opened DXF Save targets DXF when possible
  - dirty marker clears after save
  - dirty tab close prompts
  - beforeunload warning is registered when dirty

## Recommendation

Plan Phase 10 in four waves:

1. Save state model and dirty tracking.
2. Save / Save As command semantics.
3. File System Access API helper and integration.
4. Unsaved close/reload warnings and docs.
