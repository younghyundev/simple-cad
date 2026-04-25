import type { CadDocument, CadEntity, CadPoint } from './types';

export type SnapResult = {
  point: CadPoint;
  type: 'grid' | 'endpoint' | 'center' | 'intersection' | 'none';
};

const gridSize = 20;
const maxPolylineSnapPoints = 200;
const maxIntersectionSegments = 700;
type SnapCandidate = {
  point: CadPoint;
  type: 'endpoint' | 'center' | 'intersection';
};

type Segment = {
  entityId: string;
  start: CadPoint;
  end: CadPoint;
};

export function snapPoint(
  point: CadPoint,
  document: CadDocument,
  options: {
    enabled: boolean;
    scale: number;
    excludeEntityId?: string | null;
    excludeEntityIds?: string[];
  },
): SnapResult {
  if (!options.enabled) return { point, type: 'none' };

  const tolerance = 12 / options.scale;
  const excludeEntityIds = new Set([
    ...(options.excludeEntityId ? [options.excludeEntityId] : []),
    ...(options.excludeEntityIds ?? []),
  ]);
  const candidates = getSnapCandidates(document, excludeEntityIds);
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
  excludeEntityIds: Set<string>,
): SnapCandidate[] {
  const entities = document.entities
    .filter((entity) => entity.visible && !excludeEntityIds.has(entity.id))
  const pointCandidates = entities.flatMap((entity) => entitySnapCandidates(entity));
  const intersectionCandidates = getIntersectionCandidates(entities);

  return [...pointCandidates, ...intersectionCandidates];
}

function entitySnapCandidates(entity: CadEntity): SnapCandidate[] {
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
    if (entity.points.length <= maxPolylineSnapPoints) {
      return entity.points.map((point) => ({ point, type: 'endpoint' }));
    }

    const step = Math.ceil(entity.points.length / maxPolylineSnapPoints);
    return entity.points
      .filter((_, index) => index === 0 || index === entity.points.length - 1 || index % step === 0)
      .map((point) => ({ point, type: 'endpoint' }));
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

function getIntersectionCandidates(entities: CadEntity[]): SnapCandidate[] {
  const segments = entities.flatMap((entity) => entitySegments(entity));
  if (segments.length > maxIntersectionSegments) return [];

  const intersections: SnapCandidate[] = [];

  for (let firstIndex = 0; firstIndex < segments.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < segments.length; secondIndex += 1) {
      const first = segments[firstIndex];
      const second = segments[secondIndex];
      if (first.entityId === second.entityId) continue;

      const point = segmentIntersection(first.start, first.end, second.start, second.end);
      if (point) intersections.push({ point, type: 'intersection' });
    }
  }

  return intersections;
}

function entitySegments(entity: CadEntity): Segment[] {
  if (entity.type === 'line') {
    return [
      {
        entityId: entity.id,
        start: { x: entity.x1, y: entity.y1 },
        end: { x: entity.x2, y: entity.y2 },
      },
    ];
  }

  if (entity.type === 'rect') {
    const topLeft = { x: entity.x, y: entity.y };
    const topRight = { x: entity.x + entity.width, y: entity.y };
    const bottomRight = { x: entity.x + entity.width, y: entity.y + entity.height };
    const bottomLeft = { x: entity.x, y: entity.y + entity.height };
    return [
      { entityId: entity.id, start: topLeft, end: topRight },
      { entityId: entity.id, start: topRight, end: bottomRight },
      { entityId: entity.id, start: bottomRight, end: bottomLeft },
      { entityId: entity.id, start: bottomLeft, end: topLeft },
    ];
  }

  if (entity.type === 'polyline') {
    const segments: Segment[] = [];
    for (let index = 0; index < entity.points.length - 1; index += 1) {
      segments.push({
        entityId: entity.id,
        start: entity.points[index],
        end: entity.points[index + 1],
      });
    }
    return segments;
  }

  if (entity.type === 'dimension') {
    return [{ entityId: entity.id, start: entity.startPoint, end: entity.endPoint }];
  }

  return [];
}

function segmentIntersection(
  firstStart: CadPoint,
  firstEnd: CadPoint,
  secondStart: CadPoint,
  secondEnd: CadPoint,
): CadPoint | null {
  const denominator =
    (firstStart.x - firstEnd.x) * (secondStart.y - secondEnd.y) -
    (firstStart.y - firstEnd.y) * (secondStart.x - secondEnd.x);

  if (Math.abs(denominator) < 0.000001) return null;

  const firstCross = firstStart.x * firstEnd.y - firstStart.y * firstEnd.x;
  const secondCross = secondStart.x * secondEnd.y - secondStart.y * secondEnd.x;
  const point = {
    x:
      (firstCross * (secondStart.x - secondEnd.x) -
        (firstStart.x - firstEnd.x) * secondCross) /
      denominator,
    y:
      (firstCross * (secondStart.y - secondEnd.y) -
        (firstStart.y - firstEnd.y) * secondCross) /
      denominator,
  };

  return isPointOnSegment(point, firstStart, firstEnd) && isPointOnSegment(point, secondStart, secondEnd)
    ? point
    : null;
}

function isPointOnSegment(point: CadPoint, start: CadPoint, end: CadPoint): boolean {
  const tolerance = 0.000001;
  return (
    point.x >= Math.min(start.x, end.x) - tolerance &&
    point.x <= Math.max(start.x, end.x) + tolerance &&
    point.y >= Math.min(start.y, end.y) - tolerance &&
    point.y <= Math.max(start.y, end.y) + tolerance
  );
}

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
