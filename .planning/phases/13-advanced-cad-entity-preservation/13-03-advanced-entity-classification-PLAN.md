---
phase: 13-advanced-cad-entity-preservation
plan: 3
title: HATCH LEADER ATTRIB and BLOCK Preservation Classification
type: implementation
wave: 2
depends_on: [13-01-dxf-metadata-curve-foundation]
requirements: [CAD-02, CAD-03]
requirements_addressed: [CAD-02, CAD-03]
files_modified:
  - src/cad/types.ts
  - src/cad/render.ts
  - src/cad/entityGeometry.ts
  - src/cad/entityTransform.ts
  - src/cad/snap.ts
  - src/cad/io/importService.ts
  - src/cad/io/exportService.ts
  - src/cad/io/conversionWarnings.ts
autonomous: true
estimated: 120min
---

# Plan 13.3: Advanced Entity Classification and Preservation

<objective>
Import HATCH, LEADER/MLEADER, ATTRIB/ATTDEF, and richer INSERT/BLOCK details as preserved, approximated, or unsupported results so users can see what survived and what changed.
</objective>

<threat_model>
No backend or secret handling changes. Risks are malformed nested blocks causing recursion loops, very large HATCH boundary arrays causing performance issues, and invisible unsupported data being mistaken as preserved. Mitigate with nested block depth limits, boundary point limits, and explicit warning categories/details.
</threat_model>

<tasks>
  <task id="13.3.1" type="implementation">
    <read_first>
      - src/cad/types.ts
      - src/cad/render.ts
      - src/cad/entityGeometry.ts
      - src/cad/entityTransform.ts
      - src/cad/snap.ts
    </read_first>
    <action>
      Add `HatchEntity` to `src/cad/types.ts` with `type: 'hatch'`, `boundary: CadPoint[][]`, `fillKind: 'solid' | 'pattern' | 'gradient' | 'unsupported'`, `patternName?: string`, `patternScale?: number`, and `patternAngle?: number`. Add render, bounds, hit-test, move, and snap support. Render solid hatches as filled paths. Render pattern/gradient hatches as boundary outline plus fill fallback if a fill color exists.
    </action>
    <acceptance_criteria>
      - `src/cad/types.ts` contains `export type HatchEntity`.
      - `src/cad/render.ts` handles `entity.type === 'hatch'`.
      - `src/cad/entityGeometry.ts` handles `entity.type === 'hatch'`.
      - `src/cad/entityTransform.ts` handles `hatch`.
      - `src/cad/snap.ts` handles `hatch`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.3.2" type="implementation">
    <read_first>
      - src/cad/io/importService.ts
      - src/cad/io/exportService.ts
      - src/cad/types.ts
    </read_first>
    <action>
      Implement DXF `HATCH` import. Support polyline boundary paths first, then edge paths for line and arc edges when parseable. Create `hatch` entities for solid fills and pattern fills with boundary data. Emit:
      - `DXF_HATCH_PRESERVED`, category `preserved`, for imported hatch boundaries
      - `DXF_HATCH_PATTERN_APPROXIMATED`, category `approximated`, when pattern/gradient details are simplified visually
      - `DXF_HATCH_UNSUPPORTED`, category `unsupported`, when no usable boundary exists
      Export `hatch` entities as DXF `HATCH` with at least a polyline boundary path for solid fills.
    </action>
    <acceptance_criteria>
      - `src/cad/io/importService.ts` contains `DXF_HATCH_PRESERVED`.
      - `src/cad/io/importService.ts` contains `DXF_HATCH_PATTERN_APPROXIMATED`.
      - `src/cad/io/exportService.ts` outputs `HATCH`.
      - `npm run test:cad-fidelity` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.3.3" type="implementation">
    <read_first>
      - src/cad/io/importService.ts
      - src/cad/types.ts
      - src/cad/io/conversionWarnings.ts
    </read_first>
    <action>
      Add visible fallback import for `LEADER`, `MLEADER`, `ATTRIB`, and `ATTDEF`. `LEADER` and parseable `MLEADER` geometry should become `polyline` entities with warning code `DXF_LEADER_APPROXIMATED` or `DXF_MLEADER_APPROXIMATED`. `ATTRIB` and `ATTDEF` with text content and insertion point should become `text` entities with warning code `DXF_ATTRIB_PRESERVED` or `DXF_ATTDEF_PRESERVED`. Warning details must include `sourceType` and, when available, `tag`, `prompt`, or `textLength`.
    </action>
    <acceptance_criteria>
      - `src/cad/io/importService.ts` contains `DXF_LEADER_APPROXIMATED`.
      - `src/cad/io/importService.ts` contains `DXF_MLEADER_APPROXIMATED`.
      - `src/cad/io/importService.ts` contains `DXF_ATTRIB_PRESERVED`.
      - `src/cad/io/importService.ts` contains `DXF_ATTDEF_PRESERVED`.
      - `npm run test:conversion` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.3.4" type="implementation">
    <read_first>
      - src/cad/io/importService.ts
      - src/cad/io/conversionWarnings.ts
    </read_first>
    <action>
      Improve `INSERT`/`BLOCK` import details. Track nested insert depth with a hard maximum depth of `8`. Emit `DXF_INSERT_EXPLODED` details with `blockName`, `entityCount`, `nestedDepth`, `attributeCount`, and `unsupportedChildCount`. If nested depth exceeds `8`, add unsupported entity with reason `INSERT nesting depth exceeded 8`.
    </action>
    <acceptance_criteria>
      - `src/cad/io/importService.ts` contains `nestedDepth`.
      - `src/cad/io/importService.ts` contains `attributeCount`.
      - `src/cad/io/importService.ts` contains `unsupportedChildCount`.
      - `src/cad/io/importService.ts` contains `INSERT nesting depth exceeded 8`.
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
- HATCH imports are preserved as hatch entities when boundary data is usable.
- LEADER/MLEADER/ATTRIB/ATTDEF are preserved or approximated with explicit warnings instead of generic unsupported drops.
- INSERT/BLOCK warnings explain block name, depth, attributes, and unsupported children.
- Unsupported advanced details are still visible to the user.
</success_criteria>

<must_haves>
- Do not recurse infinitely through nested INSERT/BLOCK definitions.
- Do not make hatch fills impossible to select or deselect.
- Do not hide unsupported advanced entity data without a warning.
</must_haves>

