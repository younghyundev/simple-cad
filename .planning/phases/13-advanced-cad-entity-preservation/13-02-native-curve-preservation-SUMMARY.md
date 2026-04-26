---
phase: 13
plan: 13-02-native-curve-preservation
subsystem: cad-geometry
tags: [spline, ellipse, native-entities]
key-files:
  - src/cad/types.ts
  - src/cad/render.ts
  - src/cad/entityGeometry.ts
  - src/cad/entityTransform.ts
  - src/cad/snap.ts
  - src/cad/io/importService.ts
  - src/cad/io/exportService.ts
---

# Plan 13.2 Summary: Native SPLINE and ELLIPSE Preservation

## Completed

- Added native `EllipseEntity` and `SplineEntity` types to the CAD model.
- Imported DXF `ELLIPSE` and valid `SPLINE` as editable native entities with `preserved` warnings.
- Added render, bounds, hit-test, move, rotate, copy, snap, SVG export, and DXF export support.
- Kept sampled fallback geometry for smooth canvas drawing and compatibility flows.

## Verification

- `npm run build`
- `npm run test:cad-fidelity`
- `npm run test:conversion`
- `npm run test:e2e`

## Self-Check

PASSED

