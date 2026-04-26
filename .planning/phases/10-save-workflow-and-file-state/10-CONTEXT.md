# Phase 10: Save Workflow and File State - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** Roadmap + current codebase scan

<domain>
## Phase Boundary

Phase 10 makes file state explicit and useful:

- show unsaved changes per tab/status bar
- distinguish Save from Save As
- save back to the existing source format when possible
- support File System Access API handles in compatible browsers
- warn before closing tabs or leaving/reloading with unsaved changes

This phase does not implement cloud storage, collaboration, version history, or a production DWG conversion backend.

</domain>

<decisions>
## Implementation Decisions

### Save State
- Track save state per workspace tab, not only globally.
- A tab should know whether it is dirty, what its current save target is, and when it was last saved.
- Document edits, paste, transform commands, layer changes, and file imports should update dirty state consistently.

### Save vs Save As
- `Save` should use the existing file target when available.
- `Save As` should let the user choose/export JSON, DXF, SVG, or DWG.
- New unsaved drawings should default Save to JSON Save As behavior unless File System Access can choose a file.
- DWG Save remains conversion-API-backed and should keep mock/server wording accurate.

### File System Access API
- Use browser feature detection.
- Keep types local and additive so unsupported browsers still build and run.
- Store file handles in runtime tab state only. Do not try to serialize handles into recent documents/localStorage.
- If direct handle write fails, fall back to download-based save and show a Korean status message.

### Warnings
- Tab close should warn when that tab is dirty.
- Browser reload/close should use `beforeunload` if any tab or current document has unsaved changes.
- Keep prompts concise and Korean.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` — Phase 10 goal and success criteria.
- `.planning/REQUIREMENTS.md` — SAVE-01 through SAVE-04.
- `.planning/phases/08-file-fidelity-hardening/08-VERIFICATION.md` — File conversion baseline.
- `.planning/phases/09-transform-productivity-tools/09-VERIFICATION.md` — Editing command baseline.

### Current Implementation
- `src/ui/App.tsx` — tab state, file open/save buttons, autosave message, close tab flow.
- `src/cad/io/fileManager.ts` — format-based import/export orchestration.
- `src/cad/io/exportService.ts` — JSON/SVG/DXF blob creation.
- `src/cad/io/conversionApiClient.ts` — DWG conversion API integration.
- `src/cad/types.ts` — `sourceFile`, `CadFileType`, and document metadata.
- `src/cad/useDocumentHistory.ts` — document state mutation and undo/redo.
- `README.md` — current save/file support documentation.

</canonical_refs>

<specifics>
## Specific Ideas

- Add `SaveState` and `FileHandleState` types near `WorkspaceTab` in `App.tsx`, or extract them to a small UI file if complexity grows.
- Add a small `fileSystemAccess.ts` helper under `src/cad/io/` for capability detection and handle read/write wrappers.
- Display dirty state as a small dot or `*` in the tab label and a statusbar text such as `저장 안 됨`.
- Make topbar Save use current tab state; add Save As split buttons only if the UI remains compact.
- Update recent documents without serializing file handles.

</specifics>

<deferred>
## Deferred Ideas

- Cloud sync or account-based persistence.
- Save conflict detection against external file modifications.
- Full autosave restore UI.
- Browser automation for close/reload warning, which belongs in Phase 11.

</deferred>

---
*Phase: 10-save-workflow-and-file-state*
*Context gathered: 2026-04-26*
