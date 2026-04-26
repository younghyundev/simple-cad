---
phase: 15-sharing-and-review-collaboration
plan: 1
title: Collaboration Repository and Data Contract
type: implementation
wave: 1
depends_on: [Phase 10, Phase 14]
requirements: [SHARE-01, SHARE-02, SHARE-03, SHARE-04]
requirements_addressed: [SHARE-01, SHARE-02, SHARE-03, SHARE-04]
files_modified:
  - src/cad/collaboration.ts
  - src/cad/types.ts
autonomous: true
estimated: 75min
---

# Plan 15.1: Collaboration Repository and Data Contract

<objective>
Create a replaceable collaboration data boundary with localStorage-backed server documents, share links, and review comments.
</objective>

<threat_model>
localStorage data is user-controlled and should be parsed defensively. Do not trust stored document/comment/share payloads. No secrets or auth tokens are introduced in this phase.
</threat_model>

<tasks>
  <task id="15.1.1" type="implementation">
    <read_first>
      - src/cad/types.ts
      - .planning/phases/15-sharing-and-review-collaboration/15-RESEARCH.md
    </read_first>
    <action>
      Add collaboration-related exported types in a new `src/cad/collaboration.ts`:
      - `ServerDocumentRecord`
      - `ReviewComment`
      - `ShareLink`
      - `CollaborationState`
      `CollaborationState` must include `serverDocumentId?: string`, `shareToken?: string`, `readonly: boolean`, `lastServerSavedAt?: string`, and `serverSavedRevision?: number`.
    </action>
    <acceptance_criteria>
      - `src/cad/collaboration.ts` exists.
      - `src/cad/collaboration.ts` contains `export type ServerDocumentRecord`.
      - `src/cad/collaboration.ts` contains `export type ReviewComment`.
      - `src/cad/collaboration.ts` contains `export type CollaborationState`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>

  <task id="15.1.2" type="implementation">
    <read_first>
      - src/cad/collaboration.ts
      - src/cad/types.ts
    </read_first>
    <action>
      Implement `LocalCollaborationRepository` in `src/cad/collaboration.ts` with methods:
      - `listDocuments(): ServerDocumentRecord[]`
      - `saveDocument(input: { id?: string; title: string; document: CadDocument }): ServerDocumentRecord`
      - `openDocument(id: string): ServerDocumentRecord | null`
      - `createShareLink(documentId: string): ShareLink`
      - `resolveShareLink(token: string): ServerDocumentRecord | null`
      - `listComments(documentId: string): ReviewComment[]`
      - `addComment(input: Omit<ReviewComment, 'id' | 'createdAt' | 'resolved'>): ReviewComment`
      - `toggleCommentResolved(documentId: string, commentId: string): ReviewComment | null`
      Use localStorage keys `simplecad.serverDocuments`, `simplecad.shareLinks`, and `simplecad.reviewComments`.
    </action>
    <acceptance_criteria>
      - `src/cad/collaboration.ts` contains `class LocalCollaborationRepository`.
      - `src/cad/collaboration.ts` contains `simplecad.serverDocuments`.
      - `src/cad/collaboration.ts` contains `createShareLink`.
      - `src/cad/collaboration.ts` contains `toggleCommentResolved`.
      - `npm run build` exits 0.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- `npm run build`
- `npm run test:conversion`
</verification>

<success_criteria>
- Collaboration data is isolated from local file import/export logic.
- Server documents, share links, and comments can be stored and read locally.
- The repository can later be replaced by a real backend adapter.
</success_criteria>

<must_haves>
- Do not store FileSystemHandle or other runtime-only values.
- Parse localStorage defensively.
- Keep `CadDocument` itself backend-agnostic.
</must_haves>

