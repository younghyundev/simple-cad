---
phase: 11-workflow-qa-and-performance-baseline
plan: 2
title: Core CAD Workflow E2E Tests
type: implementation
requirements: [QA-01]
depends_on: [11-01-playwright-harness]
estimated: 70min
---

# Plan 11.2: Core CAD Workflow E2E Tests

## Goal

Protect the most important user workflows through browser automation.

## Scope

Add Playwright tests for:

- create a new drawing
- draw at least one rectangle or circle on the canvas
- select and move an entity
- use drag-box multi-selection where stable
- create text through the inline editor
- save/download JSON through the fallback path
- import a small DXF fixture
- use copy/paste or reference paste between tabs if selectors are stable enough

## Implementation Notes

- Prefer high-level UI state assertions over pixel assertions.
- Use statusbar, selected count, tab title, download event, and document-derived UI text for verification.
- Keep pointer coordinates relative to the canvas bounding box.
- If a workflow is too brittle, add a targeted app state indicator rather than asserting raw canvas pixels.

## Files Expected

- `tests/e2e/core-workflow.spec.ts`
- `tests/e2e/fixtures/` if browser-friendly fixtures are needed
- `src/ui/App.tsx` for additional selectors if required

## Acceptance Criteria

- E2E tests cover create, select/move, save/download, DXF import/export-adjacent behavior, and text entry.
- Tests are deterministic on local Chromium.
- `npm run test:e2e` passes.

## Verification

- `npm run build`
- `npm run test:e2e`
- `npm run test:cad-fidelity`
