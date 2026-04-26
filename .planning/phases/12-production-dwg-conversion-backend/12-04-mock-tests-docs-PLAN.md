---
phase: 12-production-dwg-conversion-backend
plan: 4
title: Mock Server, Regression Tests, and Documentation
type: implementation
requirements: [DWG-01, DWG-02, DWG-03, DWG-04]
depends_on: [12-01-conversion-config-contract, 12-02-async-conversion-jobs, 12-03-conversion-status-ui]
estimated: 60min
---

# Plan 12.4: Mock Server, Regression Tests, and Documentation

## Goal

Make the production conversion contract reproducible locally and documented for backend integration.

## Scope

- Extend Vite mock API with deterministic modes:
  - immediate success
  - async job success
  - async job failure
  - unsupported file
  - server error
- Extend `test:conversion` to cover:
  - mode preservation
  - job success
  - job failure
  - typed error categories
- Update docs with:
  - env configuration
  - endpoint request/response shapes
  - job polling contract
  - error payload contract
  - security and file-size notes
  - engine adapter notes for APS/RealDWG/ODA/LibreDWG-style backends
- Update README command/feature notes if needed.

## Files Expected

- `vite.config.ts`
- `src/cad/io/conversionRegressionCheck.ts`
- `docs/cad-conversion-api.md`
- `README.md`
- `.planning/phases/12-production-dwg-conversion-backend/12-VERIFICATION.md` during execution

## Acceptance Criteria

- Local mock can exercise production-like success/failure/job states.
- Conversion regression tests cover the new contract.
- Backend implementers can read docs and implement the contract without reading UI code.

## Verification

- `npm run build`
- `npm run test:conversion`
- `npm run test:cad-fidelity`
- `npm run test:e2e`
