# Phase 8: File Fidelity Hardening - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** Roadmap and v1.1 requirements

<domain>
## Phase Boundary

This phase improves trust in CAD file import/export. It does not attempt full AutoCAD parity. It focuses on measurable DXF round-trip behavior, clearer conversion warnings, and explicit DWG mock/production mode separation.
</domain>

<decisions>
## Implementation Decisions

### Locked Scope

- Preserve or clearly report key DXF properties: geometry position, layer, color, stroke width, stroke style, text content, dimension labels, and approximated curve warnings.
- Add fixture-based regression checks for DXF import/export instead of relying on manual file inspection.
- Improve warning data so the UI can group by severity/category/source entity type and explain whether data was preserved, approximated, skipped, or produced by a mock converter.
- Separate DWG mock and production mode in code and user-facing messages.

### Agent Discretion

- Exact test runner choice is up to the implementation if it stays lightweight and works with the current Vite/TypeScript project.
- Warning schema can be additive; existing `CadWarning` consumers must keep working during migration.
- Fixture contents should be small, readable, and focused on the entities in Phase 8 requirements.
</decisions>

<canonical_refs>
## Canonical References

### Planning

- `.planning/ROADMAP.md` — Phase 8 success criteria
- `.planning/REQUIREMENTS.md` — FID-01 through FID-05
- `.planning/PROJECT.md` — v1.1 milestone goal and product constraints

### Code

- `src/cad/types.ts` — `CadWarning`, `UnsupportedCadEntity`, `CadDocument`
- `src/cad/io/importService.ts` — DXF parser/import warnings and unsupported entities
- `src/cad/io/exportService.ts` — DXF export behavior
- `src/cad/io/fileManager.ts` — import/export orchestration
- `src/cad/io/conversionApiClient.ts` — DWG/CAD conversion client
- `src/ui/App.tsx` — grouped import warning UI
- `vite.config.ts` — development mock conversion API
- `docs/cad-conversion-api.md` — server conversion API contract
</canonical_refs>

<specifics>
## Specific Ideas

- Add `conversionMode: 'client' | 'mock' | 'server'` style metadata where useful.
- Add warning severity/category helpers instead of hand-building grouping in `App.tsx`.
- Add round-trip test fixtures under a source-controlled fixture directory, not under `dist`.
- Keep fixture tests independent from browser UI tests; browser workflow coverage belongs to Phase 11.
</specifics>

<deferred>
## Deferred Ideas

- Full DWG backend implementation can be planned later if Phase 8 only establishes mode separation and configuration.
- Full native SPLINE/ELLIPSE editable models are out of this phase unless necessary for warning fidelity.
</deferred>

---

*Phase: 08-file-fidelity-hardening*
*Context gathered: 2026-04-26*
