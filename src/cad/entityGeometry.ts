import type { CadEntity, CadEntityBase, CadPoint, ToolId } from './types';
import { getDimensionGeometry, translateEntity } from './entityTransform';

export { translateEntity } from './entityTransform';

const hitTolerance = 5;

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

  if (tool === 'dimension') {
    return {
      ...base,
      type: 'dimension',
      fillColor: '#1f2937',
      startPoint: start,
      endPoint: end,
      label: formatDistance(start, end),
      labelMode: 'auto',
      labelOffset: -24,
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

  if (entity.type === 'dimension') {
    return [
      { id: 'start', point: entity.startPoint, cursor: 'nwse-resize' },
      { id: 'end', point: entity.endPoint, cursor: 'nwse-resize' },
    ];
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

  if (entity.type === 'dimension') {
    if (handleId === 'start') {
      return updateDimensionLabel({ ...entity, startPoint: point });
    }
    if (handleId === 'end') {
      return updateDimensionLabel({ ...entity, endPoint: point });
    }
  }

  return entity;
}

export function updateDimensionLabel(entity: CadEntity): CadEntity {
  if (entity.type !== 'dimension') return entity;
  if (entity.labelMode === 'manual') return entity;

  return {
    ...entity,
    label: formatDistance(entity.startPoint, entity.endPoint),
    labelMode: 'auto',
  };
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
  if (entity.type === 'group') {
    return entity.children.some((child) => hitTestEntity(child, point, scale));
  }

  if (entity.type === 'line') {
    return (
      pointToSegmentDistance(point, { x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }) <=
      tolerance
    );
  }

  if (entity.type === 'rect') {
    const left = entity.x;
    const right = entity.x + entity.width;
    const top = entity.y;
    const bottom = entity.y + entity.height;
    const edges = [
      [{ x: left, y: top }, { x: right, y: top }],
      [{ x: right, y: top }, { x: right, y: bottom }],
      [{ x: right, y: bottom }, { x: left, y: bottom }],
      [{ x: left, y: bottom }, { x: left, y: top }],
    ] as const;
    return (
      point.x >= left - tolerance &&
      point.x <= right + tolerance &&
      point.y >= top - tolerance &&
      point.y <= bottom + tolerance &&
      edges.some(([start, end]) => pointToSegmentDistance(point, start, end) <= tolerance)
    );
  }

  if (entity.type === 'circle') {
    return Math.abs(distance(point, { x: entity.cx, y: entity.cy }) - entity.radius) <= tolerance;
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
    const lines = getTextLines(entity.content);
    const maxLineLength = Math.max(...lines.map((line) => line.length), 1);
    const width = maxLineLength * entity.fontSize * 0.6;
    const height = entity.fontSize * lines.length * 1.25;
    return (
      point.x >= entity.x - tolerance &&
      point.x <= entity.x + width + tolerance &&
      point.y >= entity.y - entity.fontSize - tolerance &&
      point.y <= entity.y + height - entity.fontSize + tolerance
    );
  }

  if (entity.type === 'dimension') {
    const geometry = getDimensionGeometry(entity);
    return (
      pointToSegmentDistance(point, entity.startPoint, geometry.dimensionStart) <= tolerance ||
      pointToSegmentDistance(point, entity.endPoint, geometry.dimensionEnd) <= tolerance ||
      pointToSegmentDistance(point, geometry.dimensionStart, geometry.dimensionEnd) <= tolerance
    );
  }

  return false;
}

export function isMeaningfulEntity(entity: CadEntity): boolean {
  if (entity.type === 'line') {
    return distance({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }) > 2;
  }
  if (entity.type === 'rect') return entity.width > 2 && entity.height > 2;
  if (entity.type === 'circle') return entity.radius > 2;
  if (entity.type === 'arc') return entity.radius > 2;
  if (entity.type === 'group') return entity.children.some(isMeaningfulEntity);
  return true;
}

function distance(a: CadPoint, b: CadPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatDistance(a: CadPoint, b: CadPoint): string {
  return distance(a, b).toFixed(1);
}

function getTextLines(value: string): string[] {
  return value.split(/\r\n|\r|\n/);
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
