---
phase: 10-save-workflow-and-file-state
plan: 4
subsystem: ux
tags: [unsaved-guard, docs, readme]
requires:
  - plan: 10-01-save-state-dirty-tracking
    provides: Dirty state detection
provides:
  - Unsaved tab close guard
  - Browser beforeunload guard
  - README save workflow documentation
affects: [tabs, docs]
key-files:
  modified:
    - src/ui/App.tsx
    - README.md
requirements-completed: [SAVE-04]
completed: 2026-04-26
---

# Phase 10 Plan 4 Summary

저장하지 않은 변경사항이 사라지기 전에 사용자에게 경고하도록 했습니다.

## Accomplishments

- dirty 상태인 탭을 닫을 때 확인창을 표시합니다.
- dirty 탭이 하나라도 있으면 브라우저 새로고침/이탈 전에 `beforeunload` 경고를 등록합니다.
- README에 Save, Save As, File System Access API, dirty tab 동작을 문서화했습니다.

## Verification

- `npm run build` passed.
- `npm run test:cad-fidelity` passed.
- Vite dev server app shell smoke passed.
