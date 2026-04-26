---
phase: 08-file-fidelity-hardening
plan: 2
type: execute
wave: 2
depends_on: [08-01-dxf-round-trip-fixtures]
files_modified:
  - src/cad/types.ts
  - src/cad/io/importService.ts
  - src/cad/io/fileManager.ts
  - src/cad/io/conversionWarnings.ts
  - src/ui/App.tsx
  - src/styles.css
autonomous: true
requirements: [FID-02, FID-03]
---

<objective>
Make conversion warnings structured, grouped, and understandable in the existing right properties panel.
</objective>

<tasks>
  <task id="08-02-01" type="execute">
    <title>Extend warning metadata additively</title>
    <read_first>
      <file>src/cad/types.ts</file>
      <file>src/cad/io/importService.ts</file>
      <file>src/cad/io/fileManager.ts</file>
    </read_first>
    <files>
      <file action="modify">src/cad/types.ts</file>
      <file action="modify">src/cad/io/importService.ts</file>
      <file action="modify">src/cad/io/fileManager.ts</file>
    </files>
    <action>
      Extend `CadWarning` with optional severity, category, sourceType, and details fields. Update existing warning producers to classify approximated curves, imported dimensions, exploded inserts, unsupported entities, conversion API warnings, and mock conversion warnings.
    </action>
    <acceptance_criteria>
      <item>Existing code that only reads `code` and `message` still compiles.</item>
      <item>Known Phase 8 warning types are categorized as approximated, unsupported, conversion, or mock.</item>
      <item>User-facing warning text remains Korean.</item>
    </acceptance_criteria>
  </task>

  <task id="08-02-02" type="execute">
    <title>Create conversion warning grouping helper</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/cad/types.ts</file>
      <file>.planning/phases/08-file-fidelity-hardening/08-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="create">src/cad/io/conversionWarnings.ts</file>
      <file action="modify">src/ui/App.tsx</file>
    </files>
    <action>
      Move warning grouping out of `App.tsx` into a pure helper that returns summary counts and grouped warning rows. Preserve the existing grouped-by-code behavior while adding severity/category/source metadata for display.
    </action>
    <acceptance_criteria>
      <item>`App.tsx` no longer manually builds the warning grouping map inline.</item>
      <item>Helper returns total, approximated, unsupported, conversion, and mock counts.</item>
      <item>Helper handles missing `importWarnings` and empty arrays.</item>
    </acceptance_criteria>
  </task>

  <task id="08-02-03" type="execute">
    <title>Update conversion status UI</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>src/styles.css</file>
      <file>.planning/phases/08-file-fidelity-hardening/08-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
      <file action="modify">src/styles.css</file>
    </files>
    <action>
      Render a compact conversion status summary in the right panel before grouped warning rows. Show warning category counts and mock/server mode labels when available. Keep rows dense, Korean, and non-overflowing.
    </action>
    <acceptance_criteria>
      <item>Empty state remains compact when no warnings exist.</item>
      <item>Repeated warnings show grouped counts.</item>
      <item>Mock conversion state is visible as text, not tooltip-only or color-only.</item>
      <item>Right panel layout remains stable on the current desktop layout.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Import the DXF fixture and confirm grouped warnings render in Korean.
- Run DWG mock import and confirm mock mode is visible in the conversion panel.
</verification>

<success_criteria>
- Users can distinguish preserved/approximated/unsupported/mock conversion outcomes.
- Warning grouping is implemented as a testable pure helper.
- UI follows the approved Phase 8 UI-SPEC.
</success_criteria>

<threat_model>
Warnings can contain messages from conversion APIs. Treat them as plain React text only; never render API-provided warning text as HTML.
</threat_model>
