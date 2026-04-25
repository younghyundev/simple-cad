import type { CadEntity, CadEntityBase, CadPoint, ToolId } from './types';

const hitTolerance = 8;

export type ResizeHandleId =
  | 'start'
  | 'end'
  | 'nw'
  | 'ne'
  | 'se'
  | 'sw'
  | 'radius'
  | `point-${number}`;

export type ResizeHandle = {
  id: ResizeHandleId;
  point: CadPoint;
  cursor: string;
};

export function createEntity(
  tool: ToolId,
  start: CadPoint,
  end: CadPoint,
  layerId: string,
): CadEntity | null {
  const base: CadEntityBase = {
    id: `${tool}-${Date.now()}`,
    layerId,
    rotation: 0,
    strokeColor: '#1f2937',
    fillColor: tool === 'rect' || tool === 'circle' ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
    strokeWidth: 2,
    strokeStyle: 'solid',
    visible: true,
    locked: false,
  };

  if (tool === 'line') {
    return { ...base, type: 'line', x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }

  if (tool === 'rect') {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    return {
      ...base,
      type: 'rect',
      x,
      y,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  if (tool === 'circle') {
    return {
      ...base,
      type: 'circle',
      cx: start.x,
      cy: start.y,
      radius: distance(start, end),
    };
  }

  if (tool === 'polyline') {
    return {
      ...base,
      type: 'polyline',
      points: [start, end],
    };
  }

  return null;
}

export function createTextEntity(point: CadPoint, content: string, layerId: string): CadEntity {
  return {
    id: `text-${Date.now()}`,
    type: 'text',
    layerId,
    rotation: 0,
    strokeColor: '#166534',
    fillColor: '#166534',
    strokeWidth: 1,
    visible: true,
    locked: false,
    x: point.x,
    y: point.y,
    content,
    fontSize: 18,
  };
}

export function translateEntity(entity: CadEntity, delta: CadPoint): CadEntity {
  if (entity.locked) return entity;

  if (entity.type === 'line') {
    return {
      ...entity,
      x1: entity.x1 + delta.x,
      y1: entity.y1 + delta.y,
      x2: entity.x2 + delta.x,
      y2: entity.y2 + delta.y,
    };
  }

  if (entity.type === 'rect') {
    return { ...entity, x: entity.x + delta.x, y: entity.y + delta.y };
  }

  if (entity.type === 'circle') {
    return { ...entity, cx: entity.cx + delta.x, cy: entity.cy + delta.y };
  }

  if (entity.type === 'arc') {
    return { ...entity, cx: entity.cx + delta.x, cy: entity.cy + delta.y };
  }

  if (entity.type === 'polyline') {
    return {
      ...entity,
      points: entity.points.map((point) => ({ x: point.x + delta.x, y: point.y + delta.y })),
    };
  }

  if (entity.type === 'text') {
    return { ...entity, x: entity.x + delta.x, y: entity.y + delta.y };
  }

  return {
    ...entity,
    startPoint: { x: entity.startPoint.x + delta.x, y: entity.startPoint.y + delta.y },
    endPoint: { x: entity.endPoint.x + delta.x, y: entity.endPoint.y + delta.y },
  };
}

export function getResizeHandles(entity: CadEntity): ResizeHandle[] {
  if (entity.type === 'line') {
    return [
      { id: 'start', point: { x: entity.x1, y: entity.y1 }, cursor: 'nwse-resize' },
      { id: 'end', point: { x: entity.x2, y: entity.y2 }, cursor: 'nwse-resize' },
    ];
  }

  if (entity.type === 'rect') {
    const right = entity.x + entity.width;
    const bottom = entity.y + entity.height;
    return [
      { id: 'nw', point: { x: entity.x, y: entity.y }, cursor: 'nwse-resize' },
      { id: 'ne', point: { x: right, y: entity.y }, cursor: 'nesw-resize' },
      { id: 'se', point: { x: right, y: bottom }, cursor: 'nwse-resize' },
      { id: 'sw', point: { x: entity.x, y: bottom }, cursor: 'nesw-resize' },
    ];
  }

  if (entity.type === 'circle') {
    return [
      {
        id: 'radius',
        point: { x: entity.cx + entity.radius, y: entity.cy },
        cursor: 'ew-resize',
      },
    ];
  }

  if (entity.type === 'arc') {
    return [
      {
        id: 'radius',
        point: { x: entity.cx + entity.radius, y: entity.cy },
        cursor: 'ew-resize',
      },
    ];
  }

  if (entity.type === 'polyline') {
    return entity.points.map((point, index) => ({
      id: `point-${index}` as const,
      point,
      cursor: 'move',
    }));
  }

  return [];
}

export function hitTestResizeHandle(
  entity: CadEntity,
  point: CadPoint,
  scale: number,
): ResizeHandle | null {
  const tolerance = 8 / scale;
  return (
    getResizeHandles(entity).find((handle) => distance(handle.point, point) <= tolerance) ?? null
  );
}

export function resizeEntity(
  entity: CadEntity,
  handleId: ResizeHandleId,
  point: CadPoint,
): CadEntity {
  if (entity.locked) return entity;

  if (entity.type === 'line') {
    if (handleId === 'start') {
      return { ...entity, x1: point.x, y1: point.y };
    }
    if (handleId === 'end') {
      return { ...entity, x2: point.x, y2: point.y };
    }
  }

  if (entity.type === 'rect') {
    const left = entity.x;
    const top = entity.y;
    const right = entity.x + entity.width;
    const bottom = entity.y + entity.height;

    const nextLeft = handleId === 'nw' || handleId === 'sw' ? point.x : left;
    const nextRight = handleId === 'ne' || handleId === 'se' ? point.x : right;
    const nextTop = handleId === 'nw' || handleId === 'ne' ? point.y : top;
    const nextBottom = handleId === 'sw' || handleId === 'se' ? point.y : bottom;

    const x = Math.min(nextLeft, nextRight);
    const y = Math.min(nextTop, nextBottom);
    return {
      ...entity,
      x,
      y,
      width: Math.max(1, Math.abs(nextRight - nextLeft)),
      height: Math.max(1, Math.abs(nextBottom - nextTop)),
    };
  }

  if (entity.type === 'circle' && handleId === 'radius') {
    return {
      ...entity,
      radius: Math.max(1, distance({ x: entity.cx, y: entity.cy }, point)),
    };
  }

  if (entity.type === 'arc' && handleId === 'radius') {
    return {
      ...entity,
      radius: Math.max(1, distance({ x: entity.cx, y: entity.cy }, point)),
    };
  }

  if (entity.type === 'polyline' && handleId.startsWith('point-')) {
    const index = Number(handleId.replace('point-', ''));
    return {
      ...entity,
      points: entity.points.map((currentPoint, pointIndex) =>
        pointIndex === index ? point : currentPoint,
      ),
    };
  }

  return entity;
}

export function insertPolylinePoint(entity: CadEntity, point: CadPoint): CadEntity {
  if (entity.type !== 'polyline') return entity;
  if (entity.points.length < 2) {
    return { ...entity, points: [...entity.points, point] };
  }

  let insertAfterIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < entity.points.length - 1; index += 1) {
    const currentDistance = pointToSegmentDistance(point, entity.points[index], entity.points[index + 1]);
    if (currentDistance < nearestDistance) {
      nearestDistance = currentDistance;
      insertAfterIndex = index;
    }
  }

  return {
    ...entity,
    points: [
      ...entity.points.slice(0, insertAfterIndex + 1),
      point,
      ...entity.points.slice(insertAfterIndex + 1),
    ],
  };
}

export function removePolylinePoint(entity: CadEntity, pointIndex: number): CadEntity {
  if (entity.type !== 'polyline') return entity;
  if (entity.points.length <= 2) return entity;

  return {
    ...entity,
    points: entity.points.filter((_, index) => index !== pointIndex),
  };
}

export function hitTestEntity(entity: CadEntity, point: CadPoint, scale: number): boolean {
  const tolerance = hitTolerance / scale;

  if (entity.type === 'line') {
    return (
      pointToSegmentDistance(point, { x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }) <=
      tolerance
    );
  }

  if (entity.type === 'rect') {
    return (
      point.x >= entity.x - tolerance &&
      point.x <= entity.x + entity.width + tolerance &&
      point.y >= entity.y - tolerance &&
      point.y <= entity.y + entity.height + tolerance
    );
  }

  if (entity.type === 'circle') {
    return distance(point, { x: entity.cx, y: entity.cy }) <= entity.radius + tolerance;
  }

  if (entity.type === 'arc') {
    return Math.abs(distance(point, { x: entity.cx, y: entity.cy }) - entity.radius) <= tolerance;
  }

  if (entity.type === 'polyline') {
    return entity.points.some((segmentStart, index) => {
      const segmentEnd = entity.points[index + 1];
      return segmentEnd
        ? pointToSegmentDistance(point, segmentStart, segmentEnd) <= tolerance
        : false;
    });
  }

  if (entity.type === 'text') {
    const width = entity.content.length * entity.fontSize * 0.6;
    return (
      point.x >= entity.x - tolerance &&
      point.x <= entity.x + width + tolerance &&
      point.y >= entity.y - entity.fontSize - tolerance &&
      point.y <= entity.y + tolerance
    );
  }

  return pointToSegmentDistance(point, entity.startPoint, entity.endPoint) <= tolerance;
}

export function isMeaningfulEntity(entity: CadEntity): boolean {
  if (entity.type === 'line') {
    return distance({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }) > 2;
  }
  if (entity.type === 'rect') return entity.width > 2 && entity.height > 2;
  if (entity.type === 'circle') return entity.radius > 2;
  if (entity.type === 'arc') return entity.radius > 2;
  return true;
}

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegmentDistance(point: CadPoint, start: CadPoint, end: CadPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return distance(point, start);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  );
  return distance(point, { x: start.x + t * dx, y: start.y + t * dy });
}
