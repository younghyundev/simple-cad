---
phase: 15-sharing-and-review-collaboration
plan: 3
title: Share Link and Read-Only Document Mode
type: implementation
wave: 3
depends_on: [15-02-server-save-open-ui]
requirements: [SHARE-02, SHARE-04]
requirements_addressed: [SHARE-02, SHARE-04]
files_modified:
  - src/ui/App.tsx
  - src/ui/CadCanvas.tsx
  - src/styles.css
autonomous: true
estimated: 120min
---

# Plan 15.3: Share Link and Read-Only Document Mode

<objective>
Allow users to create read-only share links for server-saved documents and open shared documents without allowing edits.
</objective>

<threat_model>
Share tokens are local mock identifiers, not secure authorization credentials. Treat the share link as a UX contract only. Read-only mode must block UI mutation paths to avoid accidental edits in shared review.
</threat_model>

<tasks>
  <task id="15.3.1" type="implementation">
    <read_first>
      - src/ui/App.tsx
      - src/cad/collaboration.ts
      - .planning/phases/15-sharing-and-review-collaboration/15-UI-SPEC.md
    </read_first>
    <action>
      Add share controls:
      - topbar button `공유` with `data-testid="share-link-button"`
      - if no server document exists, server-save first, then create a share link
      - generate a local URL containing `?share=<token>`
      - copy link to clipboard when `navigator.clipboard.writeText` is available
      - show file message `공유 링크를 만들었습니다.`
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `share-link-button`.
      - `src/ui/App.tsx` contains `?share=`.
      - `src/ui/App.tsx` contains `공유 링크를 만들었습니다`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="15.3.2" type="implementation">
    <read_first>
      - src/ui/App.tsx
      - src/ui/CadCanvas.tsx
      - src/styles.css
    </read_first>
    <action>
      Implement read-only shared document loading and enforcement:
      - on app load, parse `new URLSearchParams(window.location.search).get('share')`
      - resolve share token with `LocalCollaborationRepository.resolveShareLink`
      - create a tab with `collaborationState.readonly: true`
      - show banner `읽기 전용 공유 문서` with `data-testid="readonly-banner"`
      - disable canvas document changes, property/layer mutations, delete, paste, group, rotate, align, server save, and share mutation buttons in read-only mode
      - keep local export/download buttons enabled if they do not mutate document state
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `readonly-banner`.
      - `src/ui/App.tsx` contains `읽기 전용 공유 문서`.
      - `src/ui/App.tsx` guards `updateDocument` or mutation handlers with readonly checks.
      - `src/ui/CadCanvas.tsx` receives a readonly prop or App prevents mutation callbacks.
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
- Users can create a share link for a server-saved document.
- Opening the share link loads a read-only document.
- Read-only mode prevents document mutation without breaking viewing/export.
</success_criteria>

<must_haves>
- Do not claim share tokens are secure auth.
- Do not allow keyboard shortcuts to mutate read-only documents.
- Do not break normal editable tabs.
</must_haves>

