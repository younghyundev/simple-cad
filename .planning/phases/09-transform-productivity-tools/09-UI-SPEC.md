# Phase 9: Transform Productivity Tools - UI Spec

**Created:** 2026-04-26
**Status:** Ready for planning

## UI Goal

Make common transform work fast without turning SimpleCAD into a complex full CAD interface. Users should be able to group, ungroup, rotate, and align selected objects from familiar command surfaces.

## Surfaces

### Context Menu

When one or more objects are selected:

- `그룹화` appears when two or more top-level objects are selected.
- `그룹 해제` appears when the selection contains a group.
- `회전` may expose quick values or focus the right panel numeric control.
- Alignment commands appear when two or more objects are selected:
  - `왼쪽 정렬`
  - `가운데 정렬`
  - `오른쪽 정렬`
  - `위 정렬`
  - `중앙 정렬`
  - `아래 정렬`

Keep the existing copy/reference paste/delete commands.

### Properties Panel

When one object is selected:

- Existing object properties remain.
- If the selected object is a group, show type `group`, child count, and an `그룹 해제` mini button.
- Add a compact rotation input/stepper for supported selected objects:
  - label: `회전`
  - numeric input in degrees
  - apply button or immediate commit is acceptable, but it must create a normal undo step.

When multiple objects are selected:

- Replace the empty selection text with a compact transform command section:
  - selected count
  - group button
  - align icon/text buttons in a two-row grid
  - rotation degree input + apply button

### Toolbar

No new left-tool tile is required unless implementation needs a dedicated rotate tool. Prefer command buttons over a persistent mode.

## Visual Requirements

- Match existing `mini-button`, context menu, and panel-section visual language.
- Avoid large cards or explanatory panels.
- Buttons must not resize the right panel when labels change.
- Use Korean labels.
- Do not rely on color only; disabled states must use the `disabled` attribute where applicable.

## Interaction Requirements

- Group/ungroup should keep the resulting entity or children selected.
- Align should keep the affected objects selected.
- Rotate should keep the affected objects selected.
- Undo/redo should reverse one command at a time.
- Context menu should close after command execution.
- Commands should no-op with a Korean status message when selection is insufficient.

## Accessibility

- Context menu items use `role="menuitem"` as existing items do.
- Numeric rotation input should have an associated visible label.
- Buttons should have clear text labels; icons may supplement but should not replace unfamiliar transform commands.
