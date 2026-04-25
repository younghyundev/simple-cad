# State: Web CAD

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.
**Current focus:** Phase 1 - Editor Foundation

## Current Status

- Project initialized from README.md.
- Requirements and roadmap created.
- Korean communication requested and recorded in AGENTS.md.
- Implementation started with the Phase 1 foundation scaffold.

## Decisions

- Use React + TypeScript + Vite.
- Use Canvas as the initial rendering surface.
- Keep CadDocument as the internal source of truth.
- Treat DWG as server-converted, not browser-parsed.

## Next Action

Run `$gsd-plan-phase 1` for a formal GSD phase plan, or continue implementing Phase 1 directly.
