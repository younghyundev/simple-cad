# Stack Research

## Recommendation

- **Frontend**: React + TypeScript + Vite
- **Rendering**: HTML Canvas for primary drawing surface, with explicit world/screen coordinate transforms
- **State**: Local reducer/store structure with history snapshots for undo/redo
- **Icons**: lucide-react
- **Persistence**: File System Access API where available, download fallback elsewhere, IndexedDB/localStorage for autosave
- **DXF**: Adapter around a DXF parser/exporter, isolated from the editor model
- **DWG**: Server-side conversion API with adapter implementations for ODA, Autodesk Platform Services, LibreDWG, or commercial SDKs

## Rationale

Canvas gives predictable performance for larger 2D drawings and avoids excessive DOM node count. A typed internal model keeps editing behavior independent from file formats. DXF/DWG should be treated as import/export adapters, not as the editor's source of truth.

## Avoid

- Building DWG parsing directly in the browser.
- Coupling UI entities directly to DXF group-code parsing.
- Starting with a full CAD kernel before validating basic editing workflows.

## Confidence

High for React/TypeScript/Canvas and internal model architecture. Medium for specific DXF/DWG conversion engines because the final choice depends on license, deployment, and target DWG versions.
