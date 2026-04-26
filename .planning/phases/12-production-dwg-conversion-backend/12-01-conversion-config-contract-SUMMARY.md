# Phase 12.01 Summary: Conversion Config Contract

## Completed

- Added configurable conversion API base URL and timeout settings through Vite env variables.
- Kept `/api/cad` as the local default while allowing production deployments to point at an external conversion service.
- Normalized conversion responses so imported documents carry explicit `mock` or `server` conversion mode metadata.
- Added typed conversion errors with stable categories for UI and tests.

## Files Changed

- `src/cad/io/conversionApiClient.ts`
- `src/vite-env.d.ts`
- `docs/cad-conversion-api.md`
- `README.md`

## Verification

- `npm run build`
- `npm run test:conversion`

