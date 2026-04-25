---
phase: 7
plan: 3
title: Reference point copy and paste workflow
type: execute
wave: 3
depends_on:
  - 07-01-clipboard-core-PLAN.md
  - 07-02-context-menu-shortcuts-PLAN.md
files_modified:
  - src/ui/App.tsx
  - src/ui/CadCanvas.tsx
  - src/cad/clipboard.ts
  - src/styles.css
autonomous: true
requirements:
  - ENTY-02
  - ENTY-03
  - ENTY-07
  - EDIT-01
---

<objective>
Complete the CAD-specific reference copy/paste workflow by letting the user pick a snapped source base point and a snapped destination base point on the canvas.
</objective>

<threat_model>
This plan adds no external integrations. The main risks are accidental document edits while a temporary reference mode is active and stale mode state after tab/tool changes. Mitigate by making reference pick mode explicit, cancelable with Escape, closed on tab/tool changes, and prioritized before normal canvas drawing/selection handlers.
</threat_model>

<tasks>
  <task id="7-3-1" type="execute">
    <title>Add reference pick mode state and commands</title>
    <read_first>
      - src/ui/App.tsx
      - src/cad/clipboard.ts
      - .planning/phases/07-cross-tab-reference-copy-and-paste/07-CONTEXT.md
      - .planning/phases/07-cross-tab-reference-copy-and-paste/07-UI-SPEC.md
    </read_first>
    <files>
      - src/ui/App.tsx
    </files>
    <action>
      Add state `referenceMode` with type `'copy-base' | 'paste-base' | null`. Add `startReferenceCopy` that requires `selectedEntityIds.length > 0`, closes the context menu, sets `referenceMode` to `'copy-base'`, and sets `fileMessage` to `참조 복사 기준점을 선택하세요`. Add `startReferencePaste` that requires `cadClipboard`, closes the context menu, sets `referenceMode` to `'paste-base'`, and sets `fileMessage` to `참조 붙여넣기 위치를 선택하세요`. Invalid commands must set `복사할 객체를 선택하세요.` or `복사된 객체가 없습니다.`.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `referenceMode`.
      - `src/ui/App.tsx` contains `copy-base`.
      - `src/ui/App.tsx` contains `paste-base`.
      - `src/ui/App.tsx` contains `참조 복사 기준점을 선택하세요`.
      - `src/ui/App.tsx` contains `참조 붙여넣기 위치를 선택하세요`.
    </acceptance_criteria>
  </task>

  <task id="7-3-2" type="execute">
    <title>Expose snapped canvas point picks</title>
    <read_first>
      - src/ui/CadCanvas.tsx
      - src/cad/snap.ts
      - src/cad/viewport.ts
    </read_first>
    <files>
      - src/ui/CadCanvas.tsx
    </files>
    <action>
      Add props `referencePickMode: boolean` and `onReferencePointPick?: (point: CadPoint) => void`. In `onPointerDown`, after computing `snap` and `worldPoint`, if `referencePickMode` is true, call `onReferencePointPick(worldPoint)`, clear draft/drag setup as needed, and return before select/pan/draw/erase behavior. Keep `setSnapMarker(snap.type === 'none' ? null : snap)` so snap feedback remains visible.
    </action>
    <acceptance_criteria>
      - `src/ui/CadCanvas.tsx` contains `referencePickMode`.
      - `src/ui/CadCanvas.tsx` contains `onReferencePointPick`.
      - `src/ui/CadCanvas.tsx` contains `if (referencePickMode)`.
      - `src/ui/CadCanvas.tsx` contains `onReferencePointPick(worldPoint)`.
    </acceptance_criteria>
  </task>

  <task id="7-3-3" type="execute">
    <title>Complete reference copy and reference paste commands</title>
    <read_first>
      - src/ui/App.tsx
      - src/cad/clipboard.ts
    </read_first>
    <files>
      - src/ui/App.tsx
    </files>
    <action>
      Add `handleReferencePointPick(point: CadPoint)`. When `referenceMode === 'copy-base'`, collect selected entities, call `createClipboardPayload(selectedEntities, point)`, set `cadClipboard`, set `referenceMode` to `null`, and set `fileMessage` to `참조 기준점과 함께 복사했습니다.`. When `referenceMode === 'paste-base'`, call `pasteClipboardPayload(cadClipboard, { destinationDocument: document, destinationBasePoint: point })`, append returned entities via one `updateDocument` call, select returned `entityIds`, set `referenceMode` to `null`, and set `fileMessage` to `참조 위치에 붙여넣었습니다.`.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `handleReferencePointPick`.
      - `src/ui/App.tsx` contains `createClipboardPayload(selectedEntities, point)`.
      - `src/ui/App.tsx` contains `destinationBasePoint: point`.
      - `src/ui/App.tsx` contains `참조 기준점과 함께 복사했습니다.`
      - `src/ui/App.tsx` contains `참조 위치에 붙여넣었습니다.`
    </acceptance_criteria>
  </task>

  <task id="7-3-4" type="execute">
    <title>Cancel reference mode safely</title>
    <read_first>
      - src/ui/App.tsx
      - src/ui/CadCanvas.tsx
    </read_first>
    <files>
      - src/ui/App.tsx
    </files>
    <action>
      Extend Escape handling so if `referenceMode` is non-null, Escape sets it to `null`, closes the context menu, and sets `fileMessage` to `참조 작업을 취소했습니다.`. Also clear reference mode when `activeTabId` changes or `activeTool` changes. Pass `referencePickMode={referenceMode !== null}` and `onReferencePointPick={handleReferencePointPick}` to `CadCanvas`.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `참조 작업을 취소했습니다.`
      - `src/ui/App.tsx` contains `referencePickMode={referenceMode !== null}`.
      - `src/ui/App.tsx` contains `onReferencePointPick={handleReferencePointPick}`.
      - `src/ui/App.tsx` contains `setReferenceMode(null)`.
    </acceptance_criteria>
  </task>

  <task id="7-3-5" type="execute">
    <title>Verify full cross-tab reference workflow</title>
    <read_first>
      - package.json
      - src/ui/App.tsx
      - src/ui/CadCanvas.tsx
      - src/cad/clipboard.ts
    </read_first>
    <files>
      - src/ui/App.tsx
      - src/ui/CadCanvas.tsx
      - src/cad/clipboard.ts
      - src/styles.css
    </files>
    <action>
      Run `npm run build`. Manually verify: create or open two tabs; select multiple entities in the first tab; use right-click `참조 복사`; click an endpoint or grid point as the source base; switch to the second tab; use right-click `참조 붙여넣기`; click a destination snap point; confirm pasted entities keep relative spacing, receive new IDs, are selected, and undo in the destination tab removes the pasted batch without affecting the source tab.
    </action>
    <acceptance_criteria>
      - `npm run build` exits 0.
      - Manual UAT confirms source tab entity count is unchanged after destination undo.
      - Manual UAT confirms destination pasted IDs start with `copy-` or another implemented unique copy prefix.
      - Manual UAT confirms status text includes `참조 위치에 붙여넣었습니다.` after reference paste.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Complete manual UAT for reference copy/paste across two tabs.
- Complete manual UAT for Escape cancellation from both reference modes.
- Complete manual UAT with snap enabled and disabled.
</verification>

<success_criteria>
- Reference copy stores the chosen snapped source base point.
- Reference paste places copied entities using the exact destination-source base point delta.
- Reference modes do not trigger normal select/draw/edit actions.
- Escape, tab switch, and tool change cancel transient reference state.
</success_criteria>

<must_haves>
- `참조 복사` and `참조 붙여넣기` work from the context menu.
- Snap marker remains available during reference point selection.
- Pasted entities are selected after paste.
- Undo/redo remains scoped to the active tab.
</must_haves>
