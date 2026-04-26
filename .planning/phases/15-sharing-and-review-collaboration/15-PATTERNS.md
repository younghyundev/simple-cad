# Phase 15 Patterns

**Created:** 2026-04-26

## Existing Patterns To Follow

### File and Save Boundaries

`FileManager` handles local import/export. Do not overload it with server collaboration state. Add a separate collaboration repository under `src/cad/collaboration.ts` or `src/cad/collaboration/`.

### App State Integration

`App.tsx` already stores tab-local state in `WorkspaceTab`. Server document metadata should live alongside `SaveState`, not inside `CadDocument.sourceFile`.

Recommended additive state:

- `collaborationState`
  - `serverDocumentId?: string`
  - `shareToken?: string`
  - `readonly: boolean`
  - `lastServerSavedAt?: string`

Each `WorkspaceTab` should carry this state so switching tabs does not lose server/share status.

### Dirty State

`SaveState.revision` and `savedRevision` track local file save. Do not redefine this for server saves. Add a separate `serverSavedRevision` if needed so server save status can be shown independently.

### UI Placement

- Topbar: compact icon/text buttons for server save, share, copy link.
- Start page: add a dense "서버 도면" list near "최근 열기".
- Right panel: add "검토" section for comments.
- Context menu: add "주석 추가" when there is an active drawing.
- Status bar: show `읽기 전용 공유` and server save status.

### Test Strategy

Extend `tests/e2e/core-workflow.spec.ts` or add a new collaboration spec. Prefer explicit `data-testid` selectors:

- `server-save-button`
- `share-link-button`
- `server-document-item`
- `add-comment-button`
- `comment-marker`
- `readonly-banner`

## Files Likely Modified

- `src/ui/App.tsx`
- `src/ui/CadCanvas.tsx`
- `src/cad/render.ts`
- `src/cad/types.ts`
- `src/styles.css`
- `tests/e2e/core-workflow.spec.ts`
- `README.md`

## Files Likely Created

- `src/cad/collaboration.ts`
- `tests/e2e/collaboration.spec.ts`

## Constraints

- Keep Korean user-facing copy.
- Do not introduce a backend server dependency in this phase.
- Do not add a router unless URL hash/search parsing becomes unmanageable.
- Read-only mode must block all document mutation paths.

