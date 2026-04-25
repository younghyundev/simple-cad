# Pitfalls Research

## Coordinate Transform Drift

- **Warning signs**: Selection boxes do not match drawn shapes after zoom/pan.
- **Prevention**: Centralize world-to-screen and screen-to-world conversion.
- **Phase**: Phase 1

## File Format Coupling

- **Warning signs**: UI components parse DXF directly or know DWG-specific details.
- **Prevention**: Keep CadDocument as the only editor source of truth.
- **Phase**: Phase 1 and Phase 4

## Fake DWG Support

- **Warning signs**: UI exposes DWG save but only downloads JSON or DXF renamed as DWG.
- **Prevention**: DWG paths must go through ConversionApiClient and show clear unsupported status until a backend exists.
- **Phase**: Phase 5

## Unsupported Entity Loss

- **Warning signs**: Imported drawings silently lose blocks, dimensions, or text.
- **Prevention**: Track unsupportedEntities and importWarnings in CadDocument.
- **Phase**: Phase 4

## Scope Creep Into Full CAD

- **Warning signs**: Early phases attempt constraints, 3D, blocks, advanced dimensions, and all AutoCAD behavior.
- **Prevention**: Ship simple 2D edit and file round-trip first.
- **Phase**: All phases
