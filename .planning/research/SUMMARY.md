# Research Summary

## Key Findings

**Stack:** React + TypeScript + Vite with Canvas rendering and a typed internal CadDocument model is the most pragmatic starting point.

**Table Stakes:** A usable editor must support viewport control, basic 2D entities, selection/editing, undo/redo, layers, JSON persistence, and DXF exchange.

**Watch Out For:** DWG support should be server-backed and adapter-based. The app must not silently drop unsupported CAD entities during conversion.

## Recommended Direction

Start with the internal model and canvas editor before investing deeply in file conversion. Once the editing loop works, add JSON/SVG, then DXF, then DWG conversion API integration.
