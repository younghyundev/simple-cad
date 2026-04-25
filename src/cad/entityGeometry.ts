import type { CadEntity, CadEntityBase, CadPoint, ToolId } from './types';

const hitTolerance = 8;

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
