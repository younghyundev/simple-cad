---
phase: 08-file-fidelity-hardening
plan: 3
type: execute
wave: 3
depends_on: [08-02-structured-warning-ui]
files_modified:
  - src/cad/io/conversionApiClient.ts
  - src/cad/io/fileManager.ts
  - src/cad/types.ts
  - vite.config.ts
  - docs/cad-conversion-api.md
  - README.md
autonomous: true
requirements: [FID-05]
---

<objective>
Make DWG mock versus production conversion mode explicit in code, API responses, documentation, and user-visible warning metadata.
</objective>

<tasks>
  <task id="08-03-01" type="execute">
    <title>Add conversion mode metadata</title>
    <read_first>
      <file>src/cad/io/conversionApiClient.ts</file>
      <file>src/cad/io/fileManager.ts</file>
      <file>src/cad/types.ts</file>
    </read_first>
    <files>
      <file action="modify">src/cad/io/conversionApiClient.ts</file>
      <file action="modify">src/cad/io/fileManager.ts</file>
      <file action="modify">src/cad/types.ts</file>
    </files>
    <action>
      Add conversion mode metadata for `mock` and `server` responses. Use it to annotate imported documents and conversion warnings without breaking existing file open/save behavior.
    </action>
    <acceptance_criteria>
      <item>Conversion responses can carry mode metadata.</item>
      <item>FileManager preserves mode metadata on imported DWG documents.</item>
      <item>Mode metadata is available to warning grouping/UI from Plan 2.</item>
    </acceptance_criteria>
  </task>

  <task id="08-03-02" type="execute">
    <title>Separate mock and production configuration</title>
    <read_first>
      <file>vite.config.ts</file>
      <file>src/cad/io/conversionApiClient.ts</file>
      <file>docs/cad-conversion-api.md</file>
    </read_first>
    <files>
      <file action="modify">vite.config.ts</file>
      <file action="modify">src/cad/io/conversionApiClient.ts</file>
      <file action="modify">docs/cad-conversion-api.md</file>
    </files>
    <action>
      Make development mock responses explicitly return mock mode. Document how production conversion should be configured and how the app distinguishes production server responses from Vite mock responses.
    </action>
    <acceptance_criteria>
      <item>Vite mock import/export/validate responses identify themselves as mock.</item>
      <item>Production contract documents mode fields and expected warnings.</item>
      <item>Error messages do not imply production DWG conversion is active when only mock is configured.</item>
    </acceptance_criteria>
  </task>

  <task id="08-03-03" type="execute">
    <title>Document Phase 8 file fidelity workflow</title>
    <read_first>
      <file>README.md</file>
      <file>docs/cad-conversion-api.md</file>
      <file>package.json</file>
    </read_first>
    <files>
      <file action="modify">README.md</file>
      <file action="modify">docs/cad-conversion-api.md</file>
    </files>
    <action>
      Update documentation with the new fidelity check command, fixture purpose, warning categories, and DWG mock/production distinction.
    </action>
    <acceptance_criteria>
      <item>README explains how to run the fidelity check.</item>
      <item>Docs explain mock mode and production mode without overstating DWG support.</item>
      <item>Documentation remains concise and project-specific.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run test:cad-fidelity`.
- Run `npm run build`.
- Start dev server and perform a mock DWG import to confirm mode labeling.
- Review docs for accurate mock/production wording.
</verification>

<success_criteria>
- DWG conversion mode is explicit to code and users.
- Production conversion API expectations are documented.
- Mock mode cannot be mistaken for real DWG conversion.
</success_criteria>

<threat_model>
Production conversion URLs and backend configuration may come from environment variables later. Do not log secrets or embed private URLs in committed docs or UI messages.
</threat_model>
