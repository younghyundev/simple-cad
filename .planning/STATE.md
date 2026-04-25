# State: Web CAD

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.
**Current focus:** Phase 2 - Basic Entity Editing

## Current Status

- Project initialized from README.md.
- Requirements and roadmap created.
- Korean communication requested and recorded in AGENTS.md.
- Implementation started with the Phase 1 foundation scaffold.
- Phase 2 basic entity interaction started: line, rectangle, circle, polyline, text creation; selection; drag movement; erase/delete.
- Phase 3 basic controls added: undo/redo history, selected entity stroke color/width/style editing, layer assignment, layer add/rename/color/visibility/lock toggles.
- Phase 4 file flow started: JSON open/save, autosave to localStorage, SVG export, and basic ASCII DXF import/export for LINE/CIRCLE/TEXT/LWPOLYLINE.
- Phase 5 conversion workflow started: DWG import/export routes through ConversionApiClient, conversion warnings render in the properties panel, and backend API contract is documented in docs/cad-conversion-api.md.
- Development mock CAD API added to Vite for `/api/cad/import`, `/api/cad/export`, and `/api/cad/validate`; drag movement now batches into a single undo step.
- Resize handles added for lines, rectangles, and circles; resize operations batch into a single undo step.
- Polyline point handles added, and ARC is now represented in the internal model with SVG/DXF render/import/export support.
- Polyline editing improved: double-click a polyline segment to insert a point, select a point handle and press Delete/Backspace to remove it.
- Snap support added: toolbar toggle, grid snap, endpoint snap, center snap, and visible snap marker during drawing/resizing.
- Intersection snap added for line, rectangle, polyline, and dimension segments.
- Dimension tool added: users can drag dimension lines, see automatic length labels, resize endpoints, and export dimensions to SVG/DXF as line + text.
- Dimension editing improved: labels can be manually edited or reset to automatic distance labels, and dimensions now render/export with offset extension lines.
- DXF layer/color fidelity improved: import reads LAYER table colors and entity ACI color code 62, and export writes a LAYER table plus entity colors.
- DXF line style fidelity improved: import maps line type code 6 and lineweight code 370 into stroke style/width, and export writes LTYPE, line type, and lineweight data.
- DXF text coverage improved: MTEXT import is supported, multiline text renders/selects correctly, and multiline text exports as MTEXT while SVG uses tspans.
- DXF entity coverage improved: ELLIPSE and SPLINE import are preserved as editable polyline approximations with conversion warnings.
- DXF block/reference coverage improved: BLOCK definitions are parsed and INSERT references are exploded into editable entities with insertion transform support.
- DXF native annotation coverage improved: DIMENSION entities import as editable Web CAD dimension objects using definition points, label text, and dimension-line offset.
- DXF curve fidelity improved: LWPOLYLINE bulge values now import as sampled arc segments instead of straight chords.
- DXF spline fidelity improved: SPLINE import now prefers fit points and uses Catmull-Rom interpolation instead of connecting raw control points.
- DXF spline and lineweight fidelity improved: SPLINE import now evaluates knot/degree/weight data when present, and lineweight import uses thinner screen stroke mapping.

## Decisions

- Use React + TypeScript + Vite.
- Use Canvas as the initial rendering surface.
- Keep CadDocument as the internal source of truth.
- Treat DWG as server-converted, not browser-parsed.

## Next Action

Continue hardening: replace mock CAD API with a real conversion backend, group repeated conversion warnings, and add richer CAD annotation/edit tools.
