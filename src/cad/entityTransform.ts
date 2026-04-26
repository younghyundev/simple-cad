import type { CadEntity, CadPoint, GroupEntity } from './types';

export type EntityBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AlignMode = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';

export function cloneEntity(entity: CadEntity): CadEntity {
  if (entity.type === 'polyline') {
    return { ...entity, points: entity.points.map(clonePoint) };
  }
  if (entity.type === 'dimension') {
    return { ...entity, startPoint: clonePoint(entity.startPoint), endPoint: clonePoint(entity.endPoint) };
  }
  if (entity.type === 'group') {
    return { ...entity, children: entity.children.map(cloneEntity) };
  }
  return { ...entity };
}

export function createGroupEntity(entities: CadEntity[], layerId: string): GroupEntity {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'group',
    name: `그룹 ${entities.length}`,
    layerId,
    rotation: 0,
    strokeColor: '#0f766e',
    fillColor: 'transparent',
    strokeWidth: 1,
    strokeStyle: 'dashed',
    visible: true,
    locked: false,
    children: entities.map(cloneEntity),
  };
}

export function flattenEntities(entities: CadEntity[]): CadEntity[] {
  return entities.flatMap((entity) => (entity.type === 'group' ? flattenEntities(entity.children) : [entity]));
}

export function getEntityBounds(entity: CadEntity): EntityBounds {
  const points = getEntityBoundsPoints(entity);
  if (!points.length) return { x: 0, y: 0, width: 1, height: 1 };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(1, Math.max(...xs) - x),
    height: Math.max(1, Math.max(...ys) - y),
  };
}

export function getEntityBoundsPoints(entity: CadEntity): CadPoint[] {
  if (entity.type === 'line') return [{ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }];
  if (entity.type === 'rect') {
    return [
      { x: entity.x, y: entity.y },
      { x: entity.x + entity.width, y: entity.y },
      { x: entity.x + entity.width, y: entity.y + entity.height },
      { x: entity.x, y: entity.y + entity.height },
    ];
  }
  if (entity.type === 'circle' || entity.type === 'arc') {
    return [
      { x: entity.cx - entity.radius, y: entity.cy - entity.radius },
      { x: entity.cx + entity.radius, y: entity.cy - entity.radius },
      { x: entity.cx + entity.radius, y: entity.cy + entity.radius },
      { x: entity.cx - entity.radius, y: entity.cy + entity.radius },
    ];
  }
  if (entity.type === 'polyline') return entity.points;
  if (entity.type === 'text') {
    const lines = entity.content.split(/\r\n|\r|\n/);
    const maxLineLength = Math.max(...lines.map((line) => line.length), 1);
    return [
      { x: entity.x, y: entity.y - entity.fontSize },
      {
        x: entity.x + maxLineLength * entity.fontSize * 0.6,
        y: entity.y + entity.fontSize * (lines.length - 1) * 1.25,
      },
    ];
  }
  if (entity.type === 'dimension') {
    const geometry = getDimensionGeometry(entity);
    return [entity.startPoint, entity.endPoint, geometry.dimensionStart, geometry.dimensionEnd];
  }
  return entity.children.flatMap((child) => getEntityBoundsPoints(child));
}

export function getSelectionBounds(entities: CadEntity[]): EntityBounds | null {
  const points = entities.flatMap((entity) => getEntityBoundsPoints(entity));
  if (!points.length) return null;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(1, Math.max(...xs) - x),
    height: Math.max(1, Math.max(...ys) - y),
  };
}

export function getBoundsCenter(bounds: EntityBounds): CadPoint {
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

export function translateEntity(entity: CadEntity, delta: CadPoint): CadEntity {
  if (entity.locked) return entity;
  if (entity.type === 'line') {
    return { ...entity, x1: entity.x1 + delta.x, y1: entity.y1 + delta.y, x2: entity.x2 + delta.x, y2: entity.y2 + delta.y };
  }
  if (entity.type === 'rect') return { ...entity, x: entity.x + delta.x, y: entity.y + delta.y };
  if (entity.type === 'circle') return { ...entity, cx: entity.cx + delta.x, cy: entity.cy + delta.y };
  if (entity.type === 'arc') return { ...entity, cx: entity.cx + delta.x, cy: entity.cy + delta.y };
  if (entity.type === 'polyline') {
    return { ...entity, points: entity.points.map((point) => ({ x: point.x + delta.x, y: point.y + delta.y })) };
  }
  if (entity.type === 'text') return { ...entity, x: entity.x + delta.x, y: entity.y + delta.y };
  if (entity.type === 'dimension') {
    return {
      ...entity,
      startPoint: { x: entity.startPoint.x + delta.x, y: entity.startPoint.y + delta.y },
      endPoint: { x: entity.endPoint.x + delta.x, y: entity.endPoint.y + delta.y },
    };
  }
  return { ...entity, children: entity.children.map((child) => translateEntity(child, delta)) };
}

export function rotatePoint(point: CadPoint, pivot: CadPoint, degrees: number): CadPoint {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

export function rotateEntity(entity: CadEntity, pivot: CadPoint, degrees: number): CadEntity {
  if (entity.locked || !degrees) return entity;
  if (entity.type === 'line') {
    const start = rotatePoint({ x: entity.x1, y: entity.y1 }, pivot, degrees);
    const end = rotatePoint({ x: entity.x2, y: entity.y2 }, pivot, degrees);
    return { ...entity, x1: start.x, y1: start.y, x2: end.x, y2: end.y, rotation: normalizeRotation(entity.rotation + degrees) };
  }
  if (entity.type === 'rect') {
    const points = getEntityBoundsPoints(entity).map((point) => rotatePoint(point, pivot, degrees));
    const { type: _type, x: _x, y: _y, width: _width, height: _height, ...base } = entity;
    return { ...base, type: 'polyline', points: [...points, points[0]], fillColor: 'transparent', rotation: normalizeRotation(entity.rotation + degrees) };
  }
  if (entity.type === 'circle') {
    const center = rotatePoint({ x: entity.cx, y: entity.cy }, pivot, degrees);
    return { ...entity, cx: center.x, cy: center.y, rotation: normalizeRotation(entity.rotation + degrees) };
  }
  if (entity.type === 'arc') {
    const center = rotatePoint({ x: entity.cx, y: entity.cy }, pivot, degrees);
    return {
      ...entity,
      cx: center.x,
      cy: center.y,
      startAngle: normalizeRotation(entity.startAngle + degrees),
      endAngle: normalizeRotation(entity.endAngle + degrees),
      rotation: normalizeRotation(entity.rotation + degrees),
    };
  }
  if (entity.type === 'polyline') {
    return { ...entity, points: entity.points.map((point) => rotatePoint(point, pivot, degrees)), rotation: normalizeRotation(entity.rotation + degrees) };
  }
  if (entity.type === 'text') {
    const point = rotatePoint({ x: entity.x, y: entity.y }, pivot, degrees);
    return { ...entity, x: point.x, y: point.y, rotation: normalizeRotation(entity.rotation + degrees) };
  }
  if (entity.type === 'dimension') {
    return {
      ...entity,
      startPoint: rotatePoint(entity.startPoint, pivot, degrees),
      endPoint: rotatePoint(entity.endPoint, pivot, degrees),
      rotation: normalizeRotation(entity.rotation + degrees),
    };
  }
  return {
    ...entity,
    rotation: normalizeRotation(entity.rotation + degrees),
    children: entity.children.map((child) => rotateEntity(child, pivot, degrees)),
  };
}

export function alignEntities(entities: CadEntity[], selectedIds: string[], mode: AlignMode): CadEntity[] {
  const selectedSet = new Set(selectedIds);
  const selected = entities.filter((entity) => selectedSet.has(entity.id));
  const selectionBounds = getSelectionBounds(selected);
  if (!selectionBounds || selected.length < 2) return entities;

  return entities.map((entity) => {
    if (!selectedSet.has(entity.id)) return entity;
    const bounds = getEntityBounds(entity);
    const delta = alignmentDelta(bounds, selectionBounds, mode);
    return translateEntity(entity, delta);
  });
}

function alignmentDelta(bounds: EntityBounds, target: EntityBounds, mode: AlignMode): CadPoint {
  if (mode === 'left') return { x: target.x - bounds.x, y: 0 };
  if (mode === 'right') return { x: target.x + target.width - (bounds.x + bounds.width), y: 0 };
  if (mode === 'center-x') return { x: target.x + target.width / 2 - (bounds.x + bounds.width / 2), y: 0 };
  if (mode === 'top') return { x: 0, y: target.y - bounds.y };
  if (mode === 'bottom') return { x: 0, y: target.y + target.height - (bounds.y + bounds.height) };
  return { x: 0, y: target.y + target.height / 2 - (bounds.y + bounds.height / 2) };
}

export function getDimensionGeometry(entity: Extract<CadEntity, { type: 'dimension' }>) {
  const dx = entity.endPoint.x - entity.startPoint.x;
  const dy = entity.endPoint.y - entity.startPoint.y;
  const length = Math.hypot(dx, dy) || 1;
  const offset = entity.labelOffset ?? -24;
  const normal = { x: -dy / length, y: dx / length };
  return {
    dimensionStart: {
      x: entity.startPoint.x + normal.x * offset,
      y: entity.startPoint.y + normal.y * offset,
    },
    dimensionEnd: {
      x: entity.endPoint.x + normal.x * offset,
      y: entity.endPoint.y + normal.y * offset,
    },
  };
}

function clonePoint(point: CadPoint): CadPoint {
  return { x: point.x, y: point.y };
}

function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}
