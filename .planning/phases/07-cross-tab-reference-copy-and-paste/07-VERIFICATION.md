---
phase: 07-cross-tab-reference-copy-and-paste
status: human_needed
created: 2026-04-26
updated: 2026-04-26
automated_checks:
  build: passed
human_verification_count: 6
---

# Phase 7 Verification

## Goal

Verify that users can copy/paste selected entities within the same drawing or across tabs, use a right-click context menu, and place copied geometry by reference points.

## Automated Checks

| Check | Status | Evidence |
|-------|--------|----------|
| TypeScript and production build | PASS | `npm run build` exits 0 |
| GSD plan completion | PASS | `gsd-sdk query init.execute-phase "7"` reports `incomplete_count: 0` |
| Clipboard core exports | PASS | `src/cad/clipboard.ts` exports `CadClipboardPayload`, `createClipboardPayload`, `pasteClipboardPayload` |
| Context menu implementation | PASS | `src/ui/App.tsx` renders `.cad-context-menu`; `src/styles.css` defines menu styles |
| Canvas context menu event | PASS | `src/ui/CadCanvas.tsx` exposes `onCanvasContextMenu` |
| Reference point pick path | PASS | `src/ui/CadCanvas.tsx` exposes `referencePickMode` and `onReferencePointPick` |

## Must-Haves

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Standard copy/paste creates new entities with new IDs | AUTOMATED PASS + HUMAN NEEDED | `pasteClipboardPayload` assigns `copy-` IDs; browser UAT should confirm selection/rendering |
| Cross-tab paste preserves editable properties | HUMAN NEEDED | Requires browser tabs and visual confirmation |
| Right-click context menu shows copy/paste/reference/delete commands | HUMAN NEEDED | Requires pointer interaction |
| Reference copy stores a source base point | AUTOMATED PASS + HUMAN NEEDED | `createClipboardPayload(selectedEntities, point)` used in `App.tsx`; snap point selection needs browser UAT |
| Reference paste applies destination-source base point delta | AUTOMATED PASS + HUMAN NEEDED | `pasteClipboardPayload(... destinationBasePoint: point)` used in `App.tsx`; visual placement needs browser UAT |
| Text input copy/paste safety | HUMAN NEEDED | Requires inline canvas text editor interaction |
| Undo/redo scoped to active tab | HUMAN NEEDED | Requires browser tab workflow confirmation |

## Human Verification Items

1. Create two tabs, select multiple entities in tab A, press Ctrl/Cmd+C, switch to tab B, press Ctrl/Cmd+V, and confirm pasted entities appear selected.
2. In tab B, press undo and confirm the pasted batch disappears while tab A remains unchanged.
3. Right-click selected geometry and confirm menu items: `복사`, `참조 복사`, `붙여넣기`, `참조 붙여넣기`, `삭제`.
4. Use `참조 복사`, click a snapped source point, then use `참조 붙여넣기` and click a snapped destination point; confirm relative spacing is preserved.
5. Press Escape while waiting for a reference point and confirm the status changes to `참조 작업을 취소했습니다.`.
6. Edit a text entity and confirm native Ctrl/Cmd+C and Ctrl/Cmd+V operate on text content rather than the CAD clipboard.

## Gaps

None found by automated checks. Human UAT remains pending for pointer and keyboard interaction behavior.

## Verdict

`human_needed` - implementation and automated build checks pass, but CAD interaction workflows need browser confirmation before marking the phase fully complete.
