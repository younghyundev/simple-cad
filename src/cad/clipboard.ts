import { cloneEntity, translateEntity } from './entityTransform';
import type { CadDocument, CadEntity, CadPoint } from './types';

export type CadClipboardPayload = {
  entities: CadEntity[];
  sourceBasePoint?: CadPoint;
  createdAt: string;
};

type PasteOptions = {
  destinationDocument: CadDocument;
  destinationBasePoint?: CadPoint;
  fallbackOffset?: CadPoint;
};

export function createClipboardPayload(
  entities: CadEntity[],
  sourceBasePoint?: CadPoint,
): CadClipboardPayload {
  return {
    entities: entities.map((entity) => cloneEntity(entity)),
    sourceBasePoint: sourceBasePoint ? clonePoint(sourceBasePoint) : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function pasteClipboardPayload(
  payload: CadClipboardPayload,
  options: PasteOptions,
): { entities: CadEntity[]; entityIds: string[] } {
  const sourceBasePoint = payload.sourceBasePoint;
  const destinationBasePoint = options.destinationBasePoint;
  const fallbackOffset = options.fallbackOffset ?? { x: 20, y: 20 };
  const delta =
    sourceBasePoint && destinationBasePoint
      ? {
          x: destinationBasePoint.x - sourceBasePoint.x,
          y: destinationBasePoint.y - sourceBasePoint.y,
        }
      : fallbackOffset;

  const entities = payload.entities.map((entity, index) =>
    translateEntity(
      withDestinationLayer(withCopyId(cloneEntity(entity), index), options.destinationDocument),
      delta,
    ),
  );

  return {
    entities,
    entityIds: entities.map((entity) => entity.id),
  };
}

function withCopyId(entity: CadEntity, index: number): CadEntity {
  if (entity.type === 'group') {
    return {
      ...entity,
      id: `copy-${entity.type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      children: entity.children.map((child, childIndex) => withCopyId(child, childIndex)),
    };
  }

  return {
    ...entity,
    id: `copy-${entity.type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
  } as CadEntity;
}

function withDestinationLayer(entity: CadEntity, destinationDocument: CadDocument): CadEntity {
  const hasLayer = destinationDocument.layers.some((layer) => layer.id === entity.layerId);
  if (hasLayer) return entity;

  return {
    ...entity,
    layerId: destinationDocument.layers[0]?.id ?? 'layer-0',
  } as CadEntity;
}

function clonePoint(point: CadPoint): CadPoint {
  return { x: point.x, y: point.y };
}
