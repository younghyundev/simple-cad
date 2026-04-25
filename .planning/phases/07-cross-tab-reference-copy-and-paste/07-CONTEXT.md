# Phase 7: Cross-tab Reference Copy and Paste - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds copy and paste workflows for editable CAD entities across the current document and other open tabs. It includes a right-click context menu and reference-point copy/paste so users can place copied geometry by a precise base point. It does not add persistent clipboard storage, system clipboard CAD format interoperability, grouping, blocks, or external file import/export changes.

</domain>

<decisions>
## Implementation Decisions

### Copy Buffer Scope
- **D-01:** Use an in-memory app-level CAD clipboard so copied entities survive tab switches.
- **D-02:** Do not persist the CAD clipboard through browser refreshes.
- **D-03:** Store copied entities as internal `CadEntity` data, not serialized DXF/DWG text.
- **D-04:** Pasted entities must receive new unique IDs to avoid collisions with source entities or entities in the destination tab.

### Cross-tab Behavior
- **D-05:** Copying from one tab and pasting into another tab is supported for all currently editable internal entity types.
- **D-06:** Preserve editable properties when pasting: layer ID when compatible, stroke color, fill color, stroke width, stroke style, text content, dimension label data, and geometry.
- **D-07:** If the destination tab does not contain the source layer ID, pasted entities should fall back to the destination document's active/default layer rather than creating hidden or broken references.
- **D-08:** Paste actions modify only the active tab and must be recorded in that tab's undo/redo history.

### Standard Copy and Paste
- **D-09:** Ctrl/Cmd+C copies the current selection when the user is not editing an input, textarea, or contenteditable element.
- **D-10:** Ctrl/Cmd+V pastes into the active tab when the CAD clipboard has entities and the user is not editing text.
- **D-11:** Standard paste should place entities near the current cursor/world point when available; otherwise use a small fixed offset from the copied geometry so repeated pastes are visible.
- **D-12:** After paste, newly pasted entities become the active selection.

### Reference Copy and Paste
- **D-13:** Reference copy is a two-step command: user chooses reference copy, then clicks a base point on the canvas.
- **D-14:** The clipboard stores the base point together with the selected entities.
- **D-15:** Reference paste is also point-based: user chooses reference paste, then clicks the destination base point.
- **D-16:** Pasted entity geometry is translated by `destinationBasePoint - sourceBasePoint`, preserving all relative spacing.
- **D-17:** Reference copy/paste should work with snap enabled so users can choose endpoints, centers, intersections, or grid points as base points.

### Context Menu
- **D-18:** Right-click on the canvas opens a compact context menu at the pointer position.
- **D-19:** When entities are selected, the menu includes Copy, Reference Copy, Delete, and Paste commands where applicable.
- **D-20:** When nothing is selected, the menu should still offer Paste and Reference Paste when the CAD clipboard is populated.
- **D-21:** The context menu should close on command execution, Escape, outside click, tab switch, or tool change.
- **D-22:** Browser default context menu should be suppressed only inside the CAD canvas area.

### UX Feedback
- **D-23:** Status bar/file message text should explain transient modes such as "참조 복사 기준점을 선택하세요" and "참조 붙여넣기 위치를 선택하세요."
- **D-24:** Reference-point selection should reuse the existing cursor/snap marker behavior where possible.
- **D-25:** Invalid commands should be disabled, not shown as failing alerts.

### the agent's Discretion
- Exact menu styling, menu ordering, keyboard shortcut labels, and small paste offset distance are left to the implementation agent, as long as they match the existing quiet workspace UI.
- The implementation agent may split clipboard helpers into separate files if that keeps `App.tsx` and `CadCanvas.tsx` manageable.

</decisions>

<specifics>
## Specific Ideas

- User explicitly requested tab-to-tab copy/paste.
- User requested a right-click menu for copy-related commands.
- User requested "참조복사" where a relative/base position is picked during copy and used again during paste.
- The feature should feel like practical CAD editing, not a generic browser clipboard.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and requirements
- `.planning/ROADMAP.md` — Phase 7 goal, dependency, and success criteria.
- `.planning/PROJECT.md` — Product boundary, desktop CAD workflow priorities, and Korean communication preference.
- `.planning/REQUIREMENTS.md` — Entity editing, undo/redo, and editor interaction requirements.
- `.planning/STATE.md` — Current implementation progress and recent workspace/tab history changes.

### Existing implementation
- `src/ui/App.tsx` — Owns active tab state, selected entity IDs, toolbar commands, document history, and global keyboard shortcuts.
- `src/ui/CadCanvas.tsx` — Owns canvas pointer events, selection, drag/move, snap resolution, and canvas keyboard handling.
- `src/cad/types.ts` — Defines `CadDocument`, `CadEntity`, entity variants, viewport, and tool IDs.
- `src/cad/entityGeometry.ts` — Existing geometry translation/hit-test helpers that should be reused for paste translation.
- `src/cad/snap.ts` — Existing snap behavior for reference point selection.
- `src/cad/useDocumentHistory.ts` — Tab-loaded document history API; paste operations must flow through this history.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `selectedEntityIds` in `App.tsx` already tracks single and multi-selection and can identify the copy source.
- `updateDocument` in `App.tsx` already records history and should be used for paste/delete commands.
- `CadCanvas` already converts pointer coordinates into world coordinates and resolves snapping.
- `translateEntity` exists in `entityGeometry.ts` and should be reused to offset pasted geometry.
- Existing keyboard guards already avoid overriding browser text editing inside input/textarea/contenteditable elements.

### Established Patterns
- The app keeps `CadDocument` as the source of truth and stores per-tab document/history snapshots.
- User-facing transient messages currently use `fileMessage` in `App.tsx`.
- UI controls use simple button/menu styling in `src/styles.css` and lucide icons in `App.tsx`.
- Large interactions should avoid expensive whole-document operations where possible, but paste can operate on the selected/copied subset.

### Integration Points
- Add CAD clipboard state at the app/workspace level, above individual tabs.
- Add context-menu state in `App.tsx` or a small dedicated component and anchor it from canvas right-click events.
- Add canvas callbacks for context menu opening and reference point picking.
- Add keyboard copy/paste handling alongside existing undo/redo/delete shortcuts.
- Ensure every paste calls `updateDocument` once so undo removes the entire pasted batch in one step.

</code_context>

<deferred>
## Deferred Ideas

- Persisting CAD clipboard across browser refreshes.
- Copying Web CAD entities to the operating-system clipboard as DXF/SVG.
- Pasting external CAD/SVG content from the operating-system clipboard.
- Creating reusable blocks/groups from copied entities.
- Advanced transform paste options such as rotate, scale, mirror, or array copy.

</deferred>

---

*Phase: 07-cross-tab-reference-copy-and-paste*
*Context gathered: 2026-04-26*
