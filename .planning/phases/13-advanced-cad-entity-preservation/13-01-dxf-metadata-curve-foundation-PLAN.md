---
phase: 13-advanced-cad-entity-preservation
plan: 1
title: DXF Metadata and Curve Geometry Foundation
type: implementation
wave: 1
depends_on: [Phase 8, Phase 12]
requirements: [CAD-04]
requirements_addressed: [CAD-04]
files_modified:
  - src/cad/types.ts
  - src/cad/curveGeometry.ts
  - src/cad/io/importService.ts
  - src/cad/io/dxfRoundTrip.ts
autonomous: true
estimated: 75min
---

# Plan 13.1: DXF Metadata and Curve Geometry Foundation

<objective>
Add additive document metadata and shared curve sampling helpers so later Phase 13 plans can preserve advanced DXF entities without duplicating geometry math.
</objective>

<threat_model>
No network or persistence boundary changes. Main risk is malformed DXF data causing invalid geometry or excessive sampling. Mitigate by clamping sample counts, ignoring non-finite numeric values, and preserving invalid source details as warnings instead of throwing during import.
</threat_model>

<tasks>
  <task id="13.1.1" type="implementation">
    <read_first>
      - src/cad/types.ts
      - src/cad/io/importService.ts
      - src/cad/io/dxfRoundTrip.ts
      - .planning/phases/13-advanced-cad-entity-preservation/13-RESEARCH.md
    </read_first>
    <action>
      Extend `CadDocument` in `src/cad/types.ts` with optional `metadata?: CadDocumentMetadata`. Add exported types:
      - `CadDocumentMetadata`
      - `CadDocumentExtents`
      - `CadDrawingSpaceSummary`
      `CadDocumentMetadata` must include optional fields `dxfVersion?: string`, `insUnits?: string`, `measurement?: 'metric' | 'imperial' | 'unknown'`, `extents?: { min: CadPoint; max: CadPoint }`, and `spaces?: { model: number; paper: number }`.
    </action>
    <acceptance_criteria>
      - `src/cad/types.ts` contains `export type CadDocumentMetadata`.
      - `src/cad/types.ts` contains `metadata?: CadDocumentMetadata;`.
      - Existing `CadDocument.units` union remains unchanged.
    </acceptance_criteria>
  </task>

  <task id="13.1.2" type="implementation">
    <read_first>
      - src/cad/io/importService.ts
      - src/cad/types.ts
    </read_first>
    <action>
      Add HEADER parsing in `src/cad/io/importService.ts`. Parse `$ACADVER`, `$INSUNITS`, `$MEASUREMENT`, `$EXTMIN`, and `$EXTMAX` from the `HEADER` section. Map `$INSUNITS` values to the existing `CadDocument.units` only for: `4 -> mm`, `5 -> cm`, `6 -> m`, `1 -> inch`. Keep `mm` as fallback. Map `$MEASUREMENT` values to `metadata.measurement`: `1 -> metric`, `0 -> imperial`, otherwise `unknown`. Count entity spaces using group code `67`: missing or `0` is model, `1` is paper.
    </action>
    <acceptance_criteria>
      - `src/cad/io/importService.ts` contains `parseHeaderMetadata`.
      - `src/cad/io/importService.ts` contains string `$INSUNITS`.
      - `src/cad/io/importService.ts` contains string `$EXTMIN`.
      - Imported `CadDocument` includes a `metadata:` property.
      - `npm run test:cad-fidelity` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.1.3" type="implementation">
    <read_first>
      - src/cad/io/importService.ts
      - src/cad/entityGeometry.ts
      - src/cad/render.ts
    </read_first>
    <action>
      Create `src/cad/curveGeometry.ts` with exported helpers:
      - `sampleEllipsePoints(args): CadPoint[]`
      - `sampleSplinePoints(args): CadPoint[]`
      - `dedupeCurvePoints(points: CadPoint[]): CadPoint[]`
      - `curveBounds(points: CadPoint[]): { minX: number; minY: number; maxX: number; maxY: number }`
      Move the existing ellipse and spline sampling logic from `importService.ts` into these helpers without changing the current visible output. Clamp spline samples to a maximum of `480` and ellipse samples to a maximum of `256`.
    </action>
    <acceptance_criteria>
      - `src/cad/curveGeometry.ts` exists.
      - `src/cad/curveGeometry.ts` contains `export function sampleEllipsePoints`.
      - `src/cad/curveGeometry.ts` contains `export function sampleSplinePoints`.
      - `src/cad/io/importService.ts` imports from `../curveGeometry`.
      - `npm run build` exits 0.
      - `npm run test:conversion` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.1.4" type="implementation">
    <read_first>
      - src/cad/io/dxfRoundTrip.ts
      - src/cad/io/roundTripCheck.ts
      - src/cad/types.ts
    </read_first>
    <action>
      Extend the normalized round-trip summary in `src/cad/io/dxfRoundTrip.ts` to include `document.metadata`, entity type counts for all new future entity names, and warning detail keys. The summary must compare `metadata.insUnits`, `metadata.measurement`, `metadata.spaces.model`, and `metadata.spaces.paper` when present.
    </action>
    <acceptance_criteria>
      - `src/cad/io/dxfRoundTrip.ts` contains `metadata`.
      - `src/cad/io/dxfRoundTrip.ts` contains `spaces`.
      - `npm run test:cad-fidelity` exits 0.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run test:cad-fidelity`
- `npm run test:conversion`
</verification>

<success_criteria>
- DXF HEADER metadata is represented in `CadDocument.metadata`.
- Existing DXF import/export behavior remains stable.
- Shared curve sampling helpers are ready for native ellipse/spline entities.
- Round-trip summaries can detect metadata drift.
</success_criteria>

<must_haves>
- Do not change existing JSON file compatibility.
- Do not remove existing approximation warnings until native curve plans replace them.
- Do not allow malformed numeric DXF values to crash import.
</must_haves>

