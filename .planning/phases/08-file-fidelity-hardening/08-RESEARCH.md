# Phase 8 Research: File Fidelity Hardening

**Status:** Complete
**Created:** 2026-04-26

## Research Question

What needs to be known to plan Phase 8 well?

## Existing Architecture

- DXF import is implemented in `src/cad/io/importService.ts` using a local pair parser and entity-specific mapping.
- DXF export is implemented in `src/cad/io/exportService.ts`.
- DWG routes through `ConversionApiClient` and Vite development mock API routes.
- Warnings are currently stored as `CadWarning { code, message, entityId? }`.
- UI grouping currently happens in `App.tsx` by `code:message`, which is enough for counts but not enough for severity/category/source details.

## Implementation Findings

### DXF Round-Trip

Round-trip tests should compare normalized `CadDocument` summaries instead of raw DXF text. DXF text ordering and formatting can vary, while the user-visible requirement is whether geometry and editable properties survive.

Recommended comparison dimensions:

- entity type count
- approximate bounds
- layer id/name/color
- stroke color, stroke width, stroke style
- text content and font size
- dimension endpoints, label, offset
- warning codes and unsupported entity counts

### Warning Model

The current warning model should be extended additively to avoid breaking existing UI and import code.

Recommended fields:

- `severity?: 'info' | 'warning' | 'error'`
- `category?: 'preserved' | 'approximated' | 'unsupported' | 'conversion' | 'mock'`
- `sourceType?: string`
- `details?: string`

This allows the UI to group warnings without parsing strings.

### DWG Mode

DWG conversion should expose mode explicitly:

- mock: development Vite middleware
- server: configured backend URL
- client: local DXF path, not DWG

This can be represented through `ConversionResult` warnings and/or `CadDocument.sourceFile` metadata. The simplest low-risk plan is to add mode to conversion result and document metadata without changing current open/save call sites too broadly.

## Risks

- Overfitting fixture tests to current implementation can hide real compatibility problems. Fixtures should assert user-visible properties, not every internal id.
- Adding fields to `CadWarning` without helper functions can spread grouping logic through UI and import services.
- DWG production mode must not claim real conversion is active unless a backend URL is configured.

## Recommended Plan Split

1. DXF fixture and round-trip comparison helpers.
2. Structured warning model and Conversion Status UI.
3. DWG mock/production mode configuration and documentation.

## Verification Architecture

- Unit-like TypeScript scripts for DXF fixture round-trip.
- `npm run build` must continue passing.
- Warning grouping helper should be deterministic and testable without React.
- Manual browser check remains necessary for the right-panel conversion UI.
