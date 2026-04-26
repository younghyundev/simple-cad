---
phase: 14
plan: 14-03-docs-local-ci-reproducibility
subsystem: docs
tags: [readme, ci, reproducibility]
key-files:
  - README.md
---

# Plan 14.3 Summary: Local and CI Reproducibility Documentation

## Completed

- Documented `npm run verify` as the local CI-equivalent quality gate.
- Documented Node 22 / Node 20.19+ runtime expectation.
- Documented `npx playwright install --with-deps` for Linux/CI browser dependencies.
- Documented GitHub Actions checks and uploaded artifacts.

## Verification

- `npm run build`
- `npm run verify`

## Self-Check

PASSED

