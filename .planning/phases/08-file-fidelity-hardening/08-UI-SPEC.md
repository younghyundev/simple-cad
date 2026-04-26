# Phase 8 UI-SPEC: File Fidelity Hardening

**Status:** Approved
**Created:** 2026-04-26

## Goal

Make CAD conversion state understandable without turning the properties panel into a log dump. Users should quickly see whether imported/exported CAD data is clean, approximated, skipped, or coming from a development mock.

## Surfaces

### Properties Panel: Conversion Status

- Keep the section in the right properties panel.
- Rename copy from generic `변환 상태` only if needed, but keep Korean UI text.
- Show a compact summary row before details:
  - total warnings
  - approximated count
  - unsupported/skipped count
  - mock/server mode indicator when available
- Use existing `warning-list` and `warning-item` patterns; no nested cards.
- Each warning row should have:
  - short code or label
  - plain Korean explanation
  - count if grouped
  - severity visual through restrained text/border color, not large badges

### Mock/Production Mode Indicator

- If conversion is mock/dev, show an explicit Korean message such as `개발용 mock 변환`.
- If conversion is configured for production/server, show `서버 변환`.
- Do not hide mock status in tooltips only.
- The message should fit inside the existing right panel width.

### Empty State

- Keep the current compact empty state: `변환 경고가 없습니다.`
- If no warnings but source file was DWG through server conversion, show a neutral mode line only if metadata exists.

## Interaction Contract

- Warning groups are read-only in Phase 8.
- No modal is required.
- No hover-only disclosure for critical conversion status.
- The conversion status section must remain usable with many repeated warnings by grouping counts.

## Visual Contract

- Follow existing SimpleCAD panel style:
  - small headings
  - dense but readable rows
  - 6px radius or less
  - neutral background with restrained semantic accent
- Do not introduce a new color palette. Use existing teal for neutral/active and muted amber/red for warning/error states.
- Text must wrap within the right panel and never overflow.

## Copy

All user-facing copy in this phase must be Korean.

Preferred terms:

- `보존됨`
- `근사됨`
- `건너뜀`
- `미지원 객체`
- `개발용 mock 변환`
- `서버 변환`
- `변환 경고`

## Accessibility

- Warning rows must be plain text readable without color.
- Severity must not rely on color alone.
- Buttons introduced for export/test actions, if any, must use existing button styles and title text.

## Non-Goals

- No dashboard or full-screen report page.
- No marketing/landing content.
- No complex filter UI unless required by implementation.

## Verification

- Manual: import a DXF fixture with approximated entities and confirm grouped Korean warnings fit in the properties panel.
- Manual: run DWG mock import and confirm the UI clearly says it is mock/dev conversion.
- Automated: unit-level warning grouping tests should verify labels, counts, and severity/category mapping.
