# Architecture Research

## Components

- **Editor Shell**: top toolbar, left tools, right properties, bottom status
- **Canvas Engine**: rendering, hit testing, coordinate transforms, viewport state
- **Cad Model**: CadDocument, layers, entities, warnings, source file metadata
- **Command History**: undo/redo snapshots or command objects
- **FileManager**: open, save, save as, download, autosave
- **ImportService**: JSON, DXF, DWG to CadDocument
- **ExportService**: CadDocument to JSON, SVG, DXF, DWG
- **CadModelMapper**: external CAD entity mapping
- **ConversionApiClient**: server conversion for DWG and complex DXF fallback

## Data Flow

1. User imports a file or starts a new document.
2. ImportService converts the source into CadDocument.
3. Editor mutates CadDocument through commands.
4. Canvas Engine renders current document using viewport transforms.
5. FileManager saves through ExportService or ConversionApiClient.
6. Warnings and unsupported entities are preserved in document metadata.

## Build Order

1. Establish internal model and editor shell.
2. Build canvas viewport, grid, selection, and basic entities.
3. Add persistence and undo/redo.
4. Add layers and snap.
5. Add DXF import/export.
6. Add DWG conversion API stubs and adapter boundaries.
