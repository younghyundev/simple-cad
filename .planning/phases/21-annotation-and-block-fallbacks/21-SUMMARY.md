# Phase 21 Summary: Annotation and Block Fallbacks

## Completed

- Preserved TEXT/MTEXT rotation, alignment, height, and multiline content as editable SimpleCAD text entities.
- Added informational preservation warnings for TEXT/MTEXT with text length, line count, rotation, height, and alignment details.
- Enriched DIMENSION fallback warnings with raw dimension type, label, measured value, and start/end reference points.
- Enriched ATTRIB/ATTDEF warnings with tag, prompt, text length, rotation, height, and insertion point details.
- Preserved INSERT transform context in warnings, including insertion point, scale, rotation, nested depth, attribute count, and unsupported child count.
- Applied INSERT rotation and scale to transformed text fallback entities.
- Exported text rotation and alignment back to DXF TEXT/MTEXT where supported.
- Extended conversion regression coverage for rotated text, centered alignment, dimension measured values, and transformed INSERT fallback details.

## Verification

- `npm run build` passed.
- `npm run test:conversion` passed.
- `npm run verify` passed, including CAD fidelity, conversion, performance, and Playwright E2E checks.

## Notes

- Full CAD dimension style editing remains out of scope; DIMENSION entities are still editable SimpleCAD dimension fallbacks with richer preserved metadata.
- BLOCK/INSERT is still exploded into editable child entities, but transform and attribute context is now retained in structured warnings.
