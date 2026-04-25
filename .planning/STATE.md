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

## Decisions

- Use React + TypeScript + Vite.
- Use Canvas as the initial rendering surface.
- Keep CadDocument as the internal source of truth.
- Treat DWG as server-converted, not browser-parsed.

## Next Action

Continue Phase 4 hardening: improve DXF layer/color fidelity, add conversion warnings UI, and prepare DWG conversion API wiring.
