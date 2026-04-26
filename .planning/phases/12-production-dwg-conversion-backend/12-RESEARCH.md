# Phase 12 Research: Production DWG Conversion Backend

**Date:** 2026-04-26
**Status:** Ready for planning

## Official Source Findings

Autodesk APS Model Derivative API is positioned for translating designs to web/rendering derivative formats such as SVF/SVF2 and extracting metadata/object hierarchy/properties/geometries. APS also documents broader 2D/3D conversion workflows and file translation/download flows. This is useful for cloud-backed conversion or viewing workflows, but the frontend should still treat it as an engine behind the SimpleCAD conversion server contract.

Autodesk RealDWG is described as Autodesk's native DWG/DXF read/write SDK for C++ and .NET, with current DWG compatibility and licensing/platform requirements. It is a strong production backend candidate but should remain server-side and license-isolated from this repo.

GNU LibreDWG can read/write DXF/DWG but its own manual notes DXF writing is less stable than unfree Teigha/ODA-class libraries and may fail in AutoCAD for some files. It can be useful for open-source experiments or fallback checks but should not be treated as the only production-quality path.

## Architecture Implication

SimpleCAD should not choose a single engine in browser code. It should harden the boundary:

- browser/client sends CAD files or `CadDocument`
- conversion server handles engine selection and credentials
- server response returns normalized `CadDocument`, file blob/download URL, warnings, mode, and job status
- frontend distinguishes mock/server/failure states clearly

## Recommended Phase 12 Shape

1. Contract and configuration hardening
   - Add client config for base URL, timeout, mode expectations.
   - Normalize error categories.

2. Async job support
   - Support job responses from import/export.
   - Poll status endpoint until complete/failed/timeout.

3. User-facing status integration
   - Show conversion state in statusbar/panel.
   - Surface categorized failures in Korean.

4. Mock/test/docs
   - Extend Vite mock API with failure and job paths.
   - Add conversion regression coverage.
   - Update `docs/cad-conversion-api.md` and README.

## Risks

- If UI code assumes APS/RealDWG-specific payloads, future engine swaps will be expensive.
- Job polling needs timeout and invalid response handling to avoid silent hangs.
- Mock responses must remain visibly mock so users do not mistake local dev conversion for production DWG support.

## Sources

- Autodesk APS Model Derivative API overview: https://forge.autodesk.com/developer/overview/model-derivative-api
- Autodesk APS 2D/3D conversions: https://aps.autodesk.com/model-derivative-api-2d-3d-conversions
- Autodesk RealDWG API overview: https://forge.autodesk.com/developer/overview/realdwg-api
- GNU LibreDWG DXF manual: https://www.gnu.org/software/libredwg/manual/html_node/DXF.html
