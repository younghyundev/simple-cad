# Phase 14 Patterns

**Created:** 2026-04-26

## Existing Patterns To Follow

### Package Scripts

`package.json` already owns verification commands. Phase 14 should avoid duplicating long command strings in docs and workflows where a package script is clearer.

Current scripts:

- `build`
- `test:e2e`
- `test:performance`
- `test:conversion`
- `test:cad-fidelity`

Recommended additive script:

- `verify`: run build, CAD fidelity, conversion regression, performance baseline, and E2E in a single local command.

### Playwright Config

`playwright.config.ts` already:

- uses `tests/e2e`
- runs Chromium
- starts Vite on `127.0.0.1:5173`
- disables server reuse on CI
- records trace on first retry

Phase 14 should add `workers: process.env.CI ? 1 : undefined` and optionally an HTML reporter for CI artifacts while preserving list output.

### GitHub Workflow Location

Create `.github/workflows/quality-gates.yml`.

Use one required job name:

- `quality-gates`

This gives branch protection one stable check name.

### Artifact Strategy

Capture CLI command output into files under `artifacts/quality-gates/`:

- `build.log`
- `cad-fidelity.log`
- `conversion.log`
- `performance.log`
- `e2e.log`

Upload:

- `artifacts/quality-gates/`
- `playwright-report/`
- `test-results/`

## Files Likely Modified

- `package.json`
- `playwright.config.ts`
- `README.md`

## Files Likely Created

- `.github/workflows/quality-gates.yml`

## Constraints

- Use `npm ci`, not `npm install`, in CI.
- Pin CI Node to a Vite-compatible version, preferably `22`.
- Do not include `.planning/` in public workflow artifacts.
- Keep workflow names stable for future branch protection.

