# Phase 15 Research: Sharing and Review Collaboration

**Date:** 2026-04-26
**Status:** Ready for planning

## Research Question

What needs to be known to plan Phase 15 well?

## Existing Architecture

- `src/ui/App.tsx` owns workspace tabs, recent documents, dirty state, Save/Save As, file open, context menu, and status bar.
- `src/cad/useDocumentHistory.ts` owns undo/redo snapshots.
- `src/cad/io/fileManager.ts` owns local file import/export and DWG conversion API calls.
- Recent documents are stored in `localStorage` under `simplecad.recentDocuments`.
- Autosave uses `localStorage` under `simplecad.autosave`.
- Tabs contain document snapshot, save state, viewport, selected entity ids, and last opened timestamp.
- There is no routing library; URL handling should use `URLSearchParams`, `history.replaceState`, or `location.hash` unless a router becomes necessary.

## Product Boundary

This phase should not build a production multi-user backend. Instead, it should add a clean collaboration boundary and a local mock repository that proves the UX and state model:

- server-backed save/open API interface
- localStorage-backed mock implementation
- share link token model
- read-only shared document mode
- coordinate/entity review comments

The API boundary should be easy to replace with a real backend in a future milestone.

## Recommended Data Model

Add collaboration types separate from `CadDocument`:

- `ServerDocumentRecord`
  - `id`
  - `title`
  - `document`
  - `createdAt`
  - `updatedAt`
  - `readonly?: boolean`
  - `shareToken?: string`
- `ReviewComment`
  - `id`
  - `documentId`
  - `entityId?: string`
  - `point?: CadPoint`
  - `message`
  - `author`
  - `createdAt`
  - `resolved`
- `ShareLink`
  - `token`
  - `documentId`
  - `readonly: true`
  - `createdAt`

Store mock data under localStorage keys:

- `simplecad.serverDocuments`
- `simplecad.reviewComments`
- `simplecad.shareLinks`

## Recommended Phase 15 Shape

1. Collaboration repository foundation
   - Types and localStorage mock repository.
   - Save/open/list server documents.
   - Create share token and resolve shared document.

2. App integration
   - Add server save/open actions.
   - Add server document list on start page.
   - Preserve dirty state and tab state rules.

3. Share link and read-only mode
   - Create copyable share link.
   - Load `?share=<token>` read-only documents.
   - Disable editing/saving commands that mutate read-only documents.

4. Review comments, tests, docs
   - Add coordinate/entity comments from context menu or side panel.
   - Render comment markers.
   - Add E2E coverage for server save/open/share/comment.
   - Update README.

## Risks

- Mixing server save with file save can confuse dirty state. Server save should update a separate collaboration state and still preserve local file target state.
- Shared read-only mode must block all mutation paths, including canvas edits, delete, paste, layer changes, property changes, and keyboard shortcuts.
- localStorage mock IDs should be deterministic enough for tests but not collide across manual sessions.
- Comments tied to entity ids can become orphaned after delete; UI should keep them visible as unresolved/orphaned or mark them clearly.

