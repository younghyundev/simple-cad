---
phase: 14-ci-quality-gates
plan: 3
title: Local and CI Reproducibility Documentation
type: documentation
wave: 3
depends_on: [14-01-workflow-foundation, 14-02-ci-artifacts-summaries]
requirements: [CI-01, CI-02, CI-03]
requirements_addressed: [CI-01, CI-02, CI-03]
files_modified:
  - README.md
autonomous: true
estimated: 45min
---

# Plan 14.3: Local and CI Reproducibility Documentation

<objective>
Document how developers run the same quality gates locally and how GitHub Actions reports build, E2E, CAD fidelity, conversion, and performance results.
</objective>

<threat_model>
Documentation only. Avoid telling users to paste secrets into CI or grant broad repository permissions.
</threat_model>

<tasks>
  <task id="14.3.1" type="documentation">
    <read_first>
      - README.md
      - package.json
      - .github/workflows/quality-gates.yml
    </read_first>
    <action>
      Update README verification section to include:
      - `npm run verify` as the local one-command quality gate.
      - Node `22` or Node `20.19+` as the expected runtime because Vite requires it.
      - `npx playwright install --with-deps` for CI/Linux browser dependency setup.
      - List of checks covered by CI: build, E2E, CAD fidelity, performance, conversion regression.
    </action>
    <acceptance_criteria>
      - `README.md` contains `npm run verify`.
      - `README.md` contains `Node 22`.
      - `README.md` contains `npx playwright install --with-deps`.
      - `README.md` contains `GitHub Actions`.
    </acceptance_criteria>
  </task>

  <task id="14.3.2" type="documentation">
    <read_first>
      - README.md
      - .planning/phases/14-ci-quality-gates/14-RESEARCH.md
    </read_first>
    <action>
      Add a short CI artifacts note to README explaining that GitHub Actions uploads:
      - `quality-gate-logs`
      - `playwright-report`
      - `playwright-test-results`
      Also state that the job summary includes the quality gate checklist.
    </action>
    <acceptance_criteria>
      - `README.md` contains `quality-gate-logs`.
      - `README.md` contains `playwright-report`.
      - `README.md` contains `playwright-test-results`.
      - `README.md` contains `job summary`.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run verify`
</verification>

<success_criteria>
- Developers can reproduce CI locally with one command.
- README explains Node/Playwright prerequisites.
- README explains where to find CI logs, reports, and summaries.
</success_criteria>

<must_haves>
- Do not remove existing README feature documentation.
- Keep CI setup text concise and operational.
</must_haves>

