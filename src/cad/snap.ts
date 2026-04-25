import type { CadDocument, CadEntity, CadPoint } from './types';

export type SnapResult = {
  point: CadPoint;
  type: 'grid' | 'endpoint' | 'center' | 'none';
};

const gridSize = 20;

export function snapPoint(
  point: CadPoint,
  document: CadDocument,
  options: {
    enabled: boolean;
    scale: number;
    excludeEntityId?: string | null;
  },
): SnapResult {
  if (!options.enabled) return { point, type: 'none' };

  const tolerance = 12 / options.scale;
  const candidates = getSnapCandidates(document, options.excludeEntityId);
  const nearest = candidates
    .map((candidate) => ({
      ...candidate,
      distance: distance(point, candidate.point),
    }))
    .filter((candidate) => candidate.distance <= tolerance)
    .sort((a, b) => a.distance - b.distance)[0];

  if (nearest) return { point: nearest.point, type: nearest.type };

  return {
    point: {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    },
    type: 'grid',
  };
}

function getSnapCandidates(
  document: CadDocument,
  excludeEntityId?: string | null,
): Array<{ point: CadPoint; type: 'endpoint' | 'center' }> {
  return document.entities
    .filter((entity) => entity.visible && entity.id !== excludeEntityId)
    .flatMap((entity) => entitySnapCandidates(entity));
}

function entitySnapCandidates(entity: CadEntity): Array<{ point: CadPoint; type: 'endpoint' | 'center' }> {
  if (entity.type === 'line') {
    return [
      { point: { x: entity.x1, y: entity.y1 }, type: 'endpoint' },
      { point: { x: entity.x2, y: entity.y2 }, type: 'endpoint' },
      { point: { x: (entity.x1 + entity.x2) / 2, y: (entity.y1 + entity.y2) / 2 }, type: 'center' },
    ];
  }

  if (entity.type === 'rect') {
    return [
      { point: { x: entity.x, y: entity.y }, type: 'endpoint' },
      { point: { x: entity.x + entity.width, y: entity.y }, type: 'endpoint' },
      { point: { x: entity.x + entity.width, y: entity.y + entity.height }, type: 'endpoint' },
      { point: { x: entity.x, y: entity.y + entity.height }, type: 'endpoint' },
      { point: { x: entity.x + entity.width / 2, y: entity.y + entity.height / 2 }, type: 'center' },
    ];
  }

  if (entity.type === 'circle' || entity.type === 'arc') {
    return [
      { point: { x: entity.cx, y: entity.cy }, type: 'center' },
      { point: { x: entity.cx + entity.radius, y: entity.cy }, type: 'endpoint' },
      { point: { x: entity.cx - entity.radius, y: entity.cy }, type: 'endpoint' },
      { point: { x: entity.cx, y: entity.cy + entity.radius }, type: 'endpoint' },
      { point: { x: entity.cx, y: entity.cy - entity.radius }, type: 'endpoint' },
    ];
  }

  if (entity.type === 'polyline') {
    return entity.points.map((point) => ({ point, type: 'endpoint' }));
  }

  if (entity.type === 'text') {
    return [{ point: { x: entity.x, y: entity.y }, type: 'endpoint' }];
  }

  return [
    { point: entity.startPoint, type: 'endpoint' },
    { point: entity.endPoint, type: 'endpoint' },
    {
      point: {
        x: (entity.startPoint.x + entity.endPoint.x) / 2,
        y: (entity.startPoint.y + entity.endPoint.y) / 2,
      },
      type: 'center',
    },
  ];
}

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
