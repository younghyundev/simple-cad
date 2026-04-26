import type { CadDocument, CadEntity, CadLayer, CadWarning } from '../types';
import { flattenEntities } from '../entityTransform';
import { ExportService } from './exportService';
import { ImportService } from './importService';

export type DxfRoundTripSummary = {
  entityCounts: Record<FlatEntityType, number>;
  layerSummary: Array<Pick<CadLayer, 'id' | 'name' | 'color' | 'visible' | 'locked'>>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  strokeStyles: Record<string, number>;
  textContents: string[];
  dimensionLabels: string[];
  warningCodes: Record<string, number>;
  warningCategories: Record<string, number>;
  unsupportedEntityTypes: Record<string, number>;
};

export type DxfRoundTripResult = {
  firstImport: CadDocument;
  secondImport: CadDocument;
  firstSummary: DxfRoundTripSummary;
  secondSummary: DxfRoundTripSummary;
  drift: string[];
};

type FlatEntityType = Exclude<CadEntity['type'], 'group'>;

const ENTITY_TYPES: FlatEntityType[] = [
  'line',
  'rect',
  'circle',
  'arc',
  'polyline',
  'text',
  'dimension',
];

const NUMBER_TOLERANCE = 0.05;

export async function runDxfRoundTrip(fixtureText: string): Promise<DxfRoundTripResult> {
  const importer = new ImportService();
  const exporter = new ExportService();
  const firstImport = await importer.fromDxf(fixtureText);
  const exportedText = await exporter.toDxf(firstImport).text();
  const secondImport = await importer.fromDxf(exportedText);
  const firstSummary = summarizeCadDocument(firstImport);
  const secondSummary = summarizeCadDocument(secondImport);

  return {
    firstImport,
    secondImport,
    firstSummary,
    secondSummary,
    drift: compareRoundTripSummaries(firstSummary, secondSummary),
  };
}

export function summarizeCadDocument(document: CadDocument): DxfRoundTripSummary {
  return {
    entityCounts: countEntities(flattenEntities(document.entities)),
    layerSummary: document.layers
      .map((layer) => ({
        id: layer.id,
        name: layer.name,
        color: normalizeColor(layer.color),
        visible: layer.visible,
        locked: layer.locked,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    bounds: documentBounds(document.entities),
    strokeStyles: countValues(
      flattenEntities(document.entities).map((entity) =>
        [entity.strokeColor, entity.strokeStyle ?? 'solid', round(entity.strokeWidth, 2)].join('|'),
      ),
    ),
    textContents: flattenEntities(document.entities)
      .filter((entity): entity is Extract<CadEntity, { type: 'text' }> => entity.type === 'text')
      .map((entity) => entity.content)
      .sort(),
    dimensionLabels: flattenEntities(document.entities)
      .filter(
        (entity): entity is Extract<CadEntity, { type: 'dimension' }> => entity.type === 'dimension',
      )
      .map((entity) => entity.label)
      .sort(),
    warningCodes: countValues((document.importWarnings ?? []).map((warning) => warning.code)),
    warningCategories: countValues(
      (document.importWarnings ?? []).map((warning) => warning.category ?? inferWarningCategory(warning)),
    ),
    unsupportedEntityTypes: countValues(
      (document.unsupportedEntities ?? []).map((entity) => entity.sourceType),
    ),
  };
}

export function compareRoundTripSummaries(
  before: DxfRoundTripSummary,
  after: DxfRoundTripSummary,
): string[] {
  const drift: string[] = [];
  compareJson('entity-counts', before.entityCounts, after.entityCounts, drift);
  compareJson('layers', before.layerSummary, after.layerSummary, drift);
  compareBounds(before.bounds, after.bounds, drift);
  compareJson('stroke-styles', before.strokeStyles, after.strokeStyles, drift);
  compareJson('text', before.textContents, after.textContents, drift);
  compareJson('dimensions', before.dimensionLabels, after.dimensionLabels, drift);
  compareJson('unsupported-entities', before.unsupportedEntityTypes, after.unsupportedEntityTypes, drift);
  return drift;
}

function countEntities(entities: CadEntity[]): Record<FlatEntityType, number> {
  return ENTITY_TYPES.reduce(
    (counts, type) => ({
      ...counts,
      [type]: entities.filter((entity) => entity.type === type).length,
    }),
    {} as Record<FlatEntityType, number>,
  );
}

function countValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function documentBounds(entities: CadEntity[]): DxfRoundTripSummary['bounds'] {
  const points = entities.flatMap(entityPoints);
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  return {
    minX: round(Math.min(...points.map((point) => point.x)), 2),
    minY: round(Math.min(...points.map((point) => point.y)), 2),
    maxX: round(Math.max(...points.map((point) => point.x)), 2),
    maxY: round(Math.max(...points.map((point) => point.y)), 2),
  };
}

function entityPoints(entity: CadEntity): Array<{ x: number; y: number }> {
  if (entity.type === 'group') return entity.children.flatMap(entityPoints);
  if (entity.type === 'line') return [{ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }];
  if (entity.type === 'rect') return [{ x: entity.x, y: entity.y }, { x: entity.x + entity.width, y: entity.y + entity.height }];
  if (entity.type === 'circle') return [{ x: entity.cx - entity.radius, y: entity.cy - entity.radius }, { x: entity.cx + entity.radius, y: entity.cy + entity.radius }];
  if (entity.type === 'arc') return [{ x: entity.cx - entity.radius, y: entity.cy - entity.radius }, { x: entity.cx + entity.radius, y: entity.cy + entity.radius }];
  if (entity.type === 'polyline') return entity.points;
  if (entity.type === 'text') return [{ x: entity.x, y: entity.y }];
  if (entity.type === 'dimension') return [entity.startPoint, entity.endPoint];
  return [];
}

function compareJson(label: string, before: unknown, after: unknown, drift: string[]): void {
  const beforeJson = JSON.stringify(before);
  const afterJson = JSON.stringify(after);
  if (beforeJson !== afterJson) drift.push(`${label} drift: ${beforeJson} -> ${afterJson}`);
}

function compareBounds(
  before: DxfRoundTripSummary['bounds'],
  after: DxfRoundTripSummary['bounds'],
  drift: string[],
): void {
  for (const key of ['minX', 'minY', 'maxX', 'maxY'] as const) {
    if (Math.abs(before[key] - after[key]) > NUMBER_TOLERANCE) {
      drift.push(`bounds.${key} drift: ${before[key]} -> ${after[key]}`);
    }
  }
}

function normalizeColor(color: string): string {
  return color.toLowerCase();
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function inferWarningCategory(warning: CadWarning): string {
  if (warning.code.includes('APPROXIMATED')) return 'approximated';
  if (warning.code.includes('UNSUPPORTED')) return 'unsupported';
  if (warning.code.includes('MOCK')) return 'mock';
  return 'conversion';
}
