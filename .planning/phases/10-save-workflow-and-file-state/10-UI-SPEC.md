# Phase 10: Save Workflow and File State - UI Spec

**Created:** 2026-04-26
**Status:** Ready for planning

## UI Goal

Users should always understand whether a drawing has unsaved changes and what Save will do.

## Topbar

- Keep `저장` as the primary save action.
- Add a compact `다른 이름` or `Save As` action if layout allows.
- Export format buttons can remain, but Save should no longer be just JSON download.
- Disabled states should clearly prevent saving when no tab is open.

## Tabs

- Dirty tabs show a small visible marker:
  - preferred: `*` or a small dot before/after the title
  - must not change tab height or cause large layout shift
- Tab close asks for confirmation if dirty.

## Status Bar

Show concise save state:

- `저장됨`
- `저장 안 됨`
- `저장 중...`
- `저장 실패`
- `파일 핸들 없음: 다운로드로 저장됨`

Include the target format when helpful:

- `저장됨: JSON`
- `저장 안 됨: DXF`

## Save As Flow

Use existing compact command style. If no custom modal exists, browser save/download prompts are acceptable. Avoid building a large modal unless required.

Format labels:

- JSON
- DXF
- SVG
- DWG

## File System Access API

When supported, Save As can use the native picker. When unsupported, fallback to download and show a statusbar message.

Do not show technical API names in the app UI.

## Warnings

Tab close warning copy:

- `저장되지 않은 변경사항이 있습니다. 탭을 닫을까요?`

Before unload copy is browser-controlled, so register the event without relying on custom text.

## Visual Constraints

- Follow existing SimpleCAD compact desktop UI.
- No onboarding panels.
- No nested cards.
- Buttons and labels must fit the current topbar and right panel widths.
