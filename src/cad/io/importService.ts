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

function dxfPoint(pairs: DxfPair[], xCode: string, yCode: string): CadPoint {
  return { x: numberFor(pairs, xCode), y: -numberFor(pairs, yCode) };
}

function formatDistance(a: CadPoint, b: CadPoint): string {
  return Math.hypot(a.x - b.x, a.y - b.y).toFixed(1);
}

function dimensionLabel(pairs: DxfPair[]): string {
  const explicitLabel = decodeDxfText(valueFor(pairs, '1') ?? '');
  if (explicitLabel && explicitLabel !== '<>') return explicitLabel;
  return formatDistance(dxfPoint(pairs, '13', '23'), dxfPoint(pairs, '14', '24'));
}

function dimensionOffset(pairs: DxfPair[]): number {
  const start = dxfPoint(pairs, '13', '23');
  const end = dxfPoint(pairs, '14', '24');
  const dimensionLinePoint = dxfPoint(pairs, '10', '20');
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (!length) return -24;

  const normal = { x: -dy / length, y: dx / length };
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const offset =
    (dimensionLinePoint.x - midpoint.x) * normal.x +
    (dimensionLinePoint.y - midpoint.y) * normal.y;
  return Number.isFinite(offset) && Math.abs(offset) > 0.1 ? offset : -24;
}

function lwPolylinePoints(pairs: DxfPair[]): { points: CadPoint[]; hasBulge: boolean } {
  const vertices: Array<CadPoint & { bulge: number }> = [];
  let current: (CadPoint & { bulge: number }) | null = null;

  for (const pair of pairs) {
    if (pair.code === '10') {
      current = { x: Number(pair.value), y: 0, bulge: 0 };
      vertices.push(current);
    } else if (pair.code === '20' && current) {
      current.y = -Number(pair.value);
    } else if (pair.code === '42' && current) {
      current.bulge = Number(pair.value);
    }
  }

  if (vertices.length < 2) return { points: vertices, hasBulge: false };

  const closed = (Number(valueFor(pairs, '70') ?? 0) & 1) === 1;
  const points: CadPoint[] = [stripBulge(vertices[0])];
  let hasBulge = false;
  const segmentCount = closed ? vertices.length : vertices.length - 1;

  for (let index = 0; index < segmentCount; index += 1) {
    const start = vertices[index];
    const end = vertices[(index + 1) % vertices.length];
    if (Math.abs(start.bulge) > 0.000001) {
      hasBulge = true;
      points.push(...bulgeSegmentPoints(start, end, start.bulge));
    } else {
      points.push(stripBulge(end));
    }
  }

  return { points, hasBulge };
}

function stripBulge(point: CadPoint & { bulge: number }): CadPoint {
  return { x: point.x, y: point.y };
}

function bulgeSegmentPoints(start: CadPoint, end: CadPoint, bulge: number): CadPoint[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chordLength = Math.hypot(dx, dy);
  if (!chordLength) return [end];

  const sweep = 4 * Math.atan(bulge);
  const radius = (chordLength * (1 + bulge * bulge)) / (4 * Math.abs(bulge));
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const normal = { x: -dy / chordLength, y: dx / chordLength };
  const centerOffset = (chordLength * (1 - bulge * bulge)) / (4 * bulge);
  const center = {
    x: midpoint.x + normal.x * centerOffset,
    y: midpoint.y + normal.y * centerOffset,
  };
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const segments = Math.max(8, Math.ceil(Math.abs(sweep) / (Math.PI / 18)));

  return Array.from({ length: segments }, (_, index) => {
    const t = (index + 1) / segments;
    const angle = startAngle + sweep * t;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
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
    const polyline = lwPolylinePoints(chunk);
    const entity = transformEntity(
      {
        ...baseEntity(layerId, entityBase),
        type: 'polyline',
        points: polyline.points,
      },
      transform,
    );
    result.entities.push(
      entity,
    );
    if (polyline.hasBulge) {
      result.importWarnings.push({
        code: 'DXF_POLYLINE_BULGE_APPROXIMATED',
        message: 'LWPOLYLINE bulge 곡선을 편집 가능한 폴리라인으로 근사했습니다.',
        entityId: entity.id,
      });
    }
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
    const points = splineSamplePoints(chunk);
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
        message: 'SPLINE 엔티티를 보간 샘플링한 폴리라인으로 근사했습니다.',
        entityId: entity.id,
      });
    } else {
      result.unsupportedEntities.push({
        sourceType: entityType,
        reason: 'SPLINE has fewer than two usable control points.',
      });
    }
  } else if (entityType === 'DIMENSION') {
    const startPoint = dxfPoint(chunk, '13', '23');
    const endPoint = dxfPoint(chunk, '14', '24');
    const label = dimensionLabel(chunk);
    const entity = transformEntity(
      {
        ...baseEntity(layerId, { ...entityBase, fillColor: strokeColor }),
        type: 'dimension' as const,
        startPoint,
        endPoint,
        label,
        labelMode: label === formatDistance(startPoint, endPoint) ? 'auto' : 'manual',
        labelOffset: dimensionOffset(chunk),
      },
      transform,
    );
    result.entities.push(entity);
    result.importWarnings.push({
      code: 'DXF_DIMENSION_IMPORTED',
      message: 'DIMENSION 엔티티를 편집 가능한 SimpleCAD 치수 객체로 가져왔습니다.',
      entityId: entity.id,
    });
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

function splineSamplePoints(pairs: DxfPair[]) {
  const nurbsPoints = splineNurbsPoints(pairs);
  if (nurbsPoints.length >= 2) return nurbsPoints;

  const fitPoints = splineFitPoints(pairs);
  const controlPoints = splineControlPoints(pairs);
  const sourcePoints = fitPoints.length >= 2 ? fitPoints : controlPoints;

  if (sourcePoints.length < 3) return sourcePoints;
  return catmullRomPoints(sourcePoints, 32);
}

function splineNurbsPoints(pairs: DxfPair[]) {
  const controlPoints = splineControlPoints(pairs);
  const degree = Number(valueFor(pairs, '71') ?? Math.min(3, controlPoints.length - 1));
  const knots = valuesFor(pairs, '40').map(Number).filter(Number.isFinite);
  const weights = valuesFor(pairs, '41').map(Number).filter(Number.isFinite);
  const pointCount = controlPoints.length;

  if (
    pointCount < 2 ||
    degree < 1 ||
    knots.length < pointCount + degree + 1 ||
    !Number.isFinite(knots[degree]) ||
    !Number.isFinite(knots[pointCount])
  ) {
    return [];
  }

  const start = knots[degree];
  const end = knots[pointCount];
  if (start === end) return [];

  const samples = Math.max(96, Math.min(480, pointCount * 48));
  const result: CadPoint[] = [];

  for (let sample = 0; sample <= samples; sample += 1) {
    const u = start + ((end - start) * sample) / samples;
    const point = evaluateRationalBSpline(controlPoints, knots, weights, degree, u, sample === samples);
    if (point) result.push(point);
  }

  return dedupePoints(result);
}

function evaluateRationalBSpline(
  controlPoints: CadPoint[],
  knots: number[],
  weights: number[],
  degree: number,
  u: number,
  isLastSample: boolean,
): CadPoint | null {
  let weightedX = 0;
  let weightedY = 0;
  let denominator = 0;
  const lastControlIndex = controlPoints.length - 1;

  for (let index = 0; index < controlPoints.length; index += 1) {
    const basis =
      isLastSample && index === lastControlIndex ? 1 : bsplineBasis(index, degree, u, knots);
    if (basis === 0) continue;

    const weight = weights[index] ?? 1;
    const weightedBasis = basis * weight;
    weightedX += controlPoints[index].x * weightedBasis;
    weightedY += controlPoints[index].y * weightedBasis;
    denominator += weightedBasis;
  }

  if (!denominator) return null;
  return { x: weightedX / denominator, y: weightedY / denominator };
}

function bsplineBasis(index: number, degree: number, u: number, knots: number[]): number {
  if (degree === 0) {
    return knots[index] <= u && u < knots[index + 1] ? 1 : 0;
  }

  const leftDenominator = knots[index + degree] - knots[index];
  const rightDenominator = knots[index + degree + 1] - knots[index + 1];
  const left =
    leftDenominator === 0
      ? 0
      : ((u - knots[index]) / leftDenominator) * bsplineBasis(index, degree - 1, u, knots);
  const right =
    rightDenominator === 0
      ? 0
      : ((knots[index + degree + 1] - u) / rightDenominator) *
        bsplineBasis(index + 1, degree - 1, u, knots);

  return left + right;
}

function dedupePoints(points: CadPoint[]): CadPoint[] {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 0.001;
  });
}

function splineControlPoints(pairs: DxfPair[]) {
  const xs = valuesFor(pairs, '10').map(Number);
  const ys = valuesFor(pairs, '20').map((value) => -Number(value));
  return xs.map((x, index) => ({ x, y: ys[index] ?? 0 }));
}

function splineFitPoints(pairs: DxfPair[]) {
  const xs = valuesFor(pairs, '11').map(Number);
  const ys = valuesFor(pairs, '21').map((value) => -Number(value));
  return xs.map((x, index) => ({ x, y: ys[index] ?? 0 }));
}

function catmullRomPoints(points: CadPoint[], segmentsPerSpan: number): CadPoint[] {
  const result: CadPoint[] = [points[0]];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];
    const spanLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const segments = Math.max(8, Math.min(32, Math.ceil(spanLength / 8), segmentsPerSpan));

    for (let step = 1; step <= segments; step += 1) {
      const t = step / segments;
      result.push({
        x: catmullRomValue(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRomValue(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }

  return result;
}

function catmullRomValue(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
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
