# Phase 13 Patterns

**Created:** 2026-04-26

## Existing Patterns To Follow

### Internal Model Changes

`src/cad/types.ts` is the source of truth for `CadEntity`. New entity types must be additive union members and must preserve JSON compatibility for existing documents.

Files that switch on `CadEntity.type` must be updated together:

- `src/cad/render.ts`
- `src/cad/entityGeometry.ts`
- `src/cad/entityTransform.ts`
- `src/cad/snap.ts`
- `src/cad/clipboard.ts`
- `src/cad/io/exportService.ts`
- `src/cad/io/dxfRoundTrip.ts`

### DXF Import Boundary

`src/cad/io/importService.ts` owns DXF pair parsing, table parsing, block collection, entity chunk collection, and entity mapping. Keep entity-specific DXF parsing here or in small helpers under `src/cad/io/`.

Current reusable helpers:

- `valueFor`, `valuesFor`, `numberFor`, `dxfPoint`
- `lwPolylinePoints`, `bulgeSegmentPoints`
- `ellipseToPolyline`
- `splineSamplePoints`, `splineNurbsPoints`, `catmullRomPoints`
- `insertTransform`, `transformEntity`

Phase 13 should avoid duplicating sampling math; move shared curve sampling into a helper if it is needed by import, render, bounds, SVG, and DXF export.

### Warning Contract

Use `CadWarning` with:

- `category: 'preserved'` when a DXF entity remains as a native editable entity.
- `category: 'approximated'` when geometry is visibly sampled or simplified.
- `category: 'unsupported'` when an entity or sub-feature is skipped.
- `details` for grep/testable metadata such as `sourceType`, `blockName`, `nestedDepth`, `patternName`, `space`, `controlPointCount`.

### Regression Strategy

`src/cad/io/dxfRoundTrip.ts` compares normalized document summaries. Extend this rather than comparing raw DXF text.

`src/cad/io/roundTripCheck.ts` is the CLI entry point for `npm run test:cad-fidelity`.

`src/cad/io/conversionRegressionCheck.ts` is the right place for warning/category edge cases that do not belong in the main fixture.

## Files Likely Modified

- `src/cad/types.ts`
- `src/cad/render.ts`
- `src/cad/entityGeometry.ts`
- `src/cad/entityTransform.ts`
- `src/cad/snap.ts`
- `src/cad/clipboard.ts`
- `src/cad/io/importService.ts`
- `src/cad/io/exportService.ts`
- `src/cad/io/dxfRoundTrip.ts`
- `src/cad/io/roundTripCheck.ts`
- `src/cad/io/conversionRegressionCheck.ts`
- `README.md`

## Files Likely Created

- `src/cad/curveGeometry.ts`
- `src/cad/io/fixtures/fidelity-advanced-entities.dxf`

## Constraints

- Preserve Korean user-facing warning messages.
- Keep user-visible line widths unchanged when converting or rendering advanced entities.
- Do not add a CAD parsing dependency in this phase unless the current parser cannot represent the required fixture.
- Do not claim full AutoCAD compatibility; classify unsupported details explicitly.

