---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Production CAD Workflow and Collaboration
status: active
last_updated: "2026-04-26T09:01:42.296Z"
last_activity: 2026-04-26 -- Phase 13 planned
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 8
  completed_plans: 4
  percent: 50
---

# State: SimpleCAD

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.
**Current focus:** v1.2 — Production CAD Workflow and Collaboration

## Current Position

Phase: 13 — Advanced CAD Entity Preservation
Plan: 4 plans ready
Status: Ready to execute
Last activity: 2026-04-26 -- Phase 13 planned

## Current Status

- v1.0 was archived and tagged as `v1.0`.
- SimpleCAD source was published to `https://github.com/younghyundev/simple-cad` without `.planning`.
- v1.1 requirements and roadmap are defined.
- Phase 8 completed: DXF round-trip fixture/check, structured conversion warnings, and explicit DWG mock/server mode metadata.
- Phase 9 planning artifacts are ready: context, research, UI-SPEC, patterns, and 4 execution plans.
- Phase 9 completed: group/ungroup, rotation, alignment, group-aware selection/snap/export, and transform UI controls.
- Phase 10 completed: dirty tracking, Save/Save As semantics, File System Access API helper/fallback, unsaved-change guards, and README updates.
- Phase 11 completed: Playwright E2E harness, core workflow browser tests, large drawing performance baseline, and conversion failure/warning regression checks.
- v1.1 archive created in `.planning/milestones/`.
- v1.2 requirements and roadmap are defined in the requested order: DWG server, advanced CAD preservation, CI gates, sharing/review collaboration.
- Phase 12 planning artifacts are ready: context, research, UI spec, patterns, and 4 execution plans.
- Phase 12 completed: configurable DWG conversion API endpoint, typed conversion errors, async job polling, status UI, deterministic mock scenarios, and conversion API docs.
- Phase 13 planning artifacts are ready: research, UI spec, patterns, and 4 execution plans for advanced DXF/DWG entity preservation.

## Accumulated Context

- v1.0 delivered the browser CAD editor, file flows, workspace tabs, and reference copy/paste.
- v1.1 should improve trust in real-world files and reduce repeated editing work.
- DWG remains server-converted; production backend connection is in scope for v1.1 planning but can be phased behind mock/production mode separation.
- Any public GitHub sync should continue excluding `.planning`.

## Decisions

- Continue phase numbering from v1.0; v1.1 starts at Phase 8.
- Focus v1.1 on file fidelity, editing productivity, save workflow, and automated verification.
- Keep research lightweight unless a phase needs current external API/library decisions.

## Next Action

Run `$gsd-execute-phase 13` to execute Advanced CAD Entity Preservation.

**Planned Phase:** 13 (Advanced CAD Entity Preservation) — 4 plans — 2026-04-26T09:01:42.293Z
