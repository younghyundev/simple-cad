# Phase 12: Production DWG Conversion Backend - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** v1.2 roadmap, requirements, current codebase, official conversion API docs

<domain>
## Phase Boundary

Phase 12 connects SimpleCAD's existing mock DWG conversion flow to a production-ready conversion server contract. The scope is frontend/client and local mock infrastructure, not implementing a full commercial DWG engine inside this repository.

This phase must deliver:

- configurable production conversion base URL
- explicit mock/server mode handling
- structured conversion error taxonomy
- job-based async conversion support
- UI status for conversion progress, completion, failure, and warnings
- updated docs and regression tests

It should preserve the existing `FileManager` and `ConversionApiClient` ownership boundary.
</domain>

<decisions>
## Implementation Decisions

### Engine Boundary

- Keep SimpleCAD engine-agnostic. The frontend talks to `/api/cad/*` contract; backend may use Autodesk APS, RealDWG, ODA, LibreDWG, or a commercial SDK.
- Do not put proprietary SDK assumptions into UI code.
- Use `mode: "server" | "mock"` and structured warning/error codes so users can distinguish production conversion from dev mock responses.

### API Contract

- Existing endpoints remain canonical: `/api/cad/import`, `/api/cad/export`, `/api/cad/validate`, `/api/cad/jobs/:jobId`.
- Add typed support for job responses: `queued`, `running`, `complete`, `failed`.
- Add conversion error categories: network, server, unsupported, conversion, timeout, invalid response.

### UI

- Conversion status should appear in normal file messaging/status areas and conversion warning panel.
- Long-running jobs should not freeze the app; polling should be cancellable by changing tasks or surfacing timeout state.

### the agent's Discretion

- Exact timeout/poll interval values, response type names, and test fixture names may be adjusted during implementation.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/ROADMAP.md` — Phase 12 goal and success criteria.
- `.planning/REQUIREMENTS.md` — DWG-01 through DWG-04.
- `.planning/PROJECT.md` — product constraints and prior decisions.

### Existing Implementation

- `src/cad/io/conversionApiClient.ts` — current conversion client and mode annotation.
- `src/cad/io/fileManager.ts` — DWG import/export orchestration.
- `docs/cad-conversion-api.md` — current server contract.
- `vite.config.ts` — current mock conversion routes.
- `src/ui/App.tsx` — file open/save, status messages, conversion panel.
- `src/cad/io/conversionRegressionCheck.ts` — current conversion regression script.

### Official External References

- Autodesk APS Model Derivative API overview — translates CAD files to derivative formats and extracts metadata.
- Autodesk APS 2D/3D conversions page — documents conversion to Viewer-compatible formats and file format translation.
- Autodesk RealDWG API overview — native DWG/DXF read/write SDK with licensing and platform constraints.
- GNU LibreDWG DXF manual — useful fallback context but documents stability limitations.
</canonical_refs>

<specifics>
## Specific Ideas

- Introduce `ConversionApiConfig` and `ConversionApiError`.
- Support response shapes:
  - immediate document/blob
  - `{ jobId, statusUrl, mode, warnings }`
  - job status with `{ status, progress, document, downloadUrl, error }`
- Add Vite mock knobs for success, failure, and async job simulation.
- Add user-facing Korean messages for network/server/unsupported/conversion failures.
</specifics>

<deferred>
## Deferred Ideas

- Actual deployment of ODA/RealDWG/APS credentials and infrastructure is deferred to backend environment setup outside this frontend repo.
- Advanced entity preservation belongs to Phase 13.
</deferred>

---

*Phase: 12-production-dwg-conversion-backend*
*Context gathered: 2026-04-26*
