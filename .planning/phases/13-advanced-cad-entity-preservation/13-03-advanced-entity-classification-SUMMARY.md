---
phase: 13
plan: 13-03-advanced-entity-classification
subsystem: cad-io
tags: [hatch, leader, attrib, insert]
key-files:
  - src/cad/types.ts
  - src/cad/render.ts
  - src/cad/entityGeometry.ts
  - src/cad/entityTransform.ts
  - src/cad/snap.ts
  - src/cad/io/importService.ts
  - src/cad/io/exportService.ts
---

# Plan 13.3 Summary: Advanced Entity Classification and Preservation

## Completed

- Added `HatchEntity` with boundary paths and fill kind metadata.
- Imported usable DXF `HATCH` boundaries as hatch entities and classified pattern simplification explicitly.
- Imported `LEADER`/`MLEADER` visible geometry as polyline fallbacks.
- Imported `ATTRIB`/`ATTDEF` text as editable text fallbacks with tag/prompt details.
- Expanded `INSERT`/`BLOCK` warnings with block name, entity count, nested depth, attribute count, and unsupported child count.
- Added a nested INSERT depth guard at depth `8`.

## Verification

- `npm run build`
- `npm run test:cad-fidelity`
- `npm run test:conversion`
- `npm run test:e2e`

## Self-Check

PASSED

