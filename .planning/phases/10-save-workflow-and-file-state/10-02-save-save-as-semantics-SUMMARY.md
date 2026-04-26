---
phase: 10-save-workflow-and-file-state
plan: 2
subsystem: file-io
tags: [save, save-as, export]
requires:
  - plan: 10-01-save-state-dirty-tracking
    provides: Runtime save target state
provides:
  - Save command using current target
  - Save As commands for JSON, DXF, DWG
  - SVG export without changing source target
affects: [file-manager, app-shell, recent-documents]
key-files:
  modified:
    - src/ui/App.tsx
requirements-completed: [SAVE-02]
completed: 2026-04-26
---

# Phase 10 Plan 2 Summary

Save와 Save As의 의미를 분리했습니다.

## Accomplishments

- `저장`은 현재 탭의 대상 파일명과 형식으로 저장합니다.
- `JSON`, `DXF`, `DWG` 버튼은 다른 이름 저장처럼 대상 형식을 갱신합니다.
- `SVG`는 도면 원본 형식을 바꾸지 않는 export-only 흐름으로 유지합니다.
- 저장 성공 시 `sourceFile`, 최근 문서, 저장 revision, 저장 시각을 갱신합니다.

## Verification

- `npm run build` passed.
- `npm run test:cad-fidelity` passed.
