# Phase 11 Patterns

## Existing Verification Patterns

- `npm run build` is the primary type and production build gate.
- `npm run test:cad-fidelity` builds and runs `src/cad/io/roundTripCheck.ts`.
- Phase verification docs record command output summaries instead of storing raw logs.

## Existing App Patterns

- App-level commands live in `src/ui/App.tsx`.
- Canvas input orchestration lives in `src/ui/CadCanvas.tsx`.
- CAD document operations should stay in `src/cad/*` and remain framework-independent where practical.
- File IO uses `FileManager` as the app-facing adapter.

## Phase 11 Implementation Patterns

- Add test selectors sparingly and only to stable UI surfaces.
- Keep Playwright tests under `tests/e2e/`.
- Keep script-level checks under `src/cad/io/` or `src/cad/performance/` depending on ownership.
- Add npm scripts for every new verification path.
- Avoid adding large checked-in generated fixtures; generate deterministic large documents in code.

## Verification Pattern

Every plan should keep these checks green:

- `npm run build`
- `npm run test:cad-fidelity`

New checks introduced by Phase 11 should become part of the final verification set:

- `npm run test:e2e`
- `npm run test:performance`
- conversion failure regression command, if separate from fidelity
