---
phase: 11-workflow-qa-and-performance-baseline
plan: 4
title: Conversion Failure and Warning Regression Checks
type: implementation
requirements: [QA-03]
depends_on: [Phase 8, Phase 10]
estimated: 55min
---

# Plan 11.4: Conversion Failure and Warning Regression Checks

## Goal

Verify that file conversion failures and warning states remain understandable and stable.

## Scope

- Add targeted checks for malformed/unsupported DXF input.
- Assert warning categories for approximated, unsupported, conversion, and mock cases.
- Assert DWG mock mode remains explicit in import/export paths.
- Add a dedicated npm script or fold the checks into `test:cad-fidelity` if that keeps command surface simpler.
- Document what the conversion regression command covers.

## Files Expected

- `src/cad/io/conversionRegressionCheck.ts` or extension of `roundTripCheck.ts`
- `package.json`
- `README.md`
- `.planning/phases/11-workflow-qa-and-performance-baseline/11-VERIFICATION.md` during execution

## Acceptance Criteria

- Conversion failures produce controlled errors or warnings, not uncaught crashes.
- Mock DWG behavior remains visibly categorized as mock.
- Warning category summary behavior is covered by a repeatable command.

## Verification

- `npm run build`
- `npm run test:cad-fidelity`
- new conversion regression command if separate
