# Phase 11: Workflow QA and Performance Baseline - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** Roadmap and current codebase

<domain>
## Phase Boundary

Phase 11 creates automated confidence for the workflows already built in v1.1:

- browser workflow tests for core editing and file flows
- repeatable performance baseline for large drawings
- regression checks for conversion failures and warning visibility

This phase should not add major product features. It should add verification harnesses, fixtures, scripts, and minimal testability hooks only where needed.
</domain>

<decisions>
## Implementation Decisions

### Browser Automation

- Use Playwright for browser-level workflow tests because SimpleCAD is a React/Vite canvas-heavy app and needs pointer, keyboard, download, dialog, and localStorage coverage.
- Keep E2E tests focused on stable user-visible workflows, not implementation details.
- Add stable `data-testid` attributes only for command surfaces and panels that are hard to select semantically.

### Performance Baseline

- Add deterministic large-document fixture generation instead of committing very large binary assets.
- Measure import/model operations and render-facing document scale through CLI scripts first.
- Keep performance thresholds generous enough for local developer machines but strict enough to catch order-of-magnitude regressions.

### Conversion Regression

- Extend existing CAD fidelity checks rather than creating a parallel conversion test runner.
- Cover failed conversion, mock DWG mode, unsupported entities, and warning categorization.

### the agent's Discretion

- Exact fixture sizes, Playwright timeout values, and script names may be adjusted during implementation to keep tests reliable on local machines.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/ROADMAP.md` — Phase 11 scope and dependencies.
- `.planning/REQUIREMENTS.md` — QA-01, QA-02, QA-03 acceptance requirements.
- `.planning/PROJECT.md` — Product constraints and current milestone goal.

### Prior Phase Outputs

- `.planning/phases/08-file-fidelity-hardening/08-VERIFICATION.md` — Existing file fidelity verification baseline.
- `.planning/phases/09-transform-productivity-tools/09-VERIFICATION.md` — Transform workflow behavior to protect.
- `.planning/phases/10-save-workflow-and-file-state/10-VERIFICATION.md` — Save workflow behavior to protect.

### Code Areas

- `src/ui/App.tsx` — App shell, tabs, save, commands, context menu, statusbar.
- `src/ui/CadCanvas.tsx` — Canvas pointer and keyboard workflow surface.
- `src/cad/io/roundTripCheck.ts` — Existing CAD fidelity script.
- `src/cad/io/fileManager.ts` — File open/save orchestration.
- `src/cad/io/conversionApiClient.ts` — DWG/mock/server conversion behavior.
</canonical_refs>

<specifics>
## Specific Ideas

- Add `test:e2e` for Playwright workflow tests.
- Add `test:performance` for a deterministic large drawing baseline.
- Add `test:conversion-errors` or extend `test:cad-fidelity` with explicit failure/warning checks.
- Include at least one workflow that creates geometry, selects/moves it, saves/downloads, imports DXF, and verifies warning UI state.
</specifics>

<deferred>
## Deferred Ideas

- Cross-browser matrix in CI can be deferred until a CI pipeline exists.
- Pixel-perfect canvas visual regression is deferred; this phase should prioritize workflow confidence and performance signals.
</deferred>

---

*Phase: 11-workflow-qa-and-performance-baseline*
*Context gathered: 2026-04-26*
