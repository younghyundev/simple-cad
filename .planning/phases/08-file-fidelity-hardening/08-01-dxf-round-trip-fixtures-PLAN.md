---
phase: 08-file-fidelity-hardening
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/cad/io/importService.ts
  - src/cad/io/exportService.ts
  - src/cad/io/dxfRoundTrip.ts
  - src/cad/io/fixtures/fidelity-basic.dxf
  - src/cad/io/roundTripCheck.ts
  - package.json
autonomous: true
requirements: [FID-01, FID-02, FID-04]
---

<objective>
Add a small DXF round-trip fixture and deterministic comparison helper so Phase 8 file fidelity can be verified without manual visual inspection only.
</objective>

<tasks>
  <task id="08-01-01" type="execute">
    <title>Create DXF fidelity fixture</title>
    <read_first>
      <file>src/cad/io/importService.ts</file>
      <file>src/cad/io/exportService.ts</file>
      <file>.planning/phases/08-file-fidelity-hardening/08-RESEARCH.md</file>
    </read_first>
    <files>
      <file action="create">src/cad/io/fixtures/fidelity-basic.dxf</file>
    </files>
    <action>
      Create a compact ASCII DXF fixture that covers LINE, CIRCLE, ARC, LWPOLYLINE with bulge, TEXT/MTEXT, DIMENSION-like data if supported by current importer, and a simple INSERT/BLOCK case if feasible. Keep it readable and small.
    </action>
    <acceptance_criteria>
      <item>Fixture is source-controlled and does not depend on generated dist output.</item>
      <item>Fixture imports through the existing ImportService without throwing.</item>
      <item>Fixture produces at least one approximation warning so warning paths are exercised.</item>
    </acceptance_criteria>
  </task>

  <task id="08-01-02" type="execute">
    <title>Add round-trip summary comparison helper</title>
    <read_first>
      <file>src/cad/types.ts</file>
      <file>src/cad/io/importService.ts</file>
      <file>src/cad/io/exportService.ts</file>
    </read_first>
    <files>
      <file action="create">src/cad/io/dxfRoundTrip.ts</file>
    </files>
    <action>
      Add helper functions that normalize imported/exported CadDocument data into comparable summaries. Compare user-visible properties such as entity type counts, approximate bounds, layer ids/colors, stroke style/width, text content, dimensions, warning codes, and unsupported entity counts.
    </action>
    <acceptance_criteria>
      <item>Comparison avoids random entity ids and timestamp fields.</item>
      <item>Comparison tolerates small floating point differences.</item>
      <item>Helper is React-free and can be called from a Node/TypeScript verification script.</item>
    </acceptance_criteria>
  </task>

  <task id="08-01-03" type="execute">
    <title>Add round-trip verification script</title>
    <read_first>
      <file>package.json</file>
      <file>tsconfig.json</file>
      <file>src/cad/io/fileManager.ts</file>
    </read_first>
    <files>
      <file action="create">src/cad/io/roundTripCheck.ts</file>
      <file action="modify">package.json</file>
    </files>
    <action>
      Add an npm script, for example `test:cad-fidelity`, that imports the fixture, exports it to DXF, re-imports the exported DXF, and fails if normalized summaries drift beyond accepted tolerances.
    </action>
    <acceptance_criteria>
      <item>`npm run test:cad-fidelity` exits 0 on the new fixture.</item>
      <item>Failure output identifies the drift category in plain text.</item>
      <item>`npm run build` still exits 0.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run test:cad-fidelity`.
- Run `npm run build`.
- Confirm fixture warning counts include at least one approximated entity warning.
</verification>

<success_criteria>
- Phase 8 has a repeatable DXF round-trip fidelity check.
- The check covers geometry, layers, styles, text, warnings, and unsupported entity counts at summary level.
- No React UI code is required to run the fidelity check.
</success_criteria>

<threat_model>
No sensitive data or network input is introduced. Main risk is maliciously large fixture parsing during tests; keep committed fixtures small and avoid arbitrary file path inputs in the script.
</threat_model>
