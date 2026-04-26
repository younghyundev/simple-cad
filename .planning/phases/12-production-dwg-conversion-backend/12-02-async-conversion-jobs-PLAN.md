---
phase: 12-production-dwg-conversion-backend
plan: 2
title: Async Conversion Job Polling
type: implementation
requirements: [DWG-03]
depends_on: [12-01-conversion-config-contract]
estimated: 75min
---

# Plan 12.2: Async Conversion Job Polling

## Goal

Support large CAD conversion jobs that return queued/running status before the document or export blob is ready.

## Scope

- Extend conversion response types to support:
  - immediate import document
  - immediate export blob/download URL
  - job response with `jobId`, `statusUrl`, `mode`, and warnings
- Add polling for job status:
  - `queued`
  - `running`
  - `complete`
  - `failed`
- Support progress values when present.
- Enforce timeout and invalid-response handling.
- Return final normalized `ConversionResult` to `FileManager`.

## Files Expected

- `src/cad/io/conversionApiClient.ts`
- `src/cad/io/fileManager.ts`
- `vite.config.ts` for async mock responses
- `src/cad/io/conversionRegressionCheck.ts`

## Acceptance Criteria

- Import and export can complete from immediate responses or job responses.
- Failed jobs throw categorized conversion errors.
- Timeout or malformed job response cannot hang the app.
- Mock API can simulate async completion and failure for tests.

## Verification

- `npm run build`
- `npm run test:conversion`
- `npm run test:e2e`
