---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: active
last_updated: "2026-04-26T00:00:00.000Z"
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 3
  completed_plans: 3
  percent: 100
---

# State: Web CAD

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.
**Current focus:** Phase 7 - Cross-tab Reference Copy and Paste

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
- Curve display improved: canvas/SVG strokes use round caps and joins, imported DXF lineweights are capped lower, and spline sampling density was increased.
- Selection workflow improved: select tool now supports drag marquee multi-selection, multi-entity move, multi-delete, and selection count display.
- Large drawing performance improved: snap candidate/intersection work is capped for dense drawings, render lookup paths use maps/sets, canvas resizing is avoided when dimensions are unchanged, large autosave is skipped, and repeated import warnings are grouped.
- Workspace UX started: app now has a start page with new drawing/file open/recent open actions, recent document persistence, and multi-document tabs with tab switching/closing.
- Workspace tab history improved: each tab now preserves its own selection, viewport, and undo/redo history.
- Phase 7 context captured: cross-tab copy/paste, right-click context menu, standard clipboard shortcuts, and reference-point copy/paste decisions are ready for planning.
- Phase 7 UI-SPEC approved: context menu layout, reference-point mode feedback, keyboard input safety, spacing, typography, color, and Korean copy are locked for planning.
- Phase 7 planned: 3 execution plans created for clipboard core, context menu/keyboard shortcuts, and reference-point paste workflow.
- Phase 7 executed: CAD clipboard helpers, context menu, keyboard copy/paste, and reference-point copy/paste workflow are implemented.
- Phase 7 reference copy corrected: reference copy now treats another object's center/endpoint/intersection as the anchor by excluding copied entities from source anchor snapping.
- Phase 7 code review completed: fixed reference hover snap mismatch so visible snap markers and stored anchor points use the same external-anchor exclusion rules.
- Phase 7 reference paste improved: copied geometry now renders as a dashed preview overlay while choosing the destination anchor, with the cursor located at the referenced paste point.
- Phase 7 paste routing improved: when the clipboard came from reference copy, regular paste and Ctrl/Cmd+V now enter reference paste mode instead of offset pasting.
- Selection hit testing refined during UAT: rectangle and circle selection now targets outlines instead of filled interiors, and generic hit tolerance is reduced so drag marquee selection is easier to start near objects.
- Phase 7 UAT completed: cross-tab paste, destination undo, context menu, reference paste, Escape cancellation, and text editing copy/paste safety all passed.

## Decisions

- Use React + TypeScript + Vite.
- Use Canvas as the initial rendering surface.
- Keep CadDocument as the internal source of truth.
- Treat DWG as server-converted, not browser-parsed.
- Add workspace-level UX as a planned phase: first-run/start guide, recent files, explicit file open entry point, and multi-document tabs.

## Accumulated Context

### Roadmap Evolution

- Phase 7 added: Cross-tab reference copy and paste with right-click context menu, standard copy/paste, and reference-point copy/paste across tabs.

## Next Action

Phase 7 verification passed. Next action: complete the current milestone or start planning the next milestone.

**Planned Phase:** 07 (cross-tab-reference-copy-and-paste) — 3 plans — 2026-04-25T16:26:57.264Z
