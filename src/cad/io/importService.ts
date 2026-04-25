import type { CadDocument, CadEntity, CadEntityBase, CadLayer } from '../types';

export class ImportService {
  async fromJson(text: string): Promise<CadDocument> {
    return JSON.parse(text) as CadDocument;
  }

  async fromDxf(text: string): Promise<CadDocument> {
    const pairs = parseDxfPairs(text);
    const entities: CadEntity[] = [];
    const layerNames = new Set<string>(['0']);
    const unsupportedEntities = [];

    for (let index = 0; index < pairs.length; index += 1) {
      const pair = pairs[index];
      if (pair.code !== '0') continue;

      const entityType = pair.value;
      const chunk = [];
      let cursor = index + 1;
      while (cursor < pairs.length && pairs[cursor].code !== '0') {
        chunk.push(pairs[cursor]);
        cursor += 1;
      }

      const layerId = valueFor(chunk, '8') || '0';
      layerNames.add(layerId);

      if (entityType === 'LINE') {
        entities.push({
          ...baseEntity(layerId),
          type: 'line',
          x1: numberFor(chunk, '10'),
          y1: -numberFor(chunk, '20'),
          x2: numberFor(chunk, '11'),
          y2: -numberFor(chunk, '21'),
        });
      } else if (entityType === 'CIRCLE') {
        entities.push({
          ...baseEntity(layerId, 'circle'),
          type: 'circle',
          cx: numberFor(chunk, '10'),
          cy: -numberFor(chunk, '20'),
          radius: numberFor(chunk, '40'),
        });
      } else if (entityType === 'ARC') {
        entities.push({
          ...baseEntity(layerId),
          type: 'arc',
          cx: numberFor(chunk, '10'),
          cy: -numberFor(chunk, '20'),
          radius: numberFor(chunk, '40'),
          startAngle: numberFor(chunk, '50'),
          endAngle: numberFor(chunk, '51'),
        });
      } else if (entityType === 'TEXT') {
        entities.push({
          ...baseEntity(layerId),
          type: 'text',
          x: numberFor(chunk, '10'),
          y: -numberFor(chunk, '20'),
          content: valueFor(chunk, '1') || 'TEXT',
          fontSize: numberFor(chunk, '40') || 16,
        });
      } else if (entityType === 'LWPOLYLINE') {
        const xs = valuesFor(chunk, '10').map(Number);
        const ys = valuesFor(chunk, '20').map((value) => -Number(value));
        entities.push({
          ...baseEntity(layerId),
          type: 'polyline',
          points: xs.map((x, pointIndex) => ({ x, y: ys[pointIndex] ?? 0 })),
        });
      } else if (['SECTION', 'ENDSEC', 'EOF'].includes(entityType)) {
        // Structural markers are not drawing entities.
      } else if (entityType) {
        unsupportedEntities.push({
          sourceType: entityType,
          reason: 'This DXF entity is not supported by the first importer.',
        });
      }

      index = cursor - 1;
    }

    const layers: CadLayer[] = [...layerNames].map((name, index) => ({
      id: name,
      name,
      color: index === 0 ? '#2563eb' : '#7c3aed',
      visible: true,
      locked: false,
    }));

    return {
      id: `dxf-${Date.now()}`,
      name: 'Imported DXF',
      units: 'mm',
      layers,
      entities,
      unsupportedEntities,
      importWarnings: unsupportedEntities.length
        ? [
            {
              code: 'UNSUPPORTED_DXF_ENTITIES',
              message: `${unsupportedEntities.length} unsupported DXF entities were skipped.`,
            },
          ]
        : [],
    };
  }

  async fromDwg(_file: File): Promise<CadDocument> {
    throw new Error('DWG import requires the conversion API.');
  }
}

type DxfPair = {
  code: string;
  value: string;
};

function parseDxfPairs(text: string): DxfPair[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const pairs: DxfPair[] = [];
  for (let index = 0; index < lines.length - 1; index += 2) {
    pairs.push({ code: lines[index].trim(), value: lines[index + 1].trim() });
  }
  return pairs;
}

function baseEntity(layerId: string, visualType: 'circle' | 'other' = 'other'): CadEntityBase {
  return {
    id: `dxf-entity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    layerId,
    rotation: 0,
    strokeColor: '#1f2937',
    fillColor: visualType === 'circle' ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
    strokeWidth: 2,
    strokeStyle: 'solid' as const,
    visible: true,
    locked: false,
  };
}

function valueFor(pairs: DxfPair[], code: string): string | undefined {
  return pairs.find((pair) => pair.code === code)?.value;
}

function valuesFor(pairs: DxfPair[], code: string): string[] {
  return pairs.filter((pair) => pair.code === code).map((pair) => pair.value);
}

function numberFor(pairs: DxfPair[], code: string): number {
  return Number(valueFor(pairs, code) ?? 0);
}
