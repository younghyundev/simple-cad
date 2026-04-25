---
phase: 7
plan: 2
title: Context menu and standard shortcuts
type: execute
wave: 2
depends_on:
  - 07-01-clipboard-core-PLAN.md
files_modified:
  - src/ui/App.tsx
  - src/ui/CadCanvas.tsx
  - src/styles.css
  - src/cad/clipboard.ts
autonomous: true
requirements:
  - ENTY-02
  - ENTY-03
  - ENTY-07
  - EDIT-01
---

<objective>
Wire the CAD clipboard into the app through Ctrl/Cmd+C, Ctrl/Cmd+V, and a canvas right-click context menu that follows the approved UI-SPEC.
</objective>

<threat_model>
No external clipboard or browser permission API is required. The main UX/security risk is intercepting native copy/paste while the user is editing text. Mitigate by reusing the existing input/textarea/contenteditable guard and by not rendering the CAD context menu over the inline canvas text input.
</threat_model>

<tasks>
  <task id="7-2-1" type="execute">
    <title>Add app-level clipboard and command handlers</title>
    <read_first>
      - src/ui/App.tsx
      - src/cad/clipboard.ts
      - .planning/phases/07-cross-tab-reference-copy-and-paste/07-CONTEXT.md
    </read_first>
    <files>
      - src/ui/App.tsx
    </files>
    <action>
      Import `Copy`, `ClipboardPaste`, and `Crosshair` or closest available lucide icons from `lucide-react`. Import `createClipboardPayload` and `pasteClipboardPayload` from `../cad/clipboard`. Add app-level state `cadClipboard` initialized to `null`. Add `copySelectedEntities` that filters `document.entities` by `selectedEntityIds`, stores `createClipboardPayload(selectedEntities)`, and sets `fileMessage` to `선택 객체를 복사했습니다.`. Add `pasteEntities` that calls `pasteClipboardPayload(cadClipboard, { destinationDocument: document, fallbackOffset: { x: 20, y: 20 } })`, appends returned entities to `current.entities` via one `updateDocument` call, selects returned `entityIds`, and sets `fileMessage` to `객체를 붙여넣었습니다.`. If no selection or no clipboard exists, set `복사할 객체를 선택하세요.` or `복사된 객체가 없습니다.` without alert dialogs.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `cadClipboard`.
      - `src/ui/App.tsx` contains `copySelectedEntities`.
      - `src/ui/App.tsx` contains `pasteEntities`.
      - `src/ui/App.tsx` contains `선택 객체를 복사했습니다.`
      - `src/ui/App.tsx` contains `객체를 붙여넣었습니다.`
      - `src/ui/App.tsx` contains `복사된 객체가 없습니다.`
    </acceptance_criteria>
  </task>

  <task id="7-2-2" type="execute">
    <title>Add keyboard copy and paste shortcuts safely</title>
    <read_first>
      - src/ui/App.tsx
    </read_first>
    <files>
      - src/ui/App.tsx
    </files>
    <action>
      Extend the existing `window.addEventListener('keydown', onKeyDown)` effect. Keep the existing guard for `INPUT`, `TEXTAREA`, and `isContentEditable`. Before delete handling and after undo/redo handling, add Ctrl/Cmd+C to call `copySelectedEntities()` and Ctrl/Cmd+V to call `pasteEntities()`. Call `event.preventDefault()` only when the command is handled outside text editing.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `event.key.toLowerCase() === 'c'`.
      - `src/ui/App.tsx` contains `event.key.toLowerCase() === 'v'`.
      - `src/ui/App.tsx` keydown effect dependency list includes `copySelectedEntities`.
      - `src/ui/App.tsx` keydown effect dependency list includes `pasteEntities`.
    </acceptance_criteria>
  </task>

  <task id="7-2-3" type="execute">
    <title>Surface canvas context menu events</title>
    <read_first>
      - src/ui/CadCanvas.tsx
      - src/cad/viewport.ts
    </read_first>
    <files>
      - src/ui/CadCanvas.tsx
    </files>
    <action>
      Add an optional `onCanvasContextMenu` prop with payload `{ screenPoint: CadPoint; worldPoint: CadPoint; entityId: string | null }`. Attach `onContextMenu` to the canvas. In the handler, call `event.preventDefault()`, compute `screenPoint` using `getLocalPoint(event)`, compute `worldPoint` with `screenToWorld(screenPoint, viewport)`, resolve the top entity with `findEntityAt(worldPoint)`, and call `onCanvasContextMenu`. Do not call this handler when inline text input is being edited.
    </action>
    <acceptance_criteria>
      - `src/ui/CadCanvas.tsx` contains `onCanvasContextMenu`.
      - `src/ui/CadCanvas.tsx` contains `onContextMenu=`.
      - `src/ui/CadCanvas.tsx` contains `event.preventDefault()`.
      - `src/ui/CadCanvas.tsx` contains `findEntityAt(worldPoint)`.
    </acceptance_criteria>
  </task>

  <task id="7-2-4" type="execute">
    <title>Render the CAD context menu</title>
    <read_first>
      - src/ui/App.tsx
      - src/styles.css
      - .planning/phases/07-cross-tab-reference-copy-and-paste/07-UI-SPEC.md
    </read_first>
    <files>
      - src/ui/App.tsx
      - src/styles.css
    </files>
    <action>
      Add `contextMenu` state in `App.tsx` with `{ x: number; y: number; worldPoint: CadPoint } | null`. Pass `onCanvasContextMenu` to `CadCanvas`; if the right-clicked entity is not already selected, select it before opening the menu. Render an absolutely positioned menu inside `.app-shell` or `.workspace` with class `cad-context-menu`. Menu rows must be `button` elements and show Korean labels `복사`, `참조 복사`, `붙여넣기`, `참조 붙여넣기`, and `삭제` according to clipboard/selection state. Add CSS per UI-SPEC: width 176-220px, 32px rows, 4px outer padding, 6px radius, white background, `#d1d5db` border, `#ecfdf5` hover fill, `#0f766e` hover text, disabled opacity 0.45, destructive hover `#dc2626`.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `cad-context-menu`.
      - `src/ui/App.tsx` contains `복사`.
      - `src/ui/App.tsx` contains `참조 복사`.
      - `src/ui/App.tsx` contains `붙여넣기`.
      - `src/ui/App.tsx` contains `참조 붙여넣기`.
      - `src/styles.css` contains `.cad-context-menu`.
      - `src/styles.css` contains `width: 176px`.
      - `src/styles.css` contains `height: 32px`.
      - `src/styles.css` contains `#ecfdf5`.
      - `src/styles.css` contains `#dc2626`.
    </acceptance_criteria>
  </task>

  <task id="7-2-5" type="execute">
    <title>Close menu from expected interactions</title>
    <read_first>
      - src/ui/App.tsx
    </read_first>
    <files>
      - src/ui/App.tsx
    </files>
    <action>
      Close `contextMenu` on command execution, outside pointer down, Escape, tab switch, and active tool change. Add a document-level pointer down listener that closes only when the event target is outside `.cad-context-menu`. Extend the global keydown handler so Escape closes the menu before other shortcuts.
    </action>
    <acceptance_criteria>
      - `src/ui/App.tsx` contains `setContextMenu(null)`.
      - `src/ui/App.tsx` contains `.cad-context-menu`.
      - `src/ui/App.tsx` contains `event.key === 'Escape'`.
      - `src/ui/App.tsx` contains an effect depending on `activeTool`.
      - `src/ui/App.tsx` contains an effect depending on `activeTabId`.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Manual UAT: copy and paste with Ctrl/Cmd+C and Ctrl/Cmd+V.
- Manual UAT: right-click with selection and confirm menu items.
- Manual UAT: right-click with empty clipboard and no selection; confirm no broken menu.
- Manual UAT: edit text and confirm native copy/paste is not intercepted.
</verification>

<success_criteria>
- Standard copy/paste works in the same tab and across tabs.
- Context menu appears only in the canvas and follows UI-SPEC sizing/colors.
- Disabled/invalid commands do not use alerts.
- Paste is one undoable document history step.
</success_criteria>

<must_haves>
- In-memory clipboard survives tab switch.
- Ctrl/Cmd+C and Ctrl/Cmd+V are guarded during text editing.
- Context menu uses Korean labels.
- Menu closes on Escape, outside click, tab switch, tool change, and command execution.
</must_haves>
