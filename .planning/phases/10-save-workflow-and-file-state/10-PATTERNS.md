# Phase 10: Save Workflow and File State - Patterns

**Created:** 2026-04-26

## Existing Patterns to Preserve

- File operations flow through `FileManager`.
- UI command state and messages live in `App.tsx`.
- Tabs snapshot active document state through `WorkspaceTab`.
- Recent documents are serialized to localStorage and must stay JSON-safe.
- User-facing UI text is Korean.
- Build verification is `npm run build`; file regression is `npm run test:cad-fidelity`.

## New Patterns for Phase 10

### Runtime Save State

Add non-serialized runtime save metadata to tabs. Keep file handles out of recent documents and autosave.

### Format-Aware Save Target

Save target should derive from:

1. active tab runtime save metadata
2. `document.sourceFile`
3. explicit Save As selection

### Fallback Save

Every handle-based write should have a download fallback. The user should still get a file even when the API is unavailable or permission fails.

### Dirty Tracking

Use revision counters or an equivalent deterministic marker. Do not compare large documents on every render.

### Confirm Guards

Use native `window.confirm` for tab close in this phase to avoid introducing a modal system.

## Likely Files

- `src/ui/App.tsx`
- `src/cad/io/fileManager.ts`
- `src/cad/io/fileSystemAccess.ts`
- `src/cad/types.ts`
- `src/styles.css`
- `src/node-globals.d.ts` if narrow browser globals are needed
- `README.md`

## Verification Pattern

After each implementation plan:

- `npm run build`
- `npm run test:cad-fidelity`

After UI/save plans:

- Start dev server
- Smoke-test Save, Save As, dirty markers, close warning
