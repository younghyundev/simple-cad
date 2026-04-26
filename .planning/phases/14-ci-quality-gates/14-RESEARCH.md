# Phase 14 Research: CI Quality Gates

**Date:** 2026-04-26
**Status:** Ready for planning

## Research Question

What needs to be known to plan Phase 14 well?

## Official Source Findings

GitHub's official `actions/setup-node` repository currently documents `actions/setup-node@v6` and recommends specifying a Node version instead of relying on the runner default. It supports npm caching through `cache: npm` and `cache-dependency-path`.

The Playwright official CI guide recommends:

- `npm ci`
- `npx playwright install --with-deps`
- `npx playwright test`
- `workers: process.env.CI ? 1 : undefined` for stability
- uploading `playwright-report/` as an artifact when tests finish

The SimpleCAD repo already has:

- `package-lock.json`, so CI should use `npm ci`.
- `playwright.config.ts`, with `fullyParallel: false`, Chromium-only project, trace on first retry, and a Vite web server.
- Existing verification scripts:
  - `npm run build`
  - `npm run test:e2e`
  - `npm run test:cad-fidelity`
  - `npm run test:performance`
  - `npm run test:conversion`

Vite currently warns on local Node `20.18.1` because this Vite version requires Node `20.19+` or `22.12+`. CI should pin Node `22` or a specific compatible Node version to avoid the warning and future breakage.

## Recommended Phase 14 Shape

1. CI workflow foundation
   - Add `.github/workflows/quality-gates.yml`.
   - Trigger on push/pull_request to `main`.
   - Use `actions/checkout@v6`, `actions/setup-node@v6`, `npm ci`, and Playwright install with deps.

2. Quality gate command layout
   - Run build and fast CLI checks in a deterministic order.
   - Run Playwright after browser install.
   - Add a single local aggregate script such as `npm run verify`.

3. Artifacts and summaries
   - Upload Playwright report/test results on failure or completion.
   - Capture CAD fidelity, conversion, and performance logs to files and append key outputs to `$GITHUB_STEP_SUMMARY`.

4. Documentation
   - Update README with local verification and CI behavior.
   - Document Node version expectation and Playwright browser install.

## Risks

- Installing Playwright browsers on every CI run adds time, but official docs do not recommend browser binary caching for Linux runners.
- Running all checks in one job is simple and good for branch protection, but slower than splitting jobs. The phase can start with one required `quality-gates` job and split later if runtime becomes a problem.
- E2E can be flaky if run in parallel with resource-heavy checks, so run it after CLI checks and with CI workers pinned to 1.

## Sources

- GitHub `actions/setup-node`: https://github.com/actions/setup-node
- Playwright Continuous Integration: https://playwright.dev/docs/ci

