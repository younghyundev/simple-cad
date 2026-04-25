---
status: partial
phase: 07-cross-tab-reference-copy-and-paste
source: [07-VERIFICATION.md]
started: 2026-04-26
updated: 2026-04-26
---

## Current Test

Awaiting browser verification for Phase 7 CAD copy/paste interactions.

## Tests

### 1. Cross-tab standard copy/paste
expected: Select multiple entities in tab A, copy with Ctrl/Cmd+C, switch to tab B, paste with Ctrl/Cmd+V, and see newly selected pasted entities.
result: [pending]

### 2. Destination-tab undo
expected: Undo in tab B removes the pasted batch while tab A remains unchanged.
result: [pending]

### 3. Right-click context menu
expected: Right-click selected geometry and see `복사`, `참조 복사`, `붙여넣기`, `참조 붙여넣기`, and `삭제` according to clipboard/selection state.
result: [pending]

### 4. Reference copy/paste using another object's anchor
expected: `참조 복사` stores a clicked snapped point from another object, such as that object's center, and `참조 붙여넣기` places copied entities in another file/tab using the corresponding clicked center point while preserving the same relative offset.
result: [pending]

### 5. Escape cancellation
expected: Escape while selecting a reference point cancels the mode and shows `참조 작업을 취소했습니다.`.
result: [pending]

### 6. Text editing copy/paste safety
expected: While inline text editing is active, Ctrl/Cmd+C and Ctrl/Cmd+V affect text content instead of the CAD clipboard.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

None reported yet.
