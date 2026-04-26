---
phase: 10-save-workflow-and-file-state
plan: 4
type: execute
wave: 4
depends_on: [10-03-file-system-access-api]
files_modified:
  - src/ui/App.tsx
  - src/styles.css
  - README.md
autonomous: true
requirements: [SAVE-01, SAVE-04]
---

<objective>
Add unsaved-change safeguards for tab close and browser unload, then finalize documentation and phase-level regression checks.
</objective>

<tasks>
  <task id="10-04-01" type="execute">
    <title>Warn before closing dirty tabs</title>
    <read_first>
      <file>src/ui/App.tsx</file>
      <file>.planning/phases/10-save-workflow-and-file-state/10-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
    </files>
    <action>
      Update tab close behavior to confirm before closing a dirty tab. Keep clean tab close immediate. Preserve existing fallback tab activation behavior.
    </action>
    <acceptance_criteria>
      <item>Dirty tab close shows Korean confirmation text.</item>
      <item>Cancel keeps the tab and document state intact.</item>
      <item>Clean tab close behavior remains immediate.</item>
    </acceptance_criteria>
  </task>

  <task id="10-04-02" type="execute">
    <title>Warn before browser reload or close</title>
    <read_first>
      <file>src/ui/App.tsx</file>
    </read_first>
    <files>
      <file action="modify">src/ui/App.tsx</file>
    </files>
    <action>
      Add `beforeunload` handling whenever any open tab or current document has unsaved changes. Remove the handler when all tabs are clean.
    </action>
    <acceptance_criteria>
      <item>beforeunload is active only while unsaved changes exist.</item>
      <item>Browser-controlled warning appears on reload/close attempts.</item>
      <item>No custom unload text is relied upon for correctness.</item>
    </acceptance_criteria>
  </task>

  <task id="10-04-03" type="execute">
    <title>Final polish, docs, and regression</title>
    <read_first>
      <file>README.md</file>
      <file>src/styles.css</file>
      <file>.planning/phases/10-save-workflow-and-file-state/10-UI-SPEC.md</file>
    </read_first>
    <files>
      <file action="modify">README.md</file>
      <file action="modify">src/styles.css</file>
    </files>
    <action>
      Polish save-state labels/markers, update README with dirty-state and warning behavior, and run final regression checks.
    </action>
    <acceptance_criteria>
      <item>README mentions dirty state, Save/Save As, direct-save support, and unsaved-change warnings.</item>
      <item>`npm run build` passes.</item>
      <item>`npm run test:cad-fidelity` passes.</item>
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Run `npm run test:cad-fidelity`.
- Start dev server and verify:
  - dirty tab close prompts
  - clean tab close does not prompt
  - reload warning activates when dirty
  - statusbar and tab marker update after save
</verification>

<success_criteria>
- Users are warned before losing unsaved tab/browser work.
- Save-state UI remains compact and clear.
- Phase 10 docs match implemented behavior.
</success_criteria>

<threat_model>
Warning guards must not trap users unnecessarily. Only prompt when dirty state is true and keep native browser unload behavior.
</threat_model>
