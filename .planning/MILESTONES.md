# Milestones

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
