---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Advanced CAD Compatibility Expansion
status: planning
last_updated: "2026-04-26T13:10:00Z"
last_activity: 2026-04-26 -- Phase 21 completed
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 4
  completed_plans: 2
  percent: 50
---

# State: SimpleCAD

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** 사용자가 브라우저에서 2D 도면을 정확하게 보고, 선택하고, 수정하고, DXF/DWG를 포함한 실무 파일 형식으로 다시 저장할 수 있어야 합니다.
**Current focus:** v1.4 broader DXF/DWG compatibility

## Current Position

Phase: 22 — Layout and External Reference Classification
Plan: Not started
Status: Phase 21 complete
Last activity: 2026-04-26 -- Phase 21 completed

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
- Phase 13 completed: native ELLIPSE/SPLINE preservation, HATCH entity support, LEADER/MLEADER and ATTRIB/ATTDEF fallbacks, richer INSERT/BLOCK warnings, DXF metadata tracking, advanced fidelity fixture, and regression coverage.
- Phase 14 planning artifacts are ready: research, patterns, and 3 execution plans for GitHub Actions quality gates.
- Phase 14 completed: GitHub Actions quality-gates workflow, Node 22/npm ci/Playwright install, command logs, Playwright artifacts, job summary, README CI docs, and local `npm run verify`.
- Phase 15 planning artifacts are ready: research, UI spec, patterns, and 4 execution plans for sharing/review collaboration.
- Phase 15 completed: local mock server save/open, share links, read-only shared documents, coordinate/entity review comments, review panel, E2E coverage, README docs, and clean code review.
- v1.2 archive created in `.planning/milestones/`.
- v1.3 started with a browser-only collaboration scope: share link management, share options, review comment workflow polish, and regression documentation.
- Phase 16 completed: local share link registry, right-panel link list, copy/delete actions, local deleted/expired guards, README limitation note, and collaboration E2E coverage.
- Phase 17 completed: share creation dialog, title/description/expiry metadata, read-only metadata banner, past-date validation, README update, and collaboration E2E coverage.
- Phase 18 completed: review filters for all/unresolved/resolved/selected entity, comment focus navigation, active comment styling, and collaboration E2E coverage.
- Phase 19 completed: expired share link regression, README review workflow documentation, and full `npm run verify`.
- v1.3 archive created in `.planning/milestones/`.
- v1.4 started for broader DXF/DWG compatibility: layer/style fidelity, annotation/block fallback, layout/reference classification, and advanced regression docs.
- Phase 20 completed: DXF layer visibility/lock/linetype/lineweight import/export preservation, round-trip summaries, conversion regression, and README update.
- Phase 21 completed: TEXT/MTEXT rotation/alignment/height preservation, DIMENSION fallback detail enrichment, BLOCK/INSERT transform detail enrichment, and conversion regression coverage.

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

Run `$gsd-plan-phase 22` to plan layout and external reference classification.

**Completed Phase:** 21 (Annotation and Block Fallbacks)
**Next Phase:** 22 (Layout and External Reference Classification)
**Current Milestone:** v1.4 (Advanced CAD Compatibility Expansion)
