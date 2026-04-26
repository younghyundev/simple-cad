---
phase: 15-sharing-and-review-collaboration
plan: 2
title: Server Save and Open UI Integration
type: implementation
wave: 2
depends_on: [15-01-collaboration-repository]
requirements: [SHARE-01, SHARE-04]
requirements_addressed: [SHARE-01, SHARE-04]
files_modified:
  - src/ui/App.tsx
  - src/styles.css
autonomous: true
estimated: 120min
---

# Plan 15.2: Server Save and Open UI Integration

<objective>
Integrate local server-save/open flows into tabs, start page, dirty state, recent documents, and status display without breaking existing file save behavior.
</objective>

<threat_model>
No network calls are added. User-controlled localStorage data may contain malformed documents, so opening server documents must validate shape enough to avoid crashing the UI.
</threat_model>

<tasks>
  <task id="15.2.1" type="implementation">
    <read_first>
      - src/ui/App.tsx
      - src/cad/collaboration.ts
      - .planning/phases/15-sharing-and-review-collaboration/15-PATTERNS.md
    </read_first>
    <action>
      Add `collaborationState: CollaborationState` to `WorkspaceTab` and App state. Create `createCollaborationState()` defaulting to `{ readonly: false }`. Preserve this state when switching tabs, creating tabs, opening files, opening recent documents, and closing tabs.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` imports `CollaborationState`.
      - `WorkspaceTab` contains `collaborationState`.
      - `src/ui/App.tsx` contains `createCollaborationState`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="15.2.2" type="implementation">
    <read_first>
      - src/ui/App.tsx
      - src/styles.css
      - src/cad/collaboration.ts
    </read_first>
    <action>
      Add server save/open UI:
      - topbar button `서버 저장` with `data-testid="server-save-button"`
      - start page section `서버 도면`
      - server document rows with `data-testid="server-document-item"`
      - statusbar server state text showing `서버 저장됨`, `서버 변경 있음`, or `서버 미저장`
      Implement handlers using `LocalCollaborationRepository.saveDocument`, `listDocuments`, and `openDocument`.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `server-save-button`.
      - `src/ui/App.tsx` contains `server-document-item`.
      - `src/ui/App.tsx` contains `서버 저장됨`.
      - `src/styles.css` contains `.server-panel` or `.server-document`.
      - `npm run test:e2e` exits 0.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run test:e2e`
- `npm run verify`
</verification>

<success_criteria>
- Users can save the active document to server storage.
- Users can reopen server-stored documents from the start page.
- Server save status does not replace or break local file dirty state.
</success_criteria>

<must_haves>
- Existing Save/Save As behavior must remain unchanged.
- Server save must not store runtime file handles.
- Tab switching must preserve server document status.
</must_haves>

