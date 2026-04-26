---
phase: 13-advanced-cad-entity-preservation
plan: 2
title: Native SPLINE and ELLIPSE Preservation
type: implementation
wave: 2
depends_on: [13-01-dxf-metadata-curve-foundation]
requirements: [CAD-01]
requirements_addressed: [CAD-01]
files_modified:
  - src/cad/types.ts
  - src/cad/render.ts
  - src/cad/entityGeometry.ts
  - src/cad/entityTransform.ts
  - src/cad/snap.ts
  - src/cad/clipboard.ts
  - src/cad/io/importService.ts
  - src/cad/io/exportService.ts
autonomous: true
estimated: 120min
---

# Plan 13.2: Native SPLINE and ELLIPSE Preservation

<objective>
Preserve supported DXF `SPLINE` and `ELLIPSE` entities as native editable SimpleCAD entities while retaining sampled fallback geometry for rendering, hit testing, snap, SVG, DXF export, and regression checks.
</objective>

<threat_model>
No external input leaves the browser. Malicious or malformed DXF can provide huge control point arrays, invalid knots, zero-length axes, or non-finite values. Clamp sampling, filter non-finite points, cap control/fit point preservation to reasonable arrays, and classify invalid curves as unsupported warnings rather than throwing.
</threat_model>

<tasks>
  <task id="13.2.1" type="implementation">
    <read_first>
      - src/cad/types.ts
      - src/cad/curveGeometry.ts
    </read_first>
    <action>
      Add native entity types in `src/cad/types.ts`:
      - `EllipseEntity` with `type: 'ellipse'`, `cx`, `cy`, `majorAxis: CadPoint`, `ratio`, `startParam`, `endParam`
      - `SplineEntity` with `type: 'spline'`, `degree`, `controlPoints: CadPoint[]`, `fitPoints?: CadPoint[]`, `knots?: number[]`, `weights?: number[]`, `closed?: boolean`
      Add both to the `CadEntity` union.
    </action>
    <acceptance_criteria>
      - `src/cad/types.ts` contains `export type EllipseEntity`.
      - `src/cad/types.ts` contains `export type SplineEntity`.
      - `src/cad/types.ts` contains `| EllipseEntity`.
      - `src/cad/types.ts` contains `| SplineEntity`.
    </acceptance_criteria>
  </task>

  <task id="13.2.2" type="implementation">
    <read_first>
      - src/cad/render.ts
      - src/cad/entityGeometry.ts
      - src/cad/curveGeometry.ts
    </read_first>
    <action>
      Render `ellipse` and `spline` entities using sampled points from `curveGeometry.ts`. Update entity bounds and hit testing so native curves use sampled visible geometry with the same tolerance policy as `polyline`. Do not increase default stroke width. Ensure curve hit-testing returns true only near the visible stroke, not inside the full bounding box.
    </action>
    <acceptance_criteria>
      - `src/cad/render.ts` handles `entity.type === 'ellipse'`.
      - `src/cad/render.ts` handles `entity.type === 'spline'`.
      - `src/cad/entityGeometry.ts` handles `entity.type === 'ellipse'`.
      - `src/cad/entityGeometry.ts` handles `entity.type === 'spline'`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.2.3" type="implementation">
    <read_first>
      - src/cad/entityTransform.ts
      - src/cad/snap.ts
      - src/cad/clipboard.ts
      - src/cad/types.ts
    </read_first>
    <action>
      Update move/transform/copy/snap support for `ellipse` and `spline`. Moving an ellipse must offset `cx` and `cy` without changing `majorAxis`, `ratio`, `startParam`, or `endParam`. Moving a spline must offset all `controlPoints` and `fitPoints`. Snapping should expose ellipse center plus sampled endpoints for partial ellipses, and spline sampled endpoints plus control points.
    </action>
    <acceptance_criteria>
      - `src/cad/entityTransform.ts` handles `ellipse`.
      - `src/cad/entityTransform.ts` handles `spline`.
      - `src/cad/snap.ts` handles `ellipse`.
      - `src/cad/snap.ts` handles `spline`.
      - `src/cad/clipboard.ts` requires no special-case data loss for `ellipse` or `spline`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.2.4" type="implementation">
    <read_first>
      - src/cad/io/importService.ts
      - src/cad/io/exportService.ts
      - src/cad/curveGeometry.ts
    </read_first>
    <action>
      Change DXF import for `ELLIPSE` and valid `SPLINE` entities to create native `ellipse` and `spline` entities. Replace the old approximation warnings with preserved warnings:
      - `DXF_ELLIPSE_PRESERVED`, category `preserved`, message `ELLIPSE 엔티티를 편집 가능한 타원으로 보존했습니다.`
      - `DXF_SPLINE_PRESERVED`, category `preserved`, message `SPLINE 엔티티를 편집 가능한 곡선으로 보존했습니다.`
      Keep unsupported warnings when a spline has fewer than two usable points or invalid knot/control data. Export native `ellipse` as DXF `ELLIPSE` when full parameters are available. Export native `spline` as DXF `SPLINE` only when degree/control points are valid; otherwise export sampled `LWPOLYLINE` and add or preserve an approximation warning in the document flow if needed.
    </action>
    <acceptance_criteria>
      - `src/cad/io/importService.ts` contains `DXF_ELLIPSE_PRESERVED`.
      - `src/cad/io/importService.ts` contains `DXF_SPLINE_PRESERVED`.
      - `src/cad/io/exportService.ts` outputs `ELLIPSE`.
      - `src/cad/io/exportService.ts` outputs `SPLINE`.
      - `npm run test:cad-fidelity` exits 0.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run test:cad-fidelity`
- `npm run test:conversion`
- `npm run test:e2e`
</verification>

<success_criteria>
- Supported SPLINE and ELLIPSE imports no longer become plain polyline entities.
- Curves render smoothly without the diagonal corner artifacts previously seen in approximated curves.
- Curves remain selectable, movable, copyable, and exportable.
- Preserved/unsupported warnings are structured and visible.
</success_criteria>

<must_haves>
- Do not widen curve hitboxes beyond visible stroke tolerance.
- Do not break existing line/rect/circle/polyline behavior.
- Keep fallback sampling available for rendering and SVG export.
</must_haves>

