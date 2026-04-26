---
phase: 15-sharing-and-review-collaboration
plan: 4
title: Review Comments Tests and Documentation
type: implementation
wave: 4
depends_on: [15-03-share-link-readonly]
requirements: [SHARE-03, SHARE-04]
requirements_addressed: [SHARE-03, SHARE-04]
files_modified:
  - src/ui/App.tsx
  - src/cad/render.ts
  - src/styles.css
  - tests/e2e/collaboration.spec.ts
  - README.md
autonomous: true
estimated: 120min
---

# Plan 15.4: Review Comments, Tests, and Documentation

<objective>
Add coordinate/entity review comments, visible comment markers, E2E coverage, and user documentation for the collaboration workflow.
</objective>

<threat_model>
Comments are local mock data and may contain arbitrary user text. Render comment messages through React text nodes only, not HTML injection. Keep comment marker rendering bounded by comment count.
</threat_model>

<tasks>
  <task id="15.4.1" type="implementation">
    <read_first>
      - src/ui/App.tsx
      - src/cad/collaboration.ts
      - src/cad/render.ts
      - src/styles.css
    </read_first>
    <action>
      Add review comments:
      - context menu action `주석 추가` with `data-testid="add-comment-button"`
      - prompt or compact input for comment message
      - store comments with world coordinate and selected `entityId` when available
      - render comment markers with `data-testid="comment-marker"`
      - add right panel `검토` section with unresolved/resolved comments and a resolve toggle
      - block adding/resolving comments in read-only mode
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `add-comment-button`.
      - `src/ui/App.tsx` contains `comment-marker`.
      - `src/ui/App.tsx` contains `검토`.
      - `src/cad/render.ts` or `src/ui/App.tsx` renders comment markers.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="15.4.2" type="implementation">
    <read_first>
      - tests/e2e/core-workflow.spec.ts
      - tests/e2e/app-smoke.spec.ts
      - README.md
    </read_first>
    <action>
      Add `tests/e2e/collaboration.spec.ts` covering:
      - create a drawing
      - server-save it
      - reopen it from `server-document-item`
      - create a share link
      - open shared URL and verify `readonly-banner`
      - add a comment in editable mode and verify a `comment-marker`
      Update README with server save, share link, read-only, and review comment behavior.
    </action>
    <acceptance_criteria>
      - `tests/e2e/collaboration.spec.ts` exists.
      - Test file contains `server-save-button`.
      - Test file contains `share-link-button`.
      - Test file contains `readonly-banner`.
      - Test file contains `comment-marker`.
      - `README.md` contains `서버 저장`.
      - `README.md` contains `공유 링크`.
      - `README.md` contains `주석`.
      - `npm run verify` exits 0.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run test:e2e`
- `npm run verify`
</verification>

<success_criteria>
- Users can add review comments tied to coordinates or entities.
- Comment markers are visible on the canvas.
- Collaboration behavior has browser E2E coverage.
- README explains the local mock collaboration model and limitations.
</success_criteria>

<must_haves>
- Do not use `dangerouslySetInnerHTML`.
- Do not allow comments to mutate read-only shared documents.
- Do not hide existing conversion/layer/property panels.
</must_haves>

