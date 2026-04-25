import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, WheelEvent } from 'react';
import {
  createEntity,
  createTextEntity,
  hitTestEntity,
  isMeaningfulEntity,
  translateEntity,
} from '../cad/entityGeometry';
import { renderDocument } from '../cad/render';
import type { CadDocument, CadEntity, CadPoint, ToolId, Viewport } from '../cad/types';
import { clampScale, screenToWorld, zoomAt } from '../cad/viewport';

type CadCanvasProps = {
  document: CadDocument;
  activeTool: ToolId;
  viewport: Viewport;
  selectedEntityId: string | null;
  gridVisible: boolean;
  onViewportChange: (viewport: Viewport) => void;
  onCursorChange: (point: CadPoint) => void;
  onDocumentChange: (document: CadDocument | ((current: CadDocument) => CadDocument)) => void;
  onSelectedEntityChange: (entityId: string | null) => void;
  onReady: (api: { zoomBy: (factor: number) => void }) => void;
};

export function CadCanvas({
  document,
  activeTool,
  viewport,
  selectedEntityId,
  gridVisible,
  onViewportChange,
  onCursorChange,
  onDocumentChange,
  onSelectedEntityChange,
  onReady,
}: CadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragStart, setDragStart] = useState<CadPoint | null>(null);
  const [lastWorldPoint, setLastWorldPoint] = useState<CadPoint | null>(null);
  const [draftEntity, setDraftEntity] = useState<CadEntity | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderDocument(
      context,
      draftEntity ? { ...document, entities: [...document.entities, draftEntity] } : document,
      viewport,
      selectedEntityId,
      { showGrid: gridVisible },
    );
  }, [document, draftEntity, gridVisible, selectedEntityId, viewport]);

  useEffect(() => {
    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [render]);

  const zoomBy = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const center = { x: rect.width / 2, y: rect.height / 2 };
      onViewportChange(zoomAt(viewport, center, clampScale(viewport.scale * factor)));
    },
    [onViewportChange, viewport],
  );

  useEffect(() => {
    onReady({ zoomBy });
  }, [onReady, zoomBy]);

  const getLocalPoint = (
    event:
      | PointerEvent<HTMLCanvasElement>
      | MouseEvent<HTMLCanvasElement>
      | WheelEvent<HTMLCanvasElement>,
  ): CadPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const findEntityAt = (point: CadPoint): string | null => {
    for (const entity of [...document.entities].reverse()) {
      const layer = document.layers.find((item) => item.id === entity.layerId);
      if (!entity.visible || entity.locked || layer?.visible === false || layer?.locked) continue;
      if (hitTestEntity(entity, point, viewport.scale)) return entity.id;
    }

    return null;
  };

  const currentLayerId = document.layers[0]?.id ?? 'layer-0';

  return (
    <section className="canvas-stage">
      <canvas
        ref={canvasRef}
        className={`cad-canvas ${activeTool === 'pan' ? 'pan-tool' : ''}`}
        onWheel={(event) => {
          event.preventDefault();
          const localPoint = getLocalPoint(event);
          const nextScale = clampScale(viewport.scale * (event.deltaY > 0 ? 0.9 : 1.1));
          onViewportChange(zoomAt(viewport, localPoint, nextScale));
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const localPoint = getLocalPoint(event);
          const worldPoint = screenToWorld(localPoint, viewport);
          setDragStart(localPoint);
          setLastWorldPoint(worldPoint);

          if (activeTool === 'select') {
            onSelectedEntityChange(findEntityAt(worldPoint));
          }

          if (activeTool === 'erase') {
            const entityId = findEntityAt(worldPoint);
            if (!entityId) return;
            onDocumentChange((current) => ({
              ...current,
              entities: current.entities.filter((entity) => entity.id !== entityId),
            }));
            onSelectedEntityChange(null);
          }

          if (activeTool === 'text') {
            const content = window.prompt('텍스트 내용을 입력하세요.', '텍스트');
            if (!content) return;
            const entity = createTextEntity(worldPoint, content, currentLayerId);
            onDocumentChange((current) => ({
              ...current,
              entities: [...current.entities, entity],
            }));
            onSelectedEntityChange(entity.id);
          }

          if (
            activeTool === 'line' ||
            activeTool === 'rect' ||
            activeTool === 'circle' ||
            activeTool === 'polyline'
          ) {
            const entity = createEntity(activeTool, worldPoint, worldPoint, currentLayerId);
            setDraftEntity(entity);
          }
        }}
        onPointerMove={(event) => {
          const localPoint = getLocalPoint(event);
          const worldPoint = screenToWorld(localPoint, viewport);
          onCursorChange(worldPoint);

          if (!dragStart) return;

          if (activeTool === 'pan' || event.buttons === 4) {
            const dx = localPoint.x - dragStart.x;
            const dy = localPoint.y - dragStart.y;
            onViewportChange({
              ...viewport,
              offsetX: viewport.offsetX + dx,
              offsetY: viewport.offsetY + dy,
            });
          }

          if (activeTool === 'select' && selectedEntityId && lastWorldPoint) {
            const delta = {
              x: worldPoint.x - lastWorldPoint.x,
              y: worldPoint.y - lastWorldPoint.y,
            };
            onDocumentChange((current) => ({
              ...current,
              entities: current.entities.map((entity) =>
                entity.id === selectedEntityId ? translateEntity(entity, delta) : entity,
              ),
            }));
          }

          if (
            (activeTool === 'line' ||
              activeTool === 'rect' ||
              activeTool === 'circle' ||
              activeTool === 'polyline') &&
            lastWorldPoint
          ) {
            setDraftEntity(createEntity(activeTool, lastWorldPoint, worldPoint, currentLayerId));
          }

          setDragStart(localPoint);
          setLastWorldPoint(worldPoint);
        }}
        onPointerUp={() => {
          if (draftEntity && isMeaningfulEntity(draftEntity)) {
            onDocumentChange((current) => ({
              ...current,
              entities: [...current.entities, draftEntity],
            }));
            onSelectedEntityChange(draftEntity.id);
          }

          setDraftEntity(null);
          setDragStart(null);
          setLastWorldPoint(null);
        }}
      />
    </section>
  );
}
