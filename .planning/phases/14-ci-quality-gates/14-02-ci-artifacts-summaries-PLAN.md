---
phase: 14-ci-quality-gates
plan: 2
title: CI Logs Artifacts and Job Summary
type: implementation
wave: 2
depends_on: [14-01-workflow-foundation]
requirements: [CI-02]
requirements_addressed: [CI-02]
files_modified:
  - .github/workflows/quality-gates.yml
  - playwright.config.ts
autonomous: true
estimated: 75min
---

# Plan 14.2: CI Logs, Artifacts, and Job Summary

<objective>
Make CI failures diagnosable by preserving Playwright reports, traces, and command logs, and by appending concise verification results to the GitHub job summary.
</objective>

<threat_model>
Artifacts can expose repository output, so upload only generated test/build logs and Playwright reports. Do not upload environment dumps, `.planning/`, `.git/`, node_modules, or secret-bearing files.
</threat_model>

<tasks>
  <task id="14.2.1" type="implementation">
    <read_first>
      - playwright.config.ts
      - .planning/phases/14-ci-quality-gates/14-RESEARCH.md
    </read_first>
    <action>
      Update `playwright.config.ts` for CI stability and artifacts:
      - add `workers: process.env.CI ? 1 : undefined`
      - use reporter `process.env.CI ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list'`
      - keep `trace: 'on-first-retry'`
      - keep `reuseExistingServer: !process.env.CI`
    </action>
    <acceptance_criteria>
      - `playwright.config.ts` contains `workers: process.env.CI ? 1 : undefined`.
      - `playwright.config.ts` contains `playwright-report`.
      - `playwright.config.ts` still contains `trace: 'on-first-retry'`.
      - `npm run test:e2e` exits 0.
    </acceptance_criteria>
  </task>

  <task id="14.2.2" type="implementation">
    <read_first>
      - .github/workflows/quality-gates.yml
      - package.json
    </read_first>
    <action>
      Update `.github/workflows/quality-gates.yml` so every verification command writes output through `tee` to `artifacts/quality-gates/*.log`. Add a final summary step with `if: always()` that appends a markdown section to `$GITHUB_STEP_SUMMARY` listing the five checks: build, CAD fidelity, conversion regression, performance baseline, Playwright E2E. Add `actions/upload-artifact@v5` with `if: always()` for:
      - `quality-gate-logs` path `artifacts/quality-gates/`
      - `playwright-report` path `playwright-report/`
      - `playwright-test-results` path `test-results/`
      Use `retention-days: 14`.
    </action>
    <acceptance_criteria>
      - Workflow contains `actions/upload-artifact@v5`.
      - Workflow contains `quality-gate-logs`.
      - Workflow contains `playwright-report`.
      - Workflow contains `test-results`.
      - Workflow contains `GITHUB_STEP_SUMMARY`.
      - Workflow contains `retention-days: 14`.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run test:e2e`
- `npm run verify`
</verification>

<success_criteria>
- CI preserves logs for all verification commands.
- CI uploads Playwright HTML report and trace/test-result files when available.
- The GitHub job summary shows which quality gates ran.
</success_criteria>

<must_haves>
- Do not upload `.planning/`.
- Do not upload `node_modules`.
- Keep artifact upload non-blocking for missing optional report paths.
</must_haves>

