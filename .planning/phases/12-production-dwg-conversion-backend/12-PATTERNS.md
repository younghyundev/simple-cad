# Phase 12 Patterns

## Existing Patterns

- `FileManager` is the app-facing file IO facade.
- `ConversionApiClient` owns network calls for DWG/CAD conversion.
- `ImportService` and `ExportService` handle local JSON/DXF/SVG behavior.
- `CadDocument.conversionMode` and `sourceFile.conversionMode` already carry mock/server mode.
- Conversion warning UI is derived through `summarizeConversionWarnings(document)`.
- Vite dev server owns local `/api/cad/*` mock routes.
- `conversionRegressionCheck.ts` provides script-level coverage for conversion warning/failure behavior.

## Patterns To Preserve

- Keep engine-specific backend details out of UI components.
- Keep all conversion responses normalized before they reach `App.tsx`.
- Add structured data types in `src/cad/io/conversionApiClient.ts`, not ad hoc object checks in UI.
- UI should receive plain errors/status strings or typed progress state, not raw fetch responses.
- Mock mode must always remain explicit in response mode, headers, warnings, and UI labels.

## Testing Pattern

- Unit/script-like conversion checks stay under `src/cad/io/*Check.ts`.
- Browser E2E should cover user-visible success/failure states only after client behavior is stable.
- Docs must be updated with every API contract change.
