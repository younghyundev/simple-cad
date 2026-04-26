---
phase: 11-workflow-qa-and-performance-baseline
plan: 3
title: Large Drawing Performance Baseline
type: implementation
requirements: [QA-02]
depends_on: [Phase 8, Phase 9, Phase 10]
estimated: 55min
---

# Plan 11.3: Large Drawing Performance Baseline

## Goal

Create a repeatable performance check for large drawings so future changes can detect severe regressions.

## Scope

- Add deterministic large `CadDocument` generator.
- Add script that measures representative operations:
  - document generation
  - selection bounds or transform helper traversal
  - DXF export for a large but bounded document
  - warning summary or import/export summary where relevant
- Add `test:performance` npm script.
- Print measured timings and entity counts.
- Fail only on conservative thresholds.

## Files Expected

- `src/cad/performance/largeDocumentFixture.ts`
- `src/cad/performance/performanceBaseline.ts`
- `package.json`
- `src/node-globals.d.ts` if Node globals need additional typing

## Acceptance Criteria

- `npm run test:performance` runs without browser setup.
- Output includes entity count and timing summary.
- Thresholds are documented in the script.

## Verification

- `npm run build`
- `npm run test:performance`
- `npm run test:cad-fidelity`
