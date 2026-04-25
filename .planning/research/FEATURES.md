# Feature Research

## Table Stakes

- Full-screen editor layout with toolbar, tool palette, canvas, property panel, and status bar
- Basic entity creation: line, rectangle, circle, polyline, text
- Entity selection, movement, deletion, and property editing
- Grid, zoom, pan, coordinate display
- Undo/redo
- JSON save/load
- DXF import/export for common 2D entities
- Layer visibility, lock state, color, and object assignment

## Important Differentiators

- Clear conversion warnings for unsupported DXF/DWG entities
- Practical DWG workflow through server conversion instead of pretending browser-only DWG support is reliable
- Snap support for endpoints, centers, intersections, and grid points
- Stable internal data model that can survive multiple file formats
- "Save" behavior that respects the opened source format where possible

## Anti-Features

- 3D modeling
- Full AutoCAD parity
- Overly decorative landing page
- Hidden conversion loss
- Blocking UI during large file conversion

## Complexity Notes

DXF/DWG compatibility and accurate hit testing under pan/zoom are the highest-risk areas. Basic drawing tools are straightforward, but reliable file round-tripping requires careful separation of model, mapper, importer, exporter, and conversion API.
