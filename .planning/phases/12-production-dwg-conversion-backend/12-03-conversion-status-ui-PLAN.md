---
phase: 12-production-dwg-conversion-backend
plan: 3
title: Conversion Progress and Failure UI
type: implementation
requirements: [DWG-02, DWG-03]
depends_on: [12-01-conversion-config-contract, 12-02-async-conversion-jobs]
estimated: 70min
---

# Plan 12.3: Conversion Progress and Failure UI

## Goal

Expose production conversion status and categorized failures clearly in the existing SimpleCAD UI.

## Scope

- Add UI state for active conversion operation:
  - idle
  - uploading/requesting
  - queued/running
  - complete
  - failed
- Show short progress/status in statusbar or file message.
- Surface categorized failures in Korean:
  - network
  - server
  - unsupported file
  - conversion failed
  - timeout
  - invalid response
- Preserve existing conversion warning panel behavior.
- Prevent document mutation on failed import.
- Preserve Save/Save As dirty-state behavior during failed export.

## Files Expected

- `src/ui/App.tsx`
- `src/styles.css`
- `src/cad/io/conversionWarnings.ts` if status grouping needs extension
- `tests/e2e/core-workflow.spec.ts` or a new conversion-status E2E test

## Acceptance Criteria

- User can see job progress and completion/failure messages.
- Failed conversion does not replace the current document or clear dirty state incorrectly.
- Mock conversion remains visually marked as mock.
- E2E or conversion regression tests cover at least one failure state.

## Verification

- `npm run build`
- `npm run test:e2e`
- `npm run test:conversion`
