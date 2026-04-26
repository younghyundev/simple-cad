# Phase 8 Patterns

**Created:** 2026-04-26

## Existing Patterns To Follow

### Pure CAD Helpers

Use `src/cad/clipboard.ts`, `src/cad/snap.ts`, and `src/cad/entityGeometry.ts` as examples for React-free CAD logic. New warning grouping and DXF fixture comparison helpers should live under `src/cad/` or `src/cad/io/`, not inside UI components.

### File IO Boundaries

- `ImportService` parses external formats into `CadDocument`.
- `ExportService` converts `CadDocument` to export blobs.
- `FileManager` orchestrates file open/save and conversion API use.
- `ConversionApiClient` owns server API calls.

Keep Phase 8 changes within these boundaries.

### UI Ownership

`App.tsx` currently owns `groupedImportWarnings` and renders the right panel. Phase 8 should move grouping logic into a helper while keeping rendering in `App.tsx`.

### Development Mock API

`vite.config.ts` already contains a Vite middleware plugin for mock CAD conversion. Keep mock behavior in development server config, but make mock status explicit through response warnings/mode.

## Files Likely Modified

- `src/cad/types.ts`
- `src/cad/io/importService.ts`
- `src/cad/io/exportService.ts`
- `src/cad/io/fileManager.ts`
- `src/cad/io/conversionApiClient.ts`
- `src/ui/App.tsx`
- `vite.config.ts`
- `docs/cad-conversion-api.md`
- `package.json`

## Files Likely Created

- `src/cad/io/conversionWarnings.ts`
- `src/cad/io/dxfRoundTrip.ts`
- `src/cad/io/fixtures/*.dxf`
- `src/cad/io/fixtures/*.json`
- `src/cad/io/roundTripCheck.ts`

## Constraints

- Preserve Korean user-facing copy.
- Keep right-panel UI dense and scannable.
- Do not add a heavy test framework unless necessary for this phase.
- Do not break existing JSON/DXF/DWG open/save commands.
