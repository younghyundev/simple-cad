# CAD Conversion API

DWG support is intentionally server-backed. The browser editor uses `CadDocument` as the source of truth and calls these endpoints for DWG import/export and complex CAD conversion fallback.

## POST `/api/cad/import`

Imports `.dwg` or complex `.dxf` files.

**Request**

- `multipart/form-data`
- `file`: CAD file

**Response**

```json
{
  "document": {
    "id": "converted-document",
    "name": "drawing.dwg",
    "units": "mm",
    "layers": [],
    "entities": [],
    "unsupportedEntities": [],
    "importWarnings": []
  },
  "warnings": ["Some unsupported INSERT entities were skipped."]
}
```

## POST `/api/cad/export`

Exports an internal `CadDocument` to `dwg`, `dxf`, or `svg`.

**Request**

```json
{
  "targetFormat": "dwg",
  "document": {
    "id": "current-document",
    "name": "drawing",
    "units": "mm",
    "layers": [],
    "entities": []
  }
}
```

**Response Option A: file blob**

Return the converted file directly with an appropriate `Content-Type`.

**Response Option B: JSON download URL**

```json
{
  "downloadUrl": "/api/cad/jobs/job-123/result",
  "warnings": ["Text style was approximated."]
}
```

## POST `/api/cad/validate`

Validates a CAD file before conversion.

**Request**

- `multipart/form-data`
- `file`: CAD file

**Response**

```json
{
  "supported": true,
  "entityTypes": ["LINE", "CIRCLE", "TEXT"],
  "warnings": []
}
```

## GET `/api/cad/jobs/:jobId`

For large conversion jobs.

```json
{
  "status": "queued | running | complete | failed",
  "progress": 0.5,
  "downloadUrl": "/api/cad/jobs/job-123/result",
  "error": null
}
```

## Engine Adapter Contract

The backend should hide the chosen conversion engine behind an adapter.

Candidate engines:

- ODA File Converter
- Autodesk Platform Services
- LibreDWG
- Commercial CAD conversion SDK

The frontend should not depend on the engine choice.
