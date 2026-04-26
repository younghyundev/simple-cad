---
status: testing
phase: 07-cross-tab-reference-copy-and-paste
source: [07-VERIFICATION.md]
started: 2026-04-26
updated: 2026-04-26
---

## Current Test

number: 2
name: Destination-tab undo
expected: |
  Undo in tab B removes the pasted batch while tab A remains unchanged.
awaiting: user response

## Tests

### 1. Cross-tab standard copy/paste
expected: Select multiple entities in tab A, copy with Ctrl/Cmd+C, switch to tab B, paste with Ctrl/Cmd+V, and see newly selected pasted entities.
result: pass
note: "사용자는 통과를 확인했고, 별도 UX 문제로 선택 히트박스가 커서 드래그 선택이 객체 이동으로 오인된다고 보고함."

### 2. Destination-tab undo
expected: Undo in tab B removes the pasted batch while tab A remains unchanged.
result: [pending]

### 3. Right-click context menu
expected: Right-click selected geometry and see `복사`, `참조 복사`, `붙여넣기`, `참조 붙여넣기`, and `삭제` according to clipboard/selection state.
result: [pending]

### 4. Reference copy/paste using another object's anchor
expected: `참조 복사` stores a clicked snapped point from another object, such as that object's center, and both `붙여넣기`/Ctrl/Cmd+V and `참조 붙여넣기` enter reference paste mode. The copied geometry shows as a dashed overlay while the mouse is on the destination anchor; clicking the corresponding center point places the copied entities while preserving the same relative offset.
result: [pending]

### 5. Escape cancellation
expected: Escape while selecting a reference point cancels the mode and shows `참조 작업을 취소했습니다.`.
result: [pending]

### 6. Text editing copy/paste safety
expected: While inline text editing is active, Ctrl/Cmd+C and Ctrl/Cmd+V affect text content instead of the CAD clipboard.
result: [pending]

## Summary

total: 6
passed: 1
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

None reported yet.
