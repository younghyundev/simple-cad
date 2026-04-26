# Phase 13 UI Spec: Advanced CAD Entity Preservation

**Created:** 2026-04-26
**Status:** Ready for planning

## UI Scope

Phase 13 does not add a new screen. UI work is limited to preserving trust during import/export:

- Imported advanced entity types should appear on the canvas with the same selection, movement, copy, and delete affordances as current entities.
- The existing conversion/import warning summary should distinguish preserved, approximated, and unsupported advanced entities.
- Metadata such as units, extents, and model/paper counts should be available in concise status/warning copy rather than a new large panel.

## Interaction Requirements

- Native `ellipse`, `spline`, and `hatch` entities must be selectable with normal select and drag-box selection.
- Moving selected advanced entities must not change their shape unexpectedly.
- Hit boxes must remain close to visible geometry; advanced curves must not reintroduce oversized click capture.
- Imported HATCH fills should not block selecting nearby linework with an oversized filled region unless the pointer is inside the visible boundary.

## Visual Requirements

- Curves must render with the same stroke width semantics as existing lines and polylines.
- Native SPLINE/ELLIPSE rendering should avoid obvious diagonal corner artifacts by using sampled draw commands with enough points for smooth display.
- HATCH solid fill should use existing `fillColor` semantics with restrained opacity if the source does not provide a clear fill color.
- Unsupported/preserved/approximated counts should continue using the compact right-panel/status style already established in Phase 8 and Phase 12.

## Copy Requirements

Use Korean user-facing warning messages. Recommended message patterns:

- `SPLINE 엔티티를 편집 가능한 곡선으로 보존했습니다.`
- `ELLIPSE 엔티티를 편집 가능한 타원으로 보존했습니다.`
- `HATCH 패턴 정보를 보존했지만 화면에는 단순 채움으로 표시합니다.`
- `MLEADER 엔티티의 일부 주석 정보를 보존하지 못했습니다.`
- `ATTRIB 텍스트를 편집 가능한 텍스트 객체로 가져왔습니다.`

## Verification

- Playwright core workflow should still pass.
- CAD fidelity check should include advanced entity import and round-trip assertions.
- Manual browser check should confirm imported curve strokes are not visually thicker than existing linework.

