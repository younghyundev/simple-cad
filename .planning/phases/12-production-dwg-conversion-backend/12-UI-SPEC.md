# Phase 12 UI Spec: Production DWG Conversion Backend

## UX Goal

Users should always understand whether a DWG operation is:

- using development mock conversion
- running against a production server
- queued/running as a long conversion job
- completed with warnings
- failed with an actionable reason

## UI Surfaces

### Statusbar

- Show short operation status:
  - `DWG 변환 요청 중...`
  - `DWG 변환 진행 중 45%`
  - `DWG 변환 완료`
  - `DWG 변환 실패: 서버 오류`

### Conversion Panel

- Continue using the existing conversion warning panel.
- Add job status/failure grouping if needed.
- Preserve mock styling for mock conversion.

### File Actions

- Import/export/save buttons should be disabled or show busy state only while the active operation is running.
- Existing Save/Save As semantics must remain intact.

## Interaction Rules

- A failed conversion should not mutate the current document.
- A completed import should create/open the converted document only after a valid `CadDocument` is available.
- A completed export should download or write the final blob only after job completion.
- Timeout and invalid response failures must surface as user-readable Korean messages.

## Copy Guidelines

- Use direct, operational Korean text.
- Distinguish `mock` from `server`; do not use vague success language for mock conversion.
- Include the engine/server error message when it is safe and concise.

## Accessibility/Testability

- Keep existing semantic buttons.
- Add `data-testid` only where Playwright needs stable status assertions.
