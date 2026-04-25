import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, WheelEvent } from 'react';
import { renderDocument } from '../cad/render';
import type { CadDocument, CadPoint, ToolId, Viewport } from '../cad/types';
import { clampScale, screenToWorld, zoomAt } from '../cad/viewport';

type CadCanvasProps = {
  document: CadDocument;
  activeTool: ToolId;
  viewport: Viewport;
  selectedEntityId: string | null;
  gridVisible: boolean;
  onViewportChange: (viewport: Viewport) => void;
  onCursorChange: (point: CadPoint) => void;
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
  onSelectedEntityChange,
  onReady,
}: CadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragStart, setDragStart] = useState<CadPoint | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderDocument(context, document, viewport, selectedEntityId, { showGrid: gridVisible });
  }, [document, gridVisible, selectedEntityId, viewport]);

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
          setDragStart(getLocalPoint(event));

          if (activeTool === 'select') {
            onSelectedEntityChange(selectedEntityId ? null : 'rect-1');
          }
        }}
        onPointerMove={(event) => {
          const localPoint = getLocalPoint(event);
          onCursorChange(screenToWorld(localPoint, viewport));

          if (!dragStart) return;
          if (activeTool !== 'pan' && event.buttons !== 4) return;

          const dx = localPoint.x - dragStart.x;
          const dy = localPoint.y - dragStart.y;
          onViewportChange({
            ...viewport,
            offsetX: viewport.offsetX + dx,
            offsetY: viewport.offsetY + dy,
          });
          setDragStart(localPoint);
        }}
        onPointerUp={() => {
          setDragStart(null);
        }}
      />
    </section>
  );
}
