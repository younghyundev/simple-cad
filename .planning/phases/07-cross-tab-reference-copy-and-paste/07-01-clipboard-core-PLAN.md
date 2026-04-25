---
phase: 7
plan: 1
title: Clipboard core and paste transforms
type: execute
wave: 1
depends_on: []
files_modified:
  - src/cad/clipboard.ts
  - src/cad/entityGeometry.ts
  - src/cad/types.ts
autonomous: true
requirements:
  - ENTY-02
  - ENTY-03
  - ENTY-07
  - EDIT-01
---

<objective>
Create pure CAD clipboard helpers that can clone selected entities, assign fresh IDs, apply paste/reference deltas, and remap missing layers before UI wiring begins.
</objective>

<threat_model>
No network, authentication, file system, or user-provided script execution is introduced. The main integrity threat is corrupting the active `CadDocument` through ID collisions, shared nested point references, or invalid layer references. Mitigate by deep-cloning entity data, generating new IDs for every pasted entity, and validating `layerId` against the destination document before insertion.
</threat_model>

<tasks>
  <task id="7-1-1" type="execute">
    <title>Add typed clipboard payload helpers</title>
    <read_first>
      - src/cad/types.ts
      - src/cad/entityGeometry.ts
      - .planning/phases/07-cross-tab-reference-copy-and-paste/07-CONTEXT.md
      - .planning/phases/07-cross-tab-reference-copy-and-paste/07-UI-SPEC.md
    </read_first>
    <files>
      - src/cad/clipboard.ts
    </files>
    <action>
      Create `src/cad/clipboard.ts` exporting `CadClipboardPayload`, `createClipboardPayload`, and `pasteClipboardPayload`. `CadClipboardPayload` must contain `entities: CadEntity[]`, `sourceBasePoint?: CadPoint`, and `createdAt: string`. `createClipboardPayload(entities: CadEntity[], sourceBasePoint?: CadPoint)` must deep-copy the input entities and preserve the optional source base point. `pasteClipboardPayload(payload, options)` must accept `{ destinationDocument: CadDocument; destinationBasePoint?: CadPoint; fallbackOffset?: CadPoint }` and return `{ entities: CadEntity[]; entityIds: string[] }`.
    </action>
    <acceptance_criteria>
      - `src/cad/clipboard.ts` contains `export type CadClipboardPayload`.
      - `src/cad/clipboard.ts` contains `export function createClipboardPayload`.
      - `src/cad/clipboard.ts` contains `export function pasteClipboardPayload`.
      - `src/cad/clipboard.ts` imports `CadDocument`, `CadEntity`, and `CadPoint` from `./types`.
    </acceptance_criteria>
  </task>

  <task id="7-1-2" type="execute">
    <title>Clone entities with new IDs and layer fallback</title>
    <read_first>
      - src/cad/clipboard.ts
      - src/cad/types.ts
    </read_first>
    <files>
      - src/cad/clipboard.ts
    </files>
    <action>
      Implement cloning so every pasted entity gets an ID in the form `copy-${entity.type}-${Date.now()}-${index}-${randomSuffix}` or another collision-resistant format beginning with `copy-`. If `destinationDocument.layers` does not contain the copied entity's `layerId`, replace it with `destinationDocument.layers[0]?.id ?? 'layer-0'`. Deep-copy nested geometry including polyline `points`, dimension `startPoint` and `endPoint`, and all primitive entity fields. Preserve editable fields including `strokeColor`, `fillColor`, `strokeWidth`, `strokeStyle`, `content`, `fontSize`, `label`, `labelMode`, and `labelOffset`.
    </action>
    <acceptance_criteria>
      - `src/cad/clipboard.ts` contains `copy-`.
      - `src/cad/clipboard.ts` contains `destinationDocument.layers`.
      - `src/cad/clipboard.ts` contains `layer-0`.
      - `src/cad/clipboard.ts` contains handling for `entity.type === 'polyline'`.
      - `src/cad/clipboard.ts` contains handling for `entity.type === 'dimension'`.
    </acceptance_criteria>
  </task>

  <task id="7-1-3" type="execute">
    <title>Apply standard and reference paste deltas</title>
    <read_first>
      - src/cad/clipboard.ts
      - src/cad/entityGeometry.ts
    </read_first>
    <files>
      - src/cad/clipboard.ts
    </files>
    <action>
      Use `translateEntity` from `src/cad/entityGeometry.ts` to move pasted entities. If both `payload.sourceBasePoint` and `options.destinationBasePoint` exist, use delta `{ x: destinationBasePoint.x - sourceBasePoint.x, y: destinationBasePoint.y - sourceBasePoint.y }`. Otherwise use `options.fallbackOffset ?? { x: 20, y: 20 }`. Return pasted entities after ID/layer remapping and translation.
    </action>
    <acceptance_criteria>
      - `src/cad/clipboard.ts` imports `translateEntity` from `./entityGeometry`.
      - `src/cad/clipboard.ts` contains `destinationBasePoint.x - sourceBasePoint.x`.
      - `src/cad/clipboard.ts` contains `fallbackOffset`.
      - `src/cad/clipboard.ts` contains `{ x: 20, y: 20 }`.
    </acceptance_criteria>
  </task>
</tasks>

<verification>
- Run `npm run build`.
- Verify `src/cad/clipboard.ts` exports the required payload and helper functions.
- Manually inspect that no React/UI imports exist in `src/cad/clipboard.ts`.
</verification>

<success_criteria>
- Clipboard payload creation is pure and app-independent.
- Pasted entities always receive new IDs.
- Pasted entities always have a valid destination layer.
- Reference paste and standard paste both use a single translation path.
</success_criteria>

<must_haves>
- New IDs for every pasted entity.
- Deep copy for nested geometry.
- Layer fallback to destination default layer.
- Delta behavior for reference and standard paste.
</must_haves>
