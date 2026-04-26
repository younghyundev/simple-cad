---
phase: 14-ci-quality-gates
plan: 1
title: GitHub Actions Quality Gate Workflow
type: implementation
wave: 1
depends_on: [Phase 11, Phase 13]
requirements: [CI-01, CI-03]
requirements_addressed: [CI-01, CI-03]
files_modified:
  - .github/workflows/quality-gates.yml
  - package.json
autonomous: true
estimated: 60min
---

# Plan 14.1: GitHub Actions Quality Gate Workflow

<objective>
Add the first GitHub Actions workflow that installs dependencies reproducibly and runs the full SimpleCAD verification suite on `main` pushes and pull requests.
</objective>

<threat_model>
CI runs untrusted pull request code, so keep permissions read-only by default and avoid exposing secrets. Do not add deployment, package publishing, or token-authenticated operations in this workflow.
</threat_model>

<tasks>
  <task id="14.1.1" type="implementation">
    <read_first>
      - package.json
      - package-lock.json
      - playwright.config.ts
      - .planning/phases/14-ci-quality-gates/14-RESEARCH.md
    </read_first>
    <action>
      Add a `verify` script to `package.json` that runs these existing scripts in order with `&&`: `npm run build`, `npm run test:cad-fidelity`, `npm run test:conversion`, `npm run test:performance`, `npm run test:e2e`.
    </action>
    <acceptance_criteria>
      - `package.json` contains `"verify":`.
      - `package.json` verify script contains `npm run build`.
      - `package.json` verify script contains `npm run test:e2e`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="14.1.2" type="implementation">
    <read_first>
      - package.json
      - package-lock.json
      - .planning/phases/14-ci-quality-gates/14-PATTERNS.md
    </read_first>
    <action>
      Create `.github/workflows/quality-gates.yml` with:
      - `name: Quality Gates`
      - triggers for `push` and `pull_request` on `main`
      - top-level `permissions: contents: read`
      - one job named `quality-gates` on `ubuntu-latest`
      - `timeout-minutes: 20`
      - `actions/checkout@v6`
      - `actions/setup-node@v6` with `node-version: 22`, `cache: npm`, and `cache-dependency-path: package-lock.json`
      - `npm ci`
      - `npx playwright install --with-deps`
      - separate run steps for build, CAD fidelity, conversion regression, performance baseline, and Playwright E2E.
    </action>
    <acceptance_criteria>
      - `.github/workflows/quality-gates.yml` exists.
      - Workflow contains `actions/checkout@v6`.
      - Workflow contains `actions/setup-node@v6`.
      - Workflow contains `node-version: 22`.
      - Workflow contains `npm ci`.
      - Workflow contains `npx playwright install --with-deps`.
      - Workflow contains `npm run test:cad-fidelity`.
      - Workflow contains `npm run test:conversion`.
      - Workflow contains `npm run test:performance`.
      - Workflow contains `npm run test:e2e`.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run verify`
</verification>

<success_criteria>
- GitHub Actions can run all existing quality gates with a reproducible Node/npm install.
- CI uses a Vite-compatible Node version.
- Workflow permissions remain least-privilege.
</success_criteria>

<must_haves>
- Do not use `npm install` in CI.
- Do not add secrets or write permissions.
- Keep the job name stable as `quality-gates`.
</must_haves>

