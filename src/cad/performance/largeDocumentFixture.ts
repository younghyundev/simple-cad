import type { CadDocument, CadEntity } from '../types';

type LargeDocumentOptions = {
  entityCount: number;
};

export function createLargeDocument(options: LargeDocumentOptions): CadDocument {
  const entities: CadEntity[] = [];
  const columns = 80;
  const spacing = 18;

  for (let index = 0; index < options.entityCount; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * spacing;
    const y = row * spacing;

    if (index % 4 === 0) {
      entities.push({
        ...baseEntity(index),
        type: 'rect',
        x,
        y,
        width: 10,
        height: 8,
        fillColor: 'transparent',
      });
      continue;
    }

    if (index % 4 === 1) {
      entities.push({
        ...baseEntity(index),
        type: 'circle',
        cx: x + 5,
        cy: y + 5,
        radius: 5,
        fillColor: 'transparent',
      });
      continue;
    }

    if (index % 4 === 2) {
      entities.push({
        ...baseEntity(index),
        type: 'line',
        x1: x,
        y1: y,
        x2: x + 12,
        y2: y + 6,
        fillColor: 'transparent',
      });
      continue;
    }

    entities.push({
      ...baseEntity(index),
      type: 'polyline',
      points: [
        { x, y },
        { x: x + 6, y: y + 4 },
        { x: x + 12, y },
      ],
      fillColor: 'transparent',
    });
  }

  return {
    id: `large-document-${options.entityCount}`,
    name: `large-document-${options.entityCount}`,
    units: 'mm',
    layers: [
      {
        id: '0',
        name: '0',
        color: '#1f2937',
        visible: true,
        locked: false,
      },
    ],
    entities,
  };
}

function baseEntity(index: number) {
  return {
    id: `perf-entity-${index}`,
    layerId: '0',
    rotation: 0,
    strokeColor: '#1f2937',
    fillColor: 'transparent',
    strokeWidth: 1,
    strokeStyle: index % 5 === 0 ? ('dashed' as const) : ('solid' as const),
    visible: true,
    locked: false,
  };
}
