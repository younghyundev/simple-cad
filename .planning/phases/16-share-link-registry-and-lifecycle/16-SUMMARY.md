---
phase: 16
name: Share Link Registry and Lifecycle
milestone: v1.3
requirements-completed: [SHARE-01, SHARE-02]
key-files:
  - src/cad/collaboration.ts
  - src/ui/App.tsx
  - src/styles.css
  - tests/e2e/collaboration.spec.ts
  - README.md
---

# Phase 16 Summary

## Completed

- Added local share link registry support to `LocalCollaborationRepository`.
- Registered embedded `#share=` links when users create a share link.
- Added right-panel `공유 링크` list with title, created time, status, copy, and delete actions.
- Added local deleted/expired checks before opening registered embedded links.
- Documented that link deletion/expiry is localStorage-based and not server-side revocation.
- Extended collaboration E2E coverage for share link list copy and delete persistence.

## Verification

- `npm run build` passed.
- `npm run test:e2e -- tests/e2e/collaboration.spec.ts` passed.

## Notes

- Because current sharing embeds the drawing in the URL and does not use a backend, deleted links can only be blocked in browsers that have the local registry entry. README now states this limitation explicitly.
