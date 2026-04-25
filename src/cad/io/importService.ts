import type {
  CadDocument,
  CadEntity,
  CadEntityBase,
  CadLayer,
  CadPoint,
  CadWarning,
  UnsupportedCadEntity,
} from '../types';
import { dxfAciToHex } from './dxfColor';
import { dxfLineTypeToStrokeStyle, dxfLineWeightToStrokeWidth } from './dxfStyle';
import { decodeDxfText } from './dxfText';

export class ImportService {
  async fromJson(text: string): Promise<CadDocument> {
    return JSON.parse(text) as CadDocument;
  }

  async fromDxf(text: string): Promise<CadDocument> {
    const pairs = parseDxfPairs(text);
    const layerDefinitions = parseLayerDefinitions(pairs);
    const blockDefinitions = collectBlockDefinitions(pairs);
    const entityChunks = collectEntityChunks(pairs);
    const entities: CadEntity[] = [];
    const layerNames = new Set<string>(['0', ...layerDefinitions.keys()]);
    const unsupportedEntities = [];
    const importWarnings: CadWarning[] = [];

    for (const { entityType, chunk } of entityChunks) {
      if (entityType === 'INSERT') {
        const blockName = valueFor(chunk, '2');
        const block = blockName ? blockDefinitions.get(blockName) : undefined;
        if (blockName && block) {
          const transform = insertTransform(chunk, block.basePoint);
          const insertedEntities = [];
          for (const blockEntity of block.entities) {
            const result = importDxfEntity(blockEntity.entityType, blockEntity.chunk, layerDefinitions, {
              ...transform,
              fallbackLayerId: valueFor(chunk, '8') || '0',
            });
            entities.push(...result.entities);
            insertedEntities.push(...result.entities);
            result.layerIds.forEach((layerId) => layerNames.add(layerId));
            importWarnings.push(...result.importWarnings);
            unsupportedEntities.push(...result.unsupportedEntities);
          }
          importWarnings.push({
            code: 'DXF_INSERT_EXPLODED',
            message: `INSERT ${blockName} 블록을 ${insertedEntities.length}개 편집 객체로 펼쳤습니다.`,
          });
        } else {
          unsupportedEntities.push({
            sourceType: entityType,
            reason: blockName ? `Missing BLOCK definition: ${blockName}` : 'INSERT has no block name.',
          });
        }
      } else if (entityType) {
        const result = importDxfEntity(entityType, chunk, layerDefinitions);
        entities.push(...result.entities);
        result.layerIds.forEach((layerId) => layerNames.add(layerId));
        importWarnings.push(...result.importWarnings);
        unsupportedEntities.push(...result.unsupportedEntities);
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
      importWarnings: [
        ...importWarnings,
        ...(unsupportedEntities.length
          ? [
              {
                code: 'UNSUPPORTED_DXF_ENTITIES',
                message: `${unsupportedEntities.length} unsupported DXF entities were skipped.`,
              },
            ]
          : []),
      ],
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

type DxfBlockDefinition = {
  name: string;
  basePoint: CadPoint;
  entities: DxfEntityChunk[];
};

type InsertTransform = {
  insertionPoint: CadPoint;
  basePoint: CadPoint;
  scaleX: number;
  scaleY: number;
  rotation: number;
  fallbackLayerId?: string;
};

type ImportEntityResult = {
  entities: CadEntity[];
  layerIds: string[];
  importWarnings: CadWarning[];
  unsupportedEntities: UnsupportedCadEntity[];
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

function collectBlockDefinitions(pairs: DxfPair[]): Map<string, DxfBlockDefinition> {
  const blocks = new Map<string, DxfBlockDefinition>();
  let currentSection: string | null = null;
  let currentBlock: DxfBlockDefinition | null = null;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code !== '0') continue;

    if (pair.value === 'SECTION') {
      currentSection = pairs[index + 1]?.code === '2' ? pairs[index + 1].value : null;
      continue;
    }
    if (pair.value === 'ENDSEC') {
      currentSection = null;
      currentBlock = null;
      continue;
    }
    if (currentSection !== 'BLOCKS') continue;

    if (pair.value === 'BLOCK') {
      const chunk = readChunk(pairs, index + 1);
      const name = valueFor(chunk, '2');
      if (!name) {
        currentBlock = null;
        continue;
      }
      currentBlock = {
        name,
        basePoint: { x: numberFor(chunk, '10'), y: -numberFor(chunk, '20') },
        entities: [],
      };
      blocks.set(name, currentBlock);
      continue;
    }

    if (pair.value === 'ENDBLK') {
      currentBlock = null;
      continue;
    }

    if (currentBlock && !['SECTION', 'ENDSEC', 'EOF'].includes(pair.value)) {
      currentBlock.entities.push({
        entityType: pair.value,
        chunk: readChunk(pairs, index + 1),
      });
    }
  }

  return blocks;
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

function importDxfEntity(
  entityType: string,
  chunk: DxfPair[],
  layerDefinitions: Map<string, { color?: string; lineType?: string; lineWeight?: string }>,
  transform?: InsertTransform,
): ImportEntityResult {
  const sourceLayerId = valueFor(chunk, '8') || '0';
  const layerId =
    transform?.fallbackLayerId && sourceLayerId === '0' ? transform.fallbackLayerId : sourceLayerId;
  const layerDefinition = layerDefinitions.get(layerId);
  const strokeColor = dxfAciToHex(valueFor(chunk, '62')) ?? layerDefinition?.color ?? '#1f2937';
  const strokeStyle = dxfLineTypeToStrokeStyle(valueFor(chunk, '6') ?? layerDefinition?.lineType);
  const strokeWidth = dxfLineWeightToStrokeWidth(
    valueFor(chunk, '370') ?? layerDefinition?.lineWeight,
  );
  const entityBase = { strokeColor, strokeStyle, strokeWidth };
  const result: ImportEntityResult = {
    entities: [],
    layerIds: [layerId],
    importWarnings: [],
    unsupportedEntities: [],
  };

  if (entityType === 'LINE') {
    result.entities.push(
      transformEntity(
        {
          ...baseEntity(layerId, entityBase),
          type: 'line',
          x1: numberFor(chunk, '10'),
          y1: -numberFor(chunk, '20'),
          x2: numberFor(chunk, '11'),
          y2: -numberFor(chunk, '21'),
        },
        transform,
      ),
    );
  } else if (entityType === 'CIRCLE') {
    result.entities.push(
      transformEntity(
        {
          ...baseEntity(layerId, { ...entityBase, visualType: 'circle' }),
          type: 'circle',
          cx: numberFor(chunk, '10'),
          cy: -numberFor(chunk, '20'),
          radius: numberFor(chunk, '40'),
        },
        transform,
      ),
    );
  } else if (entityType === 'ARC') {
    result.entities.push(
      transformEntity(
        {
          ...baseEntity(layerId, entityBase),
          type: 'arc',
          cx: numberFor(chunk, '10'),
          cy: -numberFor(chunk, '20'),
          radius: numberFor(chunk, '40'),
          startAngle: numberFor(chunk, '50'),
          endAngle: numberFor(chunk, '51'),
        },
        transform,
      ),
    );
  } else if (entityType === 'TEXT') {
    result.entities.push(
      transformEntity(
        {
          ...baseEntity(layerId, { ...entityBase, fillColor: strokeColor }),
          type: 'text',
          x: numberFor(chunk, '10'),
          y: -numberFor(chunk, '20'),
          content: decodeDxfText(valueFor(chunk, '1') || 'TEXT'),
          fontSize: numberFor(chunk, '40') || 16,
        },
        transform,
      ),
    );
  } else if (entityType === 'MTEXT') {
    result.entities.push(
      transformEntity(
        {
          ...baseEntity(layerId, { ...entityBase, fillColor: strokeColor }),
          type: 'text',
          x: numberFor(chunk, '10'),
          y: -numberFor(chunk, '20'),
          content: decodeDxfText([...valuesFor(chunk, '3'), valueFor(chunk, '1') ?? 'MTEXT'].join('')),
          fontSize: numberFor(chunk, '40') || 16,
        },
        transform,
      ),
    );
  } else if (entityType === 'LWPOLYLINE') {
    const xs = valuesFor(chunk, '10').map(Number);
    const ys = valuesFor(chunk, '20').map((value) => -Number(value));
    result.entities.push(
      transformEntity(
        {
          ...baseEntity(layerId, entityBase),
          type: 'polyline',
          points: xs.map((x, pointIndex) => ({ x, y: ys[pointIndex] ?? 0 })),
        },
        transform,
      ),
    );
  } else if (entityType === 'ELLIPSE') {
    const entity = transformEntity(
      {
        ...baseEntity(layerId, entityBase),
        type: 'polyline' as const,
        points: ellipseToPolyline(chunk),
      },
      transform,
    );
    result.entities.push(entity);
    result.importWarnings.push({
      code: 'DXF_ELLIPSE_APPROXIMATED',
      message: 'ELLIPSE 엔티티를 편집 가능한 폴리라인으로 근사했습니다.',
      entityId: entity.id,
    });
  } else if (entityType === 'SPLINE') {
    const points = splineControlPoints(chunk);
    if (points.length >= 2) {
      const entity = transformEntity(
        {
          ...baseEntity(layerId, entityBase),
          type: 'polyline' as const,
          points,
        },
        transform,
      );
      result.entities.push(entity);
      result.importWarnings.push({
        code: 'DXF_SPLINE_APPROXIMATED',
        message: 'SPLINE 엔티티를 제어점 기반 폴리라인으로 근사했습니다.',
        entityId: entity.id,
      });
    } else {
      result.unsupportedEntities.push({
        sourceType: entityType,
        reason: 'SPLINE has fewer than two usable control points.',
      });
    }
  } else {
    result.unsupportedEntities.push({
      sourceType: entityType,
      reason: 'This DXF entity is not supported by the importer.',
    });
  }

  return result;
}

function ellipseToPolyline(pairs: DxfPair[]) {
  const center = { x: numberFor(pairs, '10'), y: -numberFor(pairs, '20') };
  const majorAxis = { x: numberFor(pairs, '11'), y: -numberFor(pairs, '21') };
  const ratio = Number(valueFor(pairs, '40') ?? 1) || 1;
  const startParameter = Number(valueFor(pairs, '41') ?? 0);
  const endParameter = Number(valueFor(pairs, '42') ?? Math.PI * 2);
  const majorLength = Math.hypot(majorAxis.x, majorAxis.y) || 1;
  const majorUnit = {
    x: majorAxis.x / majorLength,
    y: majorAxis.y / majorLength,
  };
  const minorAxis = {
    x: -majorUnit.y * majorLength * ratio,
    y: majorUnit.x * majorLength * ratio,
  };
  const sweep = normalizeSweep(startParameter, endParameter);
  const segments = Math.max(24, Math.ceil((Math.abs(sweep) / (Math.PI * 2)) * 64));

  return Array.from({ length: segments + 1 }, (_, index) => {
    const parameter = startParameter + (sweep * index) / segments;
    return {
      x: center.x + Math.cos(parameter) * majorAxis.x + Math.sin(parameter) * minorAxis.x,
      y: center.y + Math.cos(parameter) * majorAxis.y + Math.sin(parameter) * minorAxis.y,
    };
  });
}

function normalizeSweep(startParameter: number, endParameter: number): number {
  let sweep = endParameter - startParameter;
  if (sweep <= 0) sweep += Math.PI * 2;
  return sweep;
}

function splineControlPoints(pairs: DxfPair[]) {
  const xs = valuesFor(pairs, '10').map(Number);
  const ys = valuesFor(pairs, '20').map((value) => -Number(value));
  return xs.map((x, index) => ({ x, y: ys[index] ?? 0 }));
}

function insertTransform(pairs: DxfPair[], basePoint: CadPoint): InsertTransform {
  return {
    insertionPoint: { x: numberFor(pairs, '10'), y: -numberFor(pairs, '20') },
    basePoint,
    scaleX: Number(valueFor(pairs, '41') ?? 1) || 1,
    scaleY: Number(valueFor(pairs, '42') ?? 1) || 1,
    rotation: ((Number(valueFor(pairs, '50') ?? 0) || 0) * Math.PI) / 180,
  };
}

function transformEntity(entity: CadEntity, transform?: InsertTransform): CadEntity {
  if (!transform) return entity;

  if (entity.type === 'line') {
    const start = transformPoint({ x: entity.x1, y: entity.y1 }, transform);
    const end = transformPoint({ x: entity.x2, y: entity.y2 }, transform);
    return { ...entity, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }

  if (entity.type === 'circle') {
    const center = transformPoint({ x: entity.cx, y: entity.cy }, transform);
    return {
      ...entity,
      cx: center.x,
      cy: center.y,
      radius: entity.radius * averageScale(transform),
    };
  }

  if (entity.type === 'arc') {
    const center = transformPoint({ x: entity.cx, y: entity.cy }, transform);
    const rotationDegrees = (transform.rotation * 180) / Math.PI;
    return {
      ...entity,
      cx: center.x,
      cy: center.y,
      radius: entity.radius * averageScale(transform),
      startAngle: entity.startAngle + rotationDegrees,
      endAngle: entity.endAngle + rotationDegrees,
    };
  }

  if (entity.type === 'polyline') {
    return {
      ...entity,
      points: entity.points.map((point) => transformPoint(point, transform)),
    };
  }

  if (entity.type === 'text') {
    const point = transformPoint({ x: entity.x, y: entity.y }, transform);
    return {
      ...entity,
      x: point.x,
      y: point.y,
      fontSize: entity.fontSize * averageScale(transform),
    };
  }

  if (entity.type === 'dimension') {
    return {
      ...entity,
      startPoint: transformPoint(entity.startPoint, transform),
      endPoint: transformPoint(entity.endPoint, transform),
      labelOffset: entity.labelOffset ? entity.labelOffset * averageScale(transform) : entity.labelOffset,
    };
  }

  return entity;
}

function transformPoint(point: CadPoint, transform: InsertTransform): CadPoint {
  const relative = {
    x: (point.x - transform.basePoint.x) * transform.scaleX,
    y: (point.y - transform.basePoint.y) * transform.scaleY,
  };
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: transform.insertionPoint.x + relative.x * cos - relative.y * sin,
    y: transform.insertionPoint.y + relative.x * sin + relative.y * cos,
  };
}

function averageScale(transform: InsertTransform): number {
  return (Math.abs(transform.scaleX) + Math.abs(transform.scaleY)) / 2;
}
