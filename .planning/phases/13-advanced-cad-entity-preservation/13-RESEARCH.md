# Phase 13 Research: Advanced CAD Entity Preservation

**Date:** 2026-04-26
**Status:** Ready for planning

## Research Question

What needs to be known to plan Phase 13 well?

## Official and Primary Source Findings

Autodesk's DXF entity reference lists the target entity families for this phase in the ENTITIES section: `ELLIPSE`, `SPLINE`, `HATCH`, `INSERT`, `LEADER`, `MLEADER`, `ATTRIB`, and `ATTDEF`. This confirms these are normal DXF graphical/entity records rather than external side-channel data.

ezdxf documents `ELLIPSE` as a curve defined by center, major-axis vector, extrusion, ratio, start parameter, and end parameter. It also exposes flattening helpers, which supports a two-track SimpleCAD strategy: preserve editable ellipse parameters when the entity is planar, and generate sampled fallback points when export/render code cannot consume the native entity yet.

ezdxf documents `SPLINE` as a 3D curve defined by control points, knot values, and weights. It also notes fit-point-only splines can exist. SimpleCAD already evaluates rational B-splines when enough knot data is present, but it stores the result as a polyline. Phase 13 should keep the curve definition in the native model for round-trip/editing while still producing sampled points for rendering, hit-testing, bounds, SVG, and compatibility export.

ezdxf documents `HATCH` as a fill over boundary paths. Boundary paths can be polyline paths or edge paths made from line, arc, ellipse, and spline edges. Pattern and gradient data are richer than SimpleCAD's current fill model, so Phase 13 should preserve solid-fill hatches as editable hatch-like entities when boundary extraction is possible, and otherwise classify pattern/gradient/unsupported portions with structured warnings.

HATCH default scaling is affected by `$MEASUREMENT`, and drawing units are commonly represented through header variables such as `$INSUNITS`. This phase should parse relevant HEADER metadata instead of assuming all DXF imports are millimeters.

## Existing Architecture

- `src/cad/types.ts` defines the internal `CadDocument` and `CadEntity` union.
- `src/cad/io/importService.ts` parses DXF pairs and currently maps:
  - `LINE`, `CIRCLE`, `ARC`, `TEXT`, `MTEXT`, `LWPOLYLINE`, `DIMENSION`
  - `ELLIPSE` and `SPLINE` into approximated `polyline`
  - `INSERT` into exploded block entities with a conversion warning
- `src/cad/io/exportService.ts` exports existing entity types to SVG and DXF.
- `src/cad/render.ts`, `src/cad/entityGeometry.ts`, `src/cad/snap.ts`, `src/cad/entityTransform.ts`, and `src/cad/clipboard.ts` each switch on `CadEntity.type`.
- `src/cad/io/dxfRoundTrip.ts` compares normalized document summaries for regression checks.
- `src/cad/io/conversionWarnings.ts` already groups structured warning categories.

## Recommended Model Additions

Add native editable entities where the app can render, select, move, copy, and export them predictably:

- `EllipseEntity`
  - `type: 'ellipse'`
  - `cx`, `cy`
  - `majorAxis: CadPoint`
  - `ratio`
  - `startParam`, `endParam`
  - optional `closed`
- `SplineEntity`
  - `type: 'spline'`
  - `degree`
  - `controlPoints`
  - `fitPoints?`
  - `knots?`
  - `weights?`
  - `closed?`
- `HatchEntity`
  - `type: 'hatch'`
  - `boundary: CadPoint[][]`
  - `fillKind: 'solid' | 'pattern' | 'gradient' | 'unsupported'`
  - `patternName?`, `patternScale?`, `patternAngle?`

Avoid native `leader` and `attribute` entities in this phase unless they become edit targets. Lower-risk preservation:

- `LEADER`/`MLEADER`: import visible leader geometry as `polyline` plus a warning with source type and feature details.
- `ATTRIB`/`ATTDEF`: import as `text` when text point/content are available; attach warning details with tag/prompt where possible.
- `INSERT`: continue exploding into editable children, but retain block name, insert transform, attribute count, nested depth, and unsupported child count in warning/details.

## Metadata Additions

Extend `CadDocument` with additive optional metadata:

```ts
metadata?: {
  dxfVersion?: string;
  insUnits?: string;
  measurement?: 'metric' | 'imperial' | 'unknown';
  extents?: { min: CadPoint; max: CadPoint };
  spaces?: { model: number; paper: number };
};
```

Keep `units` as the existing UI-facing unit field and derive it from `$INSUNITS` only when the value is one of the current supported values: `mm`, `cm`, `m`, `inch`.

## Recommended Phase 13 Shape

1. Document metadata and shared DXF parsing foundation
   - Parse HEADER variables, entity space flags, and stable source metadata.
   - Add geometry sampling helpers for native curve entities.

2. Native curve preservation
   - Add `ellipse` and `spline` entity types.
   - Render/select/snap/transform/export/import without converting them to polylines first.

3. Additional entity preservation and classification
   - HATCH boundary/fill support.
   - LEADER/MLEADER and ATTRIB/ATTDEF visible fallback.
   - More detailed INSERT/BLOCK warning details.

4. Fixtures, regression checks, and docs
   - Add an advanced DXF fixture.
   - Extend fidelity summaries to include entity types, metadata, warning categories, and source details.
   - Update README support matrix.

## Risks

- Adding native entity types requires updates across render, hit-testing, bounds, transform, snap, clipboard, JSON, SVG, DXF export, and regression summaries.
- SPLINE exact export is only safe when the original degree/control/knots/weights are valid; otherwise export sampled LWPOLYLINE with an approximation warning.
- HATCH pattern/gradient semantics are richer than SimpleCAD's UI, so pattern details should be preserved in metadata/warnings even if visual rendering starts with solid fill or outline fallback.
- Paper/model space metadata should not silently hide paper-space entities unless the UI explicitly supports space switching.

## Sources

- Autodesk DXF ENTITIES section: https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-7D07C886-FD1D-4A0C-A7AB-B4D21F18E484.htm
- ezdxf entity index: https://ezdxf.readthedocs.io/en/stable/dxfentities/index.html
- ezdxf Ellipse entity: https://ezdxf.readthedocs.io/en/stable/dxfentities/ellipse.html
- ezdxf Spline entity: https://ezdxf.readthedocs.io/en/stable/dxfentities/spline.html
- ezdxf Hatch entity: https://ezdxf.readthedocs.io/en/stable/dxfentities/hatch.html
- ezdxf Hatch tutorial: https://ezdxf.readthedocs.io/en/stable/tutorials/hatch.html

