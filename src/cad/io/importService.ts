import type { CadDocument, CadEntity, CadEntityBase, CadLayer } from '../types';
import { dxfAciToHex } from './dxfColor';
import { dxfLineTypeToStrokeStyle, dxfLineWeightToStrokeWidth } from './dxfStyle';

export class ImportService {
  async fromJson(text: string): Promise<CadDocument> {
    return JSON.parse(text) as CadDocument;
  }

  async fromDxf(text: string): Promise<CadDocument> {
    const pairs = parseDxfPairs(text);
    const layerDefinitions = parseLayerDefinitions(pairs);
    const entityChunks = collectEntityChunks(pairs);
    const entities: CadEntity[] = [];
    const layerNames = new Set<string>(['0', ...layerDefinitions.keys()]);
    const unsupportedEntities = [];

    for (const { entityType, chunk } of entityChunks) {
      const layerId = valueFor(chunk, '8') || '0';
      const layerDefinition = layerDefinitions.get(layerId);
      const strokeColor = dxfAciToHex(valueFor(chunk, '62')) ?? layerDefinition?.color ?? '#1f2937';
      const strokeStyle = dxfLineTypeToStrokeStyle(valueFor(chunk, '6') ?? layerDefinition?.lineType);
      const strokeWidth = dxfLineWeightToStrokeWidth(
        valueFor(chunk, '370') ?? layerDefinition?.lineWeight,
      );
      layerNames.add(layerId);

      if (entityType === 'LINE') {
        entities.push({
          ...baseEntity(layerId, { strokeColor, strokeStyle, strokeWidth }),
          type: 'line',
          x1: numberFor(chunk, '10'),
          y1: -numberFor(chunk, '20'),
          x2: numberFor(chunk, '11'),
          y2: -numberFor(chunk, '21'),
        });
      } else if (entityType === 'CIRCLE') {
        entities.push({
          ...baseEntity(layerId, { strokeColor, strokeStyle, strokeWidth, visualType: 'circle' }),
          type: 'circle',
          cx: numberFor(chunk, '10'),
          cy: -numberFor(chunk, '20'),
          radius: numberFor(chunk, '40'),
        });
      } else if (entityType === 'ARC') {
        entities.push({
          ...baseEntity(layerId, { strokeColor, strokeStyle, strokeWidth }),
          type: 'arc',
          cx: numberFor(chunk, '10'),
          cy: -numberFor(chunk, '20'),
          radius: numberFor(chunk, '40'),
          startAngle: numberFor(chunk, '50'),
          endAngle: numberFor(chunk, '51'),
        });
      } else if (entityType === 'TEXT') {
        entities.push({
          ...baseEntity(layerId, { strokeColor, strokeStyle, strokeWidth, fillColor: strokeColor }),
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
          ...baseEntity(layerId, { strokeColor, strokeStyle, strokeWidth }),
          type: 'polyline',
          points: xs.map((x, pointIndex) => ({ x, y: ys[pointIndex] ?? 0 })),
        });
      } else if (entityType) {
        unsupportedEntities.push({
          sourceType: entityType,
          reason: 'This DXF entity is not supported by the first importer.',
        });
      }
    }

    const layers: CadLayer[] = [...layerNames].map((name, index) => ({
      id: name,
      name,
      color: layerDefinitions.get(name)?.color ?? (index === 0 ? '#2563eb' : '#7c3aed'),
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

type DxfEntityChunk = {
  entityType: string;
  chunk: DxfPair[];
};

function parseDxfPairs(text: string): DxfPair[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const pairs: DxfPair[] = [];
  for (let index = 0; index < lines.length - 1; index += 2) {
    pairs.push({ code: lines[index].trim(), value: lines[index + 1].trim() });
  }
  return pairs;
}

function collectEntityChunks(pairs: DxfPair[]): DxfEntityChunk[] {
  const chunks: DxfEntityChunk[] = [];
  let currentSection: string | null = null;
  const hasEntitiesSection = pairs.some(
    (pair, index) =>
      pair.code === '0' &&
      pair.value === 'SECTION' &&
      pairs[index + 1]?.code === '2' &&
      pairs[index + 1].value === 'ENTITIES',
  );

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code !== '0') continue;

    if (pair.value === 'SECTION') {
      currentSection = pairs[index + 1]?.code === '2' ? pairs[index + 1].value : null;
      continue;
    }
    if (pair.value === 'ENDSEC') {
      currentSection = null;
      continue;
    }
    if (hasEntitiesSection && currentSection !== 'ENTITIES') continue;
    if (!hasEntitiesSection && currentSection && currentSection !== 'ENTITIES') continue;
    if (['SECTION', 'ENDSEC', 'EOF'].includes(pair.value)) continue;

    const chunk = readChunk(pairs, index + 1);
    chunks.push({ entityType: pair.value, chunk });
  }

  return chunks;
}

function parseLayerDefinitions(
  pairs: DxfPair[],
): Map<string, { color?: string; lineType?: string; lineWeight?: string }> {
  const layers = new Map<string, { color?: string; lineType?: string; lineWeight?: string }>();

  for (let index = 0; index < pairs.length; index += 1) {
    if (pairs[index].code !== '0' || pairs[index].value !== 'LAYER') continue;

    const chunk = readChunk(pairs, index + 1);
    const name = valueFor(chunk, '2');
    const color = dxfAciToHex(valueFor(chunk, '62'));
    const lineType = valueFor(chunk, '6');
    const lineWeight = valueFor(chunk, '370');
    if (name) layers.set(name, { color: color ?? undefined, lineType, lineWeight });
  }

  return layers;
}

function readChunk(pairs: DxfPair[], startIndex: number): DxfPair[] {
  const chunk = [];
  let cursor = startIndex;
  while (cursor < pairs.length && pairs[cursor].code !== '0') {
    chunk.push(pairs[cursor]);
    cursor += 1;
  }
  return chunk;
}

function baseEntity(
  layerId: string,
  options: {
    strokeColor?: string;
    strokeStyle?: 'solid' | 'dashed';
    strokeWidth?: number;
    fillColor?: string;
    visualType?: 'circle' | 'other';
  } = {},
): CadEntityBase {
  const strokeColor = options.strokeColor ?? '#1f2937';
  return {
    id: `dxf-entity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    layerId,
    rotation: 0,
    strokeColor,
    fillColor:
      options.fillColor ??
      (options.visualType === 'circle' ? 'rgba(37, 99, 235, 0.08)' : 'transparent'),
    strokeWidth: options.strokeWidth ?? 2,
    strokeStyle: options.strokeStyle ?? 'solid',
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
