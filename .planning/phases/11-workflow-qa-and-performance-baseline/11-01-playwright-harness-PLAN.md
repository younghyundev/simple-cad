---
phase: 11-workflow-qa-and-performance-baseline
plan: 1
title: Playwright Harness and Testability Hooks
type: implementation
requirements: [QA-01]
depends_on: [Phase 10]
estimated: 45min
---

# Plan 11.1: Playwright Harness and Testability Hooks

## Goal

Add a reliable browser automation harness without changing product behavior.

## Scope

- Add `@playwright/test` as a dev dependency.
- Add `playwright.config.ts` configured for the Vite dev server.
- Add `test:e2e` npm script.
- Add minimal `data-testid` selectors to stable command and status surfaces:
  - app shell
  - canvas surface or canvas wrapper
  - toolbar commands
  - statusbar
  - context menu
  - tabbar
- Add a smoke E2E test that loads the app and verifies the start page opens.

## Files Expected

- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `tests/e2e/app-smoke.spec.ts`
- `src/ui/App.tsx`
- `src/ui/CadCanvas.tsx` if a canvas wrapper selector is needed

## Acceptance Criteria

- `npm run test:e2e` starts the app and passes the smoke test.
- Existing behavior and visual layout remain unchanged.
- `npm run build` passes.

## Verification

- `npm run build`
- `npm run test:e2e`
