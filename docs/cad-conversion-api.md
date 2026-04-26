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

**Async response**

Large files may return a job instead of a document:

```json
{
  "jobId": "job-123",
  "status": "queued",
  "progress": 0,
  "mode": "server",
  "warnings": []
}
```

The frontend polls `/api/cad/jobs/job-123` until the job returns `complete` or `failed`.

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

**Response Option C: async job**

```json
{
  "jobId": "job-456",
  "status": "queued",
  "progress": 0,
  "mode": "server",
  "warnings": []
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

Import jobs return `document` on completion. Export jobs return `downloadUrl` on completion.

Failed jobs should return:

```json
{
  "status": "failed",
  "progress": 0.42,
  "category": "conversion",
  "error": "Spline conversion failed."
}
```

## Error Contract

Non-2xx responses should be JSON when possible:

```json
{
  "category": "unsupported",
  "message": "This DWG version is not supported."
}
```

Supported categories:

- `network`: the browser could not reach the conversion API.
- `server`: the conversion service returned a 5xx response.
- `unsupported`: the file, version, or requested operation is unsupported.
- `conversion`: the engine failed while translating CAD data.
- `timeout`: request or job polling timed out.
- `invalid-response`: response shape did not match this contract.

HTTP status mapping used by the frontend:

- `400`, `415`, `422`: `unsupported`
- `408`, `504`: `timeout`
- `500+`: `server`
- Other non-2xx statuses: `conversion`

## Frontend Configuration

Set these Vite environment variables for production or staging:

```bash
VITE_CAD_CONVERSION_API_BASE_URL=https://your-converter.example.com/api/cad
VITE_CAD_CONVERSION_TIMEOUT_MS=60000
VITE_CAD_CONVERSION_POLL_MS=1000
VITE_CAD_CONVERSION_JOB_TIMEOUT_MS=180000
```

If `VITE_CAD_CONVERSION_API_BASE_URL` is not set, the frontend calls `/api/cad`.
The production backend should enforce file size limits, authentication, request quotas,
temporary file cleanup, and content-type validation independently of the browser.

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

Mock scenarios can be triggered with `?scenario=...`, the `X-SimpleCAD-Mock-Scenario` header,
or `mockScenario` in the JSON export body:

- `immediate`: default immediate success response.
- `async-success`: returns a queued job, then a completed job.
- `async-failure`: returns a queued job, then a failed job.
- `unsupported`: returns a 415 unsupported error payload.
- `server-error`: returns a 503 server error payload.

Production deployments should replace the mock server with a real conversion service and
return `mode: "server"`. Do not describe DWG import/export as production-ready unless that
server conversion path is configured.

## Warning Categories

Conversion warnings can include these categories:

- `approximated`: curves or CAD entities were sampled or simplified.
- `unsupported`: entities were skipped.
- `conversion`: the server or importer transformed data into SimpleCAD objects.
- `mock`: development-only responses that do not represent real file conversion.
