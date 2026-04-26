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
  "mode": "server",
  "document": {
    "id": "converted-document",
    "name": "drawing.dwg",
    "conversionMode": "server",
    "units": "mm",
    "layers": [],
    "entities": [],
    "unsupportedEntities": [],
    "importWarnings": []
  },
  "warnings": ["Some unsupported INSERT entities were skipped."]
}
```

`mode` is required for production responses. Use `server` for a real conversion backend and
`mock` only for development fixtures. The frontend surfaces this value in the conversion
status panel so a mock DWG result cannot be mistaken for real DWG conversion.

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
  "mode": "server",
  "warnings": ["Text style was approximated."]
}
```

When returning a file blob directly, set `X-CAD-Conversion-Mode: server` or
`X-CAD-Conversion-Mode: mock`.

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
  "mode": "server",
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

## Development Mock Mode

The Vite dev server includes a mock `/api/cad/*` implementation for local UI testing. Mock
responses always return `mode: "mock"` or the `X-CAD-Conversion-Mode: mock` header and warn
that uploaded DWG bytes were not actually converted.

Production deployments should replace the mock server with a real conversion service and
return `mode: "server"`. Do not describe DWG import/export as production-ready unless that
server conversion path is configured.

## Warning Categories

Conversion warnings can include these categories:

- `approximated`: curves or CAD entities were sampled or simplified.
- `unsupported`: entities were skipped.
- `conversion`: the server or importer transformed data into SimpleCAD objects.
- `mock`: development-only responses that do not represent real file conversion.
