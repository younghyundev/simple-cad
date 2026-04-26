---
phase: 15
plan: 15-04-review-comments-tests-docs
subsystem: collaboration-review
tags: [comments, playwright, documentation]
key-files:
  - src/ui/App.tsx
  - src/styles.css
  - tests/e2e/collaboration.spec.ts
  - README.md
requirements-completed: [SHARE-03, SHARE-04]
---

# Plan 15.4 Summary: Review Comments, Tests, and Documentation

## Completed

- Added `주석 추가` context-menu action with `data-testid="add-comment-button"`.
- Stored coordinate/entity review comments through `LocalCollaborationRepository`.
- Rendered bounded canvas comment markers with `data-testid="comment-marker"`.
- Added right-panel `검토` section with unresolved/resolved comment display and resolve toggle.
- Blocked adding/resolving comments in read-only shared documents.
- Added Playwright coverage for server save, server reopen, share link, read-only banner, and comment marker.
- Updated README with server save, share link, read-only, and 주석 behavior.

## Verification

- `npm run build` passed.
- `npm run test:e2e` passed.
- `npm run verify` passed.

## Task Commits

- `4fa9983 feat(15-04): add review comments and collaboration tests`
- `7f23ee6 fix(15-04): share latest server revision`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Share link could point at a stale server snapshot**
- **Found during:** Code review gate after Task 15.4.2
- **Issue:** If a user saved to server, edited the drawing again, and then clicked `공유`, the share link could reuse the older server document record.
- **Fix:** `createShareLink` now saves first when the server saved revision differs from the active document revision.
- **Files modified:** `src/ui/App.tsx`
- **Verification:** `npm run verify`
- **Committed in:** `7f23ee6`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** Corrects share-link fidelity without changing the planned UX.

## Issues Encountered

- The collaboration E2E initially cleared localStorage on every navigation, which erased the mock share link before opening `?share=`. The test setup now clears localStorage once before the scenario and preserves it across the shared URL navigation.
- Vite emitted the existing Node version warning for Node 20.18.1. Verification still exited successfully.

## Next Phase Readiness

Phase 15 now has complete mock collaboration coverage: server save/open, share links, read-only review, and comments.

## Self-Check

PASSED
