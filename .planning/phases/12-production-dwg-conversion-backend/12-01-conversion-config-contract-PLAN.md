---
phase: 12-production-dwg-conversion-backend
plan: 1
title: Conversion Server Configuration and Error Contract
type: implementation
requirements: [DWG-01, DWG-02, DWG-04]
depends_on: [Phase 8, Phase 10, Phase 11]
estimated: 60min
---

# Plan 12.1: Conversion Server Configuration and Error Contract

## Goal

Harden the conversion client boundary so production server configuration and error categories are explicit.

## Scope

- Add typed conversion client configuration:
  - base URL
  - request timeout
  - expected mode or mode policy
- Read configuration from Vite environment variables with safe defaults.
- Add structured `ConversionApiError` with categories:
  - `network`
  - `server`
  - `unsupported`
  - `conversion`
  - `timeout`
  - `invalid-response`
- Normalize server error payloads into Korean user-facing messages.
- Ensure `mode: "mock" | "server"` remains required or safely inferred from headers only when downloading blob responses.

## Files Expected

- `src/cad/io/conversionApiClient.ts`
- `src/cad/io/fileManager.ts`
- `src/cad/types.ts` if shared error/status types are needed
- `src/node-globals.d.ts` if Vite env typing is needed
- `docs/cad-conversion-api.md`
- `README.md`

## Acceptance Criteria

- Production base URL can be configured without editing source code.
- Conversion failures preserve typed category and readable Korean message.
- Existing mock behavior remains compatible.
- Docs explain env variables, mode behavior, and error response shape.

## Verification

- `npm run build`
- `npm run test:conversion`
- `npm run test:cad-fidelity`
