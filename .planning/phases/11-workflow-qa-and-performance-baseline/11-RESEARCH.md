# Phase 11 Research: Workflow QA and Performance Baseline

**Date:** 2026-04-26
**Status:** Ready for planning

## Current Codebase Findings

- The project has `npm run build` and `npm run test:cad-fidelity`.
- There is no browser automation dependency yet.
- The UI is canvas-heavy, so user workflows require pointer/keyboard automation rather than component-only tests.
- Existing file fidelity verification is a Node-executed Vite SSR bundle at `src/cad/io/roundTripCheck.ts`.
- Save flows include downloads and File System Access API fallback; direct file handle behavior needs manual or browser-context stubbing.

## Recommended Test Stack

Use Playwright through `@playwright/test`.

Reasons:

- It can drive real Chromium pointer events for the canvas.
- It supports downloads, dialogs, keyboard shortcuts, and browser context permissions/storage.
- It can run against a Vite dev server or preview server.
- It keeps React internals out of workflow tests.

## Performance Approach

Use deterministic script-level baselines before adding browser frame metrics:

- Generate large `CadDocument` fixtures in memory.
- Measure export/import and summary operations with `performance.now`.
- Include a clear threshold and print measured timings for trend tracking.
- Keep the first thresholds conservative to avoid flaky local failures.

Browser performance can be added later through Playwright if the first script baseline is stable.

## Conversion Error Approach

Extend current CAD IO verification with targeted negative fixtures:

- unsupported or malformed DXF input
- DWG mock import/export mode assertions
- conversion API failure path
- warning grouping/category assertions

Prefer pure TypeScript scripts for conversion failures because they are faster and less flaky than browser tests.

## Risks

- Canvas tests can become brittle if they depend on exact pixels. Prefer high-level checks such as selected count, statusbar text, download event, and persisted document state.
- File downloads in browser tests need deterministic file names and cleanup.
- Performance thresholds vary by machine. Thresholds should catch severe regressions, not small fluctuations.

## Recommendation

Split Phase 11 into four plans:

1. Add Playwright harness and testability selectors.
2. Implement core workflow E2E tests.
3. Add deterministic performance baseline script and fixture generator.
4. Add conversion failure/warning regression checks and documentation.
