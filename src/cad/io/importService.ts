import type {
  CadDocument,
  CadDocumentMetadata,
  CadEntity,
  CadEntityBase,
  CadLayer,
  CadPoint,
  CadWarning,
  UnsupportedCadEntity,
} from '../types';
import { sampleEllipsePoints, sampleSplinePoints } from '../curveGeometry';
import { dxfAciToHex } from './dxfColor';
import { dxfLineTypeToStrokeStyle, dxfLineWeightToStrokeWidth } from './dxfStyle';
import { decodeDxfText } from './dxfText';

export class ImportService {
  async fromJson(text: string): Promise<CadDocument> {
    return JSON.parse(text) as CadDocument;
  }

  async fromDxf(text: string): Promise<CadDocument> {
    const pairs = parseDxfPairs(text);
    const metadata = parseHeaderMetadata(pairs);
    const layerDefinitions = parseLayerDefinitions(pairs);
    const blockDefinitions = collectBlockDefinitions(pairs);
    const entityChunks = collectEntityChunks(pairs);
    const entities: CadEntity[] = [];
    const layerNames = new Set<string>(['0', ...layerDefinitions.keys()]);
    const unsupportedEntities = [];
    const importWarnings: CadWarning[] = [];

    for (const { entityType, chunk } of entityChunks) {
      if (entityType === 'INSERT') {
        const result = importInsertEntity(chunk, layerDefinitions, blockDefinitions, 0);
        entities.push(...result.entities);
        result.layerIds.forEach((layerId) => layerNames.add(layerId));
        importWarnings.push(...result.importWarnings);
        unsupportedEntities.push(...result.unsupportedEntities);
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
      units: unitsFromInsUnits(metadata.insUnits),
      metadata: {
        ...metadata,
        spaces: countDrawingSpaces(entityChunks),
      },
      layers,
      entities,
      unsupportedEntities,
      importWarnings: [
        ...importWarnings,
        ...(unsupportedEntities.length
          ? [
              {
                code: 'UNSUPPORTED_DXF_ENTITIES',
                message: `지원하지 않는 DXF 객체 ${unsupportedEntities.length}개를 건너뛰었습니다.`,
                severity: 'warning' as const,
                category: 'unsupported' as const,
                details: {
                  count: unsupportedEntities.length,
                },
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

type DxfHeaderVariable = {
  name: string;
  values: DxfPair[];
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

function mergeImportResult(target: ImportEntityResult, source: ImportEntityResult): void {
  target.entities.push(...source.entities);
  source.layerIds.forEach((layerId) => target.layerIds.push(layerId));
  target.importWarnings.push(...source.importWarnings);
  target.unsupportedEntities.push(...source.unsupportedEntities);
}

function parseDxfPairs(text: string): DxfPair[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const pairs: DxfPair[] = [];
  for (let index = 0; index < lines.length - 1; index += 2) {
    pairs.push({ code: lines[index].trim(), value: lines[index + 1].trim() });
  }
  return pairs;
}

function parseHeaderMetadata(pairs: DxfPair[]): CadDocumentMetadata {
  const variables = collectHeaderVariables(pairs);
  const insUnits = firstHeaderValue(variables, '$INSUNITS');
  return {
    dxfVersion: firstHeaderValue(variables, '$ACADVER'),
    insUnits,
    measurement: measurementFromHeader(firstHeaderValue(variables, '$MEASUREMENT')),
    extents: extentsFromHeader(variables),
  };
}

function collectHeaderVariables(pairs: DxfPair[]): DxfHeaderVariable[] {
  const variables: DxfHeaderVariable[] = [];
  let currentSection: string | null = null;
  let currentVariable: DxfHeaderVariable | null = null;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code === '0' && pair.value === 'SECTION') {
      currentSection = pairs[index + 1]?.code === '2' ? pairs[index + 1].value : null;
      currentVariable = null;
      continue;
    }
    if (pair.code === '0' && pair.value === 'ENDSEC') {
      currentSection = null;
      currentVariable = null;
      continue;
    }
    if (currentSection !== 'HEADER') continue;

    if (pair.code === '9') {
      currentVariable = { name: pair.value, values: [] };
      variables.push(currentVariable);
      continue;
    }

    currentVariable?.values.push(pair);
  }

  return variables;
}

function firstHeaderValue(variables: DxfHeaderVariable[], name: string): string | undefined {
  return variables.find((variable) => variable.name === name)?.values[0]?.value;
}

function headerVariable(variables: DxfHeaderVariable[], name: string): DxfPair[] {
  return variables.find((variable) => variable.name === name)?.values ?? [];
}

function extentsFromHeader(variables: DxfHeaderVariable[]): CadDocumentMetadata['extents'] {
  const min = headerVariable(variables, '$EXTMIN');
  const max = headerVariable(variables, '$EXTMAX');
  if (!min.length || !max.length) return undefined;
  return {
    min: { x: numberFor(min, '10'), y: -numberFor(min, '20') },
    max: { x: numberFor(max, '10'), y: -numberFor(max, '20') },
  };
}

function measurementFromHeader(value: string | undefined): CadDocumentMetadata['measurement'] {
  if (value === '1') return 'metric';
  if (value === '0') return 'imperial';
  return 'unknown';
}

function unitsFromInsUnits(value: string | undefined): CadDocument['units'] {
  if (value === '4') return 'mm';
  if (value === '5') return 'cm';
  if (value === '6') return 'm';
  if (value === '1') return 'inch';
  return 'mm';
}

function countDrawingSpaces(chunks: DxfEntityChunk[]): { model: number; paper: number } {
  return chunks.reduce(
    (spaces, chunk) => {
      if (valueFor(chunk.chunk, '67') === '1') spaces.paper += 1;
      else spaces.model += 1;
      return spaces;
    },
    { model: 0, paper: 0 },
  );
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
        severity: 'warning',
        category: 'approximated',
        sourceType: 'LWPOLYLINE',
      });
    }
  } else if (entityType === 'ELLIPSE') {
    const ellipse = ellipseFromDxf(chunk);
    const entity = transformEntity(
      {
        ...baseEntity(layerId, entityBase),
        type: 'ellipse' as const,
        ...ellipse,
      },
      transform,
    );
    result.entities.push(entity);
    result.importWarnings.push({
      code: 'DXF_ELLIPSE_PRESERVED',
      message: 'ELLIPSE 엔티티를 편집 가능한 타원으로 보존했습니다.',
      entityId: entity.id,
      severity: 'info',
      category: 'preserved',
      sourceType: 'ELLIPSE',
    });
  } else if (entityType === 'SPLINE') {
    const spline = splineFromDxf(chunk);
    const points = sampleSplinePoints(spline);
    if (points.length >= 2 && spline.controlPoints.length + (spline.fitPoints?.length ?? 0) >= 2) {
      const entity = transformEntity(
        {
          ...baseEntity(layerId, entityBase),
          type: 'spline' as const,
          ...spline,
        },
        transform,
      );
      result.entities.push(entity);
      result.importWarnings.push({
        code: 'DXF_SPLINE_PRESERVED',
        message: 'SPLINE 엔티티를 편집 가능한 곡선으로 보존했습니다.',
        entityId: entity.id,
        severity: 'info',
        category: 'preserved',
        sourceType: 'SPLINE',
        details: {
          controlPointCount: spline.controlPoints.length,
          fitPointCount: spline.fitPoints?.length ?? 0,
          knotCount: spline.knots?.length ?? 0,
        },
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
      severity: 'info',
      category: 'conversion',
      sourceType: 'DIMENSION',
    });
  } else if (entityType === 'HATCH') {
    const boundary = hatchBoundaryFromDxf(chunk);
    if (boundary.length) {
      const fillKind = hatchFillKind(chunk);
      const entity = transformEntity(
        {
          ...baseEntity(layerId, { ...entityBase, fillColor: 'rgba(15, 118, 110, 0.14)' }),
          type: 'hatch' as const,
          boundary,
          fillKind,
          patternName: valueFor(chunk, '2') ?? 'SOLID',
          patternScale: Number(valueFor(chunk, '41') ?? 1) || 1,
          patternAngle: Number(valueFor(chunk, '52') ?? 0) || 0,
        },
        transform,
      );
      result.entities.push(entity);
      result.importWarnings.push({
        code: 'DXF_HATCH_PRESERVED',
        message: 'HATCH 경계를 편집 가능한 채움 객체로 보존했습니다.',
        entityId: entity.id,
        severity: 'info',
        category: 'preserved',
        sourceType: 'HATCH',
        details: {
          fillKind,
          patternName: valueFor(chunk, '2') ?? 'SOLID',
        },
      });
      if (fillKind !== 'solid') {
        result.importWarnings.push({
          code: 'DXF_HATCH_PATTERN_APPROXIMATED',
          message: 'HATCH 패턴 정보를 보존했지만 화면에는 단순 채움으로 표시합니다.',
          entityId: entity.id,
          severity: 'warning',
          category: 'approximated',
          sourceType: 'HATCH',
          details: {
            fillKind,
            patternName: valueFor(chunk, '2') ?? 'SOLID',
          },
        });
      }
    } else {
      result.unsupportedEntities.push({
        sourceType: 'HATCH',
        reason: 'HATCH has no usable boundary.',
      });
      result.importWarnings.push({
        code: 'DXF_HATCH_UNSUPPORTED',
        message: 'HATCH 경계를 해석할 수 없어 가져오지 못했습니다.',
        severity: 'warning',
        category: 'unsupported',
        sourceType: 'HATCH',
      });
    }
  } else if (entityType === 'LEADER' || entityType === 'MLEADER') {
    const points = repeatedPoints(chunk, '10', '20');
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
        code: entityType === 'LEADER' ? 'DXF_LEADER_APPROXIMATED' : 'DXF_MLEADER_APPROXIMATED',
        message: `${entityType} 엔티티의 표시 선을 편집 가능한 폴리라인으로 가져왔습니다.`,
        entityId: entity.id,
        severity: 'warning',
        category: 'approximated',
        sourceType: entityType,
        details: {
          pointCount: points.length,
        },
      });
    } else {
      result.unsupportedEntities.push({
        sourceType: entityType,
        reason: `${entityType} has fewer than two usable vertices.`,
      });
    }
  } else if (entityType === 'ATTRIB' || entityType === 'ATTDEF') {
    const content = decodeDxfText(valueFor(chunk, '1') || valueFor(chunk, '3') || valueFor(chunk, '2') || entityType);
    const entity = transformEntity(
      {
        ...baseEntity(layerId, { ...entityBase, fillColor: strokeColor }),
        type: 'text' as const,
        x: numberFor(chunk, '10'),
        y: -numberFor(chunk, '20'),
        content,
        fontSize: numberFor(chunk, '40') || 16,
      },
      transform,
    );
    result.entities.push(entity);
    result.importWarnings.push({
      code: entityType === 'ATTRIB' ? 'DXF_ATTRIB_PRESERVED' : 'DXF_ATTDEF_PRESERVED',
      message: `${entityType} 텍스트를 편집 가능한 텍스트 객체로 가져왔습니다.`,
      entityId: entity.id,
      severity: 'info',
      category: 'preserved',
      sourceType: entityType,
      details: {
        tag: valueFor(chunk, '2') ?? null,
        prompt: valueFor(chunk, '3') ?? null,
        textLength: content.length,
      },
    });
  } else {
    result.unsupportedEntities.push({
      sourceType: entityType,
      reason: 'This DXF entity is not supported by the importer.',
    });
  }

  return result;
}

function repeatedPoints(pairs: DxfPair[], xCode: string, yCode: string): CadPoint[] {
  const points: CadPoint[] = [];
  let current: CadPoint | null = null;
  for (const pair of pairs) {
    if (pair.code === xCode) {
      current = { x: Number(pair.value), y: 0 };
      if (Number.isFinite(current.x)) points.push(current);
    } else if (pair.code === yCode && current) {
      const y = Number(pair.value);
      current.y = Number.isFinite(y) ? -y : 0;
      current = null;
    }
  }
  return points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function hatchBoundaryFromDxf(pairs: DxfPair[]): CadPoint[][] {
  const paths: CadPoint[][] = [];
  for (let index = 0; index < pairs.length; index += 1) {
    if (pairs[index].code !== '93') continue;
    const count = Number(pairs[index].value);
    if (!Number.isFinite(count) || count < 3) continue;
    const points: CadPoint[] = [];
    let cursor = index + 1;
    while (cursor < pairs.length && points.length < count) {
      if (pairs[cursor].code === '10') {
        const x = Number(pairs[cursor].value);
        const yPair = pairs.slice(cursor + 1).find((pair) => pair.code === '20');
        const y = Number(yPair?.value ?? 0);
        if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y: -y });
      }
      cursor += 1;
    }
    if (points.length >= 3) paths.push(points);
  }
  return paths;
}

function hatchFillKind(pairs: DxfPair[]): 'solid' | 'pattern' | 'gradient' | 'unsupported' {
  if (valuesFor(pairs, '450').length) return 'gradient';
  const solidFlag = valueFor(pairs, '70');
  if (solidFlag === '1' || (valueFor(pairs, '2') ?? '').toUpperCase() === 'SOLID') return 'solid';
  return 'pattern';
}

function importInsertEntity(
  chunk: DxfPair[],
  layerDefinitions: Map<string, { color?: string; lineType?: string; lineWeight?: string }>,
  blockDefinitions: Map<string, DxfBlockDefinition>,
  nestedDepth: number,
): ImportEntityResult {
  const blockName = valueFor(chunk, '2');
  const result: ImportEntityResult = {
    entities: [],
    layerIds: [valueFor(chunk, '8') || '0'],
    importWarnings: [],
    unsupportedEntities: [],
  };

  if (nestedDepth > 8) {
    result.unsupportedEntities.push({
      sourceType: 'INSERT',
      reason: 'INSERT nesting depth exceeded 8',
      raw: { blockName, nestedDepth },
    });
    return result;
  }

  const block = blockName ? blockDefinitions.get(blockName) : undefined;
  if (!blockName || !block) {
    result.unsupportedEntities.push({
      sourceType: 'INSERT',
      reason: blockName ? `Missing BLOCK definition: ${blockName}` : 'INSERT has no block name.',
    });
    return result;
  }

  const transform = insertTransform(chunk, block.basePoint);
  const attributeCount = block.entities.filter((entity) => entity.entityType === 'ATTRIB' || entity.entityType === 'ATTDEF').length;
  const unsupportedBefore = result.unsupportedEntities.length;

  for (const blockEntity of block.entities) {
    if (blockEntity.entityType === 'INSERT') {
      mergeImportResult(result, importInsertEntity(blockEntity.chunk, layerDefinitions, blockDefinitions, nestedDepth + 1));
      continue;
    }

    const child = importDxfEntity(blockEntity.entityType, blockEntity.chunk, layerDefinitions, {
      ...transform,
      fallbackLayerId: valueFor(chunk, '8') || '0',
    });
    mergeImportResult(result, child);
  }

  result.importWarnings.push({
    code: 'DXF_INSERT_EXPLODED',
    message: `INSERT ${blockName} 블록을 ${result.entities.length}개 편집 객체로 펼쳤습니다.`,
    severity: 'info',
    category: 'conversion',
    sourceType: 'INSERT',
    details: {
      blockName,
      entityCount: result.entities.length,
      nestedDepth,
      attributeCount,
      unsupportedChildCount: result.unsupportedEntities.length - unsupportedBefore,
    },
  });

  return result;
}

function ellipseToPolyline(pairs: DxfPair[]) {
  return sampleEllipsePoints(ellipseFromDxf(pairs));
}

function ellipseFromDxf(pairs: DxfPair[]) {
  return {
    cx: numberFor(pairs, '10'),
    cy: -numberFor(pairs, '20'),
    majorAxis: { x: numberFor(pairs, '11'), y: -numberFor(pairs, '21') },
    ratio: Number(valueFor(pairs, '40') ?? 1) || 1,
    startParam: Number(valueFor(pairs, '41') ?? 0),
    endParam: Number(valueFor(pairs, '42') ?? Math.PI * 2),
  };
}

function splineSamplePoints(pairs: DxfPair[]) {
  return sampleSplinePoints(splineFromDxf(pairs));
}

function splineFromDxf(pairs: DxfPair[]) {
  const controlPoints = splineControlPoints(pairs);
  return {
    degree: Number(valueFor(pairs, '71') ?? Math.min(3, splineControlPoints(pairs).length - 1)),
    controlPoints,
    fitPoints: splineFitPoints(pairs),
    knots: valuesFor(pairs, '40').map(Number).filter(Number.isFinite),
    weights: valuesFor(pairs, '41').map(Number).filter(Number.isFinite),
    closed: (Number(valueFor(pairs, '70') ?? 0) & 1) === 1,
  };
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

  if (entity.type === 'ellipse') {
    const center = transformPoint({ x: entity.cx, y: entity.cy }, transform);
    const majorEnd = transformPoint(
      { x: entity.cx + entity.majorAxis.x, y: entity.cy + entity.majorAxis.y },
      transform,
    );
    return {
      ...entity,
      cx: center.x,
      cy: center.y,
      majorAxis: { x: majorEnd.x - center.x, y: majorEnd.y - center.y },
    };
  }

  if (entity.type === 'spline') {
    return {
      ...entity,
      controlPoints: entity.controlPoints.map((point) => transformPoint(point, transform)),
      fitPoints: entity.fitPoints?.map((point) => transformPoint(point, transform)),
    };
  }

  if (entity.type === 'hatch') {
    return {
      ...entity,
      boundary: entity.boundary.map((path) => path.map((point) => transformPoint(point, transform))),
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
