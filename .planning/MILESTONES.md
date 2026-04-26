# Milestones

## v1.3 Share Link Management and Review Workflow (Shipped: 2026-04-26)

**Status:** Shipped
**Completed:** 2026-04-26
**Archive:** [v1.3 ROADMAP](milestones/v1.3-ROADMAP.md), [v1.3 REQUIREMENTS](milestones/v1.3-REQUIREMENTS.md)
**Phases completed:** 4 phases, 4 plans

### Delivered

- Local share link registry with right-panel link list, copy, delete, and local deleted/expired guards.
- Share creation dialog with title, description, expiry metadata, and read-only shared document metadata display.
- Review comment filters for all, unresolved, resolved, and selected-entity comments.
- Comment card navigation that selects linked entities and pans the canvas toward comment coordinates.
- Collaboration E2E coverage for share creation, copy, delete, expiry, read-only open, review filters, and comment focus.

### Known Deferred Items

- Server-side share revocation, permissions, audit history, and identity-aware access control.
- Real backend replacement for localStorage collaboration storage.
- Shared document version comparison and change history.

---

## v1.2 Production CAD Workflow and Collaboration (Shipped: 2026-04-26)

**Status:** Shipped
**Completed:** 2026-04-26
**Archive:** [v1.2 ROADMAP](milestones/v1.2-ROADMAP.md), [v1.2 REQUIREMENTS](milestones/v1.2-REQUIREMENTS.md)
**Phases completed:** 4 phases, 15 plans

### Delivered

- Production DWG conversion API contract with configurable base URL, timeouts, async job polling, typed failures, and mock/production mode documentation.
- Advanced DXF preservation for native ELLIPSE/SPLINE, HATCH, LEADER/MLEADER fallback, ATTRIB/ATTDEF fallback, BLOCK/INSERT warning detail, and document metadata.
- GitHub Actions quality gates running build, E2E, CAD fidelity, performance baseline, and conversion regression with artifacts and job summary.
- localStorage mock collaboration repository for server save/open, share links, read-only shared documents, coordinate/entity review comments, and review panel.
- Collaboration E2E coverage and README documentation for server save, share links, read-only mode, and comments.

### Known Deferred Items

- Real production DWG conversion server deployment and credentials.
- Real backend replacement for localStorage collaboration storage.
- Secure share-link permissions, expiration, and audit history.

---

## v1.0 — SimpleCAD MVP

**Status:** Shipped
**Completed:** 2026-04-26
**Archive:** [v1.0 ROADMAP](milestones/v1.0-ROADMAP.md), [v1.0 REQUIREMENTS](milestones/v1.0-REQUIREMENTS.md)
**Audit:** [v1.0 Milestone Audit](v1.0-MILESTONE-AUDIT.md)

### Delivered

- Browser-based 2D CAD editor built with React, TypeScript, Vite, and Canvas.
- Core drawing/editing for line, rectangle, circle, polyline, text, dimensions, and layers.
- JSON/SVG/DXF file flows plus DWG conversion API wiring.
- Workspace start page, recent files, and multi-document tabs.
- Cross-tab copy/paste and external-anchor reference copy/paste with overlay preview.

### Known Deferred Items

- Production DWG conversion backend.
- Full fidelity for all advanced DXF/DWG entities.
- More comprehensive automated browser tests.

## v1.1 — File Fidelity and Editing Productivity

**Status:** Shipped
**Completed:** 2026-04-26
**Archive:** [v1.1 ROADMAP](milestones/v1.1-ROADMAP.md), [v1.1 REQUIREMENTS](milestones/v1.1-REQUIREMENTS.md)

### Delivered

- DXF round-trip fixture, CAD fidelity regression, and structured conversion warning categories.
- Explicit DWG mock/server mode handling in API responses, UI, docs, and regression checks.
- Group/ungroup, rotation, alignment, and group-aware selection/snap/export behavior.
- Tab-level dirty state, Save/Save As semantics, File System Access API direct-save path, and unsaved-change guards.
- Playwright E2E coverage plus CLI performance and conversion regression baselines.

### Known Deferred Items

- Production DWG conversion backend.
- Full-fidelity advanced DXF/DWG entity support.
- Cross-browser CI and hosted performance trend tracking.
- Collaboration and server-backed sharing.
