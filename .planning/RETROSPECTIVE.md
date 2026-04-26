# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.2 — Production CAD Workflow and Collaboration

**Shipped:** 2026-04-26
**Phases:** 4 | **Plans:** 15 | **Sessions:** 1

### What Was Built

- Production DWG conversion API contract with configurable endpoint, timeouts, typed errors, async job polling, status UI, mock scenarios, and documentation.
- Advanced CAD entity preservation for native ELLIPSE/SPLINE, HATCH, LEADER/MLEADER, ATTRIB/ATTDEF, BLOCK/INSERT warning detail, and DXF document metadata.
- GitHub Actions quality gates for build, Playwright E2E, CAD fidelity, conversion regression, and performance baseline.
- localStorage mock collaboration model for server save/open, share links, read-only shared documents, and coordinate/entity review comments.
- Collaboration E2E coverage and README updates for server save, sharing, read-only review, and comments.

### What Worked

- Keeping DWG conversion behind an adapter boundary let UI, tests, and docs improve without requiring a real converter server in the milestone.
- Explicit warning categories made advanced CAD preservation testable instead of relying on visual inspection only.
- The `npm run verify` aggregate command gave a reliable local and CI quality gate.
- Separating collaboration state from `CadDocument.sourceFile` avoided breaking local save/open semantics.

### What Was Inefficient

- Some GSD SDK archive helpers produced weak milestone accomplishments from non-standard summary frontmatter, requiring manual correction.
- The first collaboration E2E cleared localStorage too aggressively and erased the mock share token during navigation.
- Node 20.18.1 repeatedly produced Vite version warnings; CI uses Node 22, but local developer output is noisy until Node is upgraded.

### Patterns Established

- Mock production-facing systems through a replaceable repository/API boundary first, then wire UI and tests against that boundary.
- Keep local file dirty state separate from server/collaboration revision state.
- Use Playwright for canvas-level user workflows and CLI scripts for file fidelity/performance regressions.
- Document mock-vs-production behavior explicitly whenever the UI could otherwise imply production capability.

### Key Lessons

1. Shared-link creation must save the latest server revision before token generation, otherwise reviewers can open stale drawings.
2. Read-only mode needs central mutation guards plus UI disabling; canvas-only guards are not enough.
3. localStorage-backed collaboration tests should clear storage once at scenario start, not on every navigation.
4. Summary frontmatter should consistently expose machine-readable key files and accomplishments to make milestone archival more reliable.

### Cost Observations

- Model mix: primarily current Codex session.
- Sessions: 1 active milestone execution session.
- Notable: Verification stayed fast because the phase used existing `npm run verify` and targeted E2E coverage instead of broad manual checks.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | multiple | 1-7 | Established the browser CAD MVP and file/tab workflow. |
| v1.1 | multiple | 8-11 | Added fidelity, transform productivity, save semantics, and QA baselines. |
| v1.2 | 1 | 12-15 | Hardened production workflow, CI gates, and mock collaboration boundary. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Manual/browser checks | MVP workflows | CAD model, canvas editor, file IO |
| v1.1 | Playwright + CLI checks | File/save/transform workflows | Fidelity and performance scripts |
| v1.2 | `npm run verify` | Build, E2E, fidelity, conversion, performance, collaboration | Collaboration repository and CI workflow |

### Top Lessons

1. Keep browser CAD behavior testable with small deterministic fixtures and scenario-based E2E.
2. Separate domain state boundaries early: file save state, server save state, conversion state, and review state should not be collapsed into one model.
3. Treat mock behavior as a first-class documented mode so users do not confuse local development flows with production guarantees.
