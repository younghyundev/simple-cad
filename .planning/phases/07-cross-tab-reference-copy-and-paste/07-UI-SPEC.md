---
phase: 7
slug: cross-tab-reference-copy-and-paste
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-26
---

# Phase 7 — UI Design Contract

> Visual and interaction contract for cross-tab copy/paste, right-click commands, and reference-point placement in the Web CAD workspace.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | lucide-react |
| Font | Inter, ui-sans-serif, system-ui |

Implementation must extend the existing in-repo CSS in `src/styles.css`. Do not introduce a new UI component framework for this phase.

---

## Interaction Contract

### Context Menu

- Opens only inside the CAD canvas area on right-click.
- Suppresses the browser context menu only for the canvas, not for inputs or the rest of the page.
- Anchors at the pointer position and stays within the visible canvas/workspace bounds.
- Uses a compact vertical menu with icon + Korean label rows.
- Closes on command execution, outside click, Escape, tab switch, active tool change, or viewport interaction.
- Disabled commands remain visible with reduced opacity when they explain available workflow state, for example paste commands with an empty CAD clipboard.

### Menu Items

| State | Items |
|-------|-------|
| Selection exists, clipboard empty | 복사, 참조 복사, 삭제 |
| Selection exists, clipboard populated | 복사, 참조 복사, 붙여넣기, 참조 붙여넣기, 삭제 |
| No selection, clipboard populated | 붙여넣기, 참조 붙여넣기 |
| No selection, clipboard empty | No menu, or a disabled compact menu with no actionable commands |

Use dividers only between command groups: copy commands, paste commands, destructive commands.

### Reference Point Mode

- Reference copy enters a temporary canvas-pick mode with status text: `참조 복사 기준점을 선택하세요`.
- Reference paste enters a temporary canvas-pick mode with status text: `참조 붙여넣기 위치를 선택하세요`.
- While in either temporary mode, the normal tool selection remains visually unchanged; the mode is communicated through the status bar and cursor/snap marker.
- Clicking the canvas confirms the reference point. Escape cancels the temporary mode and restores the previous editing state.
- Snap markers keep their current color semantics; do not add a competing marker style unless the existing marker is unavailable.

### Keyboard

- Ctrl/Cmd+C copies selected CAD entities when focus is not in an input, textarea, or contenteditable element.
- Ctrl/Cmd+V pastes from the in-memory CAD clipboard when focus is not in an input, textarea, or contenteditable element.
- Escape closes the context menu or cancels reference point mode before affecting other tools.
- Delete/Backspace behavior remains unchanged for selected entities.

---

## Layout and Positioning

| Element | Contract |
|---------|----------|
| Context menu width | 176px minimum, 220px maximum |
| Menu row height | 32px |
| Menu icon slot | 18px wide, lucide icon at 15-16px |
| Menu padding | 4px outer padding, 6px horizontal row padding |
| Divider | 1px line, 4px vertical margin |
| Z-index | Above canvas overlays and text input only when open; below modal-like future UI |
| Touch target | Desktop-first; no mobile-specific redesign in this phase |

The menu must not resize the canvas or shift surrounding workspace layout. Position it with absolute/fixed overlay coordinates.

---

## Spacing Scale

Declared values must remain multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Menu outer padding, divider margin |
| sm | 8px | Row gaps, icon/text gap, compact menu spacing |
| md | 16px | Menu section padding if a header is ever added |
| lg | 24px | Not used for the context menu |
| xl | 32px | Menu row height |
| 2xl | 48px | Not used |
| 3xl | 64px | Not used |

Exceptions: Existing `7px` toolbar gaps may remain where already present. New context menu spacing should use 4px/8px/16px.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 13px | 400 | 1.4 |
| Label | 12px | 500 | 1.3 |
| Menu item | 13px | 500 | 1.2 |
| Status text | 12px | 400 | 1.3 |
| Heading | 14px | 700 | 1.3 |
| Display | not used | not used | not used |

No viewport-based font scaling. Letter spacing remains `0`.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f8fafc` | Canvas/workspace background |
| Secondary (30%) | `#ffffff` | Context menu surface, panels |
| Accent (10%) | `#0f766e` | Active/hover command border, active tab/tool continuity |
| Border | `#d1d5db` | Menu border and dividers |
| Text | `#111827` | Primary command text |
| Muted text | `#6b7280` | Disabled commands and shortcut hints |
| Hover fill | `#ecfdf5` | Menu row hover/active state |
| Destructive | `#dc2626` | Delete command icon/text only |

Accent reserved for: active command hover, active command focus, reference-mode status emphasis if needed. Do not apply teal to every menu item by default.

---

## Visual States

| State | Required Treatment |
|-------|--------------------|
| Default command | White row, dark text, transparent border |
| Hover command | `#ecfdf5` fill, `#0f766e` text/icon |
| Keyboard focus | 1px `#0f766e` outline or border, visible without layout shift |
| Disabled command | `opacity: 0.45`, `cursor: not-allowed`, no hover color change |
| Destructive command | Dark text by default; `#dc2626` on hover/focus |
| Menu surface | White background, 1px border, 6px radius, subtle shadow |
| Reference mode | Status bar message changes; snap marker remains visible when snap applies |

Cards are not used for this feature. Do not place the context menu inside any existing panel/card.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Copy command | `복사` |
| Reference copy command | `참조 복사` |
| Paste command | `붙여넣기` |
| Reference paste command | `참조 붙여넣기` |
| Delete command | `삭제` |
| Reference copy prompt | `참조 복사 기준점을 선택하세요` |
| Reference paste prompt | `참조 붙여넣기 위치를 선택하세요` |
| Copy success | `선택 객체를 복사했습니다.` |
| Paste success | `객체를 붙여넣었습니다.` |
| Reference copy success | `참조 기준점과 함께 복사했습니다.` |
| Reference paste success | `참조 위치에 붙여넣었습니다.` |
| Empty clipboard | `복사된 객체가 없습니다.` |
| No selection copy | `복사할 객체를 선택하세요.` |
| Cancel reference mode | `참조 작업을 취소했습니다.` |

No alert dialogs for normal copy/paste states. Use status/file message text and disabled menu commands.

---

## Accessibility and Input Safety

- Menu must be keyboard reachable when opened.
- Escape must close the menu.
- Enter or Space must activate the focused menu command.
- Menu rows must use `button` elements or equivalent ARIA menuitem semantics.
- The implementation must not steal Ctrl/Cmd+C or Ctrl/Cmd+V from text inputs, textareas, contenteditable elements, or the inline canvas text editor.
- Disabled commands need `disabled` or `aria-disabled` state.
- Right-click menu must not appear over the inline text editor while editing text.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not required |

No registry components are allowed for this phase.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-26
