---
phase: 13-advanced-cad-entity-preservation
plan: 4
title: Advanced Entity Fixtures Documentation and Verification
type: verification
wave: 3
depends_on: [13-02-native-curve-preservation, 13-03-advanced-entity-classification]
requirements: [CAD-01, CAD-02, CAD-03, CAD-04]
requirements_addressed: [CAD-01, CAD-02, CAD-03, CAD-04]
files_modified:
  - src/cad/io/fixtures/fidelity-advanced-entities.dxf
  - src/cad/io/roundTripCheck.ts
  - src/cad/io/conversionRegressionCheck.ts
  - src/cad/io/dxfRoundTrip.ts
  - README.md
autonomous: true
estimated: 90min
---

# Plan 13.4: Advanced Fixtures, Docs, and Verification

<objective>
Lock Phase 13 behavior with deterministic fixtures, regression checks, and documentation so advanced DXF preservation remains measurable after implementation.
</objective>

<threat_model>
No new runtime security surface. Test fixtures must be local text fixtures and must not execute scripts or fetch external assets. Regression checks must avoid resource-heavy fixture sizes that slow every development loop.
</threat_model>

<tasks>
  <task id="13.4.1" type="implementation">
    <read_first>
      - src/cad/io/fixtures/fidelity-basic.dxf
      - src/cad/io/roundTripCheck.ts
      - src/cad/io/dxfRoundTrip.ts
    </read_first>
    <action>
      Add `src/cad/io/fixtures/fidelity-advanced-entities.dxf`. The fixture must include HEADER values `$ACADVER`, `$INSUNITS`, `$MEASUREMENT`, `$EXTMIN`, `$EXTMAX`; one `ELLIPSE`; one `SPLINE`; one `HATCH`; one `LEADER` or `MLEADER`; one `ATTDEF` or `ATTRIB`; and one `INSERT` referencing a block. Keep it small enough for `npm run test:cad-fidelity` to finish under the current performance expectations.
    </action>
    <acceptance_criteria>
      - `src/cad/io/fixtures/fidelity-advanced-entities.dxf` exists.
      - Fixture contains `ELLIPSE`.
      - Fixture contains `SPLINE`.
      - Fixture contains `HATCH`.
      - Fixture contains `$INSUNITS`.
      - Fixture contains `INSERT`.
    </acceptance_criteria>
  </task>

  <task id="13.4.2" type="implementation">
    <read_first>
      - src/cad/io/roundTripCheck.ts
      - src/cad/io/dxfRoundTrip.ts
      - src/cad/io/importService.ts
    </read_first>
    <action>
      Update `roundTripCheck.ts` to run both `fidelity-basic.dxf` and `fidelity-advanced-entities.dxf`. Assert the advanced fixture import includes native `ellipse`, native `spline`, hatch preservation or explicit hatch unsupported warning, metadata units/extents, and warning categories `preserved` and `approximated` when applicable.
    </action>
    <acceptance_criteria>
      - `src/cad/io/roundTripCheck.ts` contains `fidelity-advanced-entities.dxf`.
      - `src/cad/io/roundTripCheck.ts` checks `ellipse`.
      - `src/cad/io/roundTripCheck.ts` checks `spline`.
      - `src/cad/io/roundTripCheck.ts` checks `metadata`.
      - `npm run test:cad-fidelity` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.4.3" type="implementation">
    <read_first>
      - src/cad/io/conversionRegressionCheck.ts
      - src/cad/io/conversionWarnings.ts
      - src/cad/types.ts
    </read_first>
    <action>
      Extend conversion regression checks for unsupported or partially supported advanced entities. Include at least one malformed `SPLINE`, one `HATCH` without usable boundary, and one nested `INSERT` depth edge case. Assert each produces a structured warning or unsupported entity with the expected code/category rather than silently dropping data.
    </action>
    <acceptance_criteria>
      - `src/cad/io/conversionRegressionCheck.ts` contains `DXF_HATCH_UNSUPPORTED`.
      - `src/cad/io/conversionRegressionCheck.ts` contains `INSERT nesting depth exceeded 8`.
      - `src/cad/io/conversionRegressionCheck.ts` contains `DXF_SPLINE`.
      - `npm run test:conversion` exits 0.
    </acceptance_criteria>
  </task>

  <task id="13.4.4" type="implementation">
    <read_first>
      - README.md
      - .planning/phases/13-advanced-cad-entity-preservation/13-RESEARCH.md
    </read_first>
    <action>
      Update README DXF support scope. State that SimpleCAD preserves editable `ELLIPSE` and supported `SPLINE`, imports `HATCH` boundaries/fill when possible, converts visible `LEADER`/`MLEADER` and `ATTRIB`/`ATTDEF` data into editable fallback objects, and reports unsupported advanced details through structured warnings. Keep the DWG limitation text unchanged except where it references advanced entity preservation through the server contract.
    </action>
    <acceptance_criteria>
      - `README.md` contains `ELLIPSE`.
      - `README.md` contains `SPLINE`.
      - `README.md` contains `HATCH`.
      - `README.md` contains `LEADER`.
      - `README.md` contains `ATTRIB`.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run test:cad-fidelity`
- `npm run test:conversion`
- `npm run test:performance`
- `npm run test:e2e`
</verification>

<success_criteria>
- Advanced DXF behavior is covered by a dedicated fixture.
- Regression scripts fail if advanced entities silently disappear.
- README accurately describes supported, approximated, and unsupported advanced DXF behavior.
- Full local verification passes.
</success_criteria>

<must_haves>
- Preserve the existing basic fidelity fixture.
- Keep test output concise and actionable.
- Do not document full DWG fidelity unless a production server supplies it.
</must_haves>

