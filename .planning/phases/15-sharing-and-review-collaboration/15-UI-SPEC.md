# Phase 15 UI Spec: Sharing and Review Collaboration

**Created:** 2026-04-26
**Status:** Ready for planning

## UI Scope

Phase 15 adds collaboration controls to the existing CAD workspace without creating a marketing page or separate app shell.

## Layout

- Topbar:
  - Add `서버 저장` button.
  - Add `공유` button.
  - Add `링크 복사` button only when a share link exists.
- Start page:
  - Keep `새 도면`, `파일 열기`, and `최근 열기`.
  - Add `서버 도면` list with title and updated timestamp.
- Properties panel:
  - Add compact `검토` section below transform/layer/conversion sections.
  - Comments should be displayed as dense rows with author, message, coordinate/entity target, created time, and resolved toggle.
- Canvas:
  - Show comment markers as small numbered pins.
  - Read-only shared documents should show a restrained top-of-workspace banner.

## Interaction

- `서버 저장` stores the current `CadDocument` in the collaboration repository.
- `공유` creates a read-only link for the server document; if the document has never been server-saved, save it first.
- Shared document URL should use a query parameter or hash such as `?share=<token>`.
- Opening a shared document sets read-only mode.
- In read-only mode:
  - Canvas mutation tools are disabled or ignored.
  - Save/local export can remain available only as non-mutating download if clearly labeled; server save must be disabled.
  - Property/layer/comment mutation controls must be disabled except comment viewing.
- `주석 추가` can be invoked from the context menu and stores either `entityId` or world coordinate.

## Copy

Use Korean copy:

- `서버 저장`
- `서버 도면`
- `공유 링크 생성`
- `링크 복사`
- `읽기 전용 공유 문서`
- `주석 추가`
- `해결됨`

## Visual

- Keep controls compact and work-tool oriented.
- Do not add large cards inside the workspace.
- Comment markers should be visible but not obscure CAD geometry.
- Text must fit in topbar buttons at desktop widths already supported by the app.

## Verification

- E2E can save a document to server storage, reopen it from the start page, create a share link, open the shared URL, verify read-only banner, and add/view a comment in an editable document.

