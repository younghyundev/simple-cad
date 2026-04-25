import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, WheelEvent } from 'react';
import {
  createEntity,
  createTextEntity,
  hitTestEntity,
  hitTestResizeHandle,
  insertPolylinePoint,
  isMeaningfulEntity,
  removePolylinePoint,
  resizeEntity,
  type ResizeHandleId,
  translateEntity,
} from '../cad/entityGeometry';
import { renderDocument } from '../cad/render';
import { snapPoint, type SnapResult } from '../cad/snap';
import type { CadDocument, CadEntity, CadPoint, ToolId, Viewport } from '../cad/types';
import { clampScale, screenToWorld, worldToScreen, zoomAt } from '../cad/viewport';

type CadCanvasProps = {
  document: CadDocument;
  activeTool: ToolId;
  viewport: Viewport;
  selectedEntityId: string | null;
  gridVisible: boolean;
  snapEnabled: boolean;
  onViewportChange: (viewport: Viewport) => void;
  onCursorChange: (point: CadPoint) => void;
  onDocumentChange: (
    document: CadDocument | ((current: CadDocument) => CadDocument),
    options?: { trackHistory?: boolean },
  ) => void;
  onDocumentBatchStart: (snapshot: CadDocument) => void;
  onDocumentBatchCommit: () => void;
  onSelectedEntityChange: (entityId: string | null) => void;
  onReady: (api: { zoomBy: (factor: number) => void }) => void;
};

type TextDraft = {
  entityId?: string;
  screenPoint: CadPoint;
  worldPoint: CadPoint;
  value: string;
};

export function CadCanvas({
  document,
  activeTool,
  viewport,
  selectedEntityId,
  gridVisible,
  snapEnabled,
  onViewportChange,
  onCursorChange,
  onDocumentChange,
  onDocumentBatchStart,
  onDocumentBatchCommit,
  onSelectedEntityChange,
  onReady,
}: CadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draftEntityRef = useRef<CadEntity | null>(null);
  const textDraftRef = useRef<TextDraft | null>(null);
  const movingEntityRef = useRef(false);
  const movedEntityRef = useRef(false);
  const resizingHandleRef = useRef<ResizeHandleId | null>(null);
  const resizingEntityRef = useRef(false);
  const resizedEntityRef = useRef(false);
  const [dragStart, setDragStart] = useState<CadPoint | null>(null);
  const [drawingStart, setDrawingStart] = useState<CadPoint | null>(null);
  const [lastWorldPoint, setLastWorldPoint] = useState<CadPoint | null>(null);
  const [draftEntity, setDraftEntity] = useState<CadEntity | null>(null);
  const [textDraft, setTextDraftState] = useState<TextDraft | null>(null);
  const [snapMarker, setSnapMarker] = useState<SnapResult | null>(null);
  const [selectedPolylinePoint, setSelectedPolylinePoint] = useState<{
    entityId: string;
    pointIndex: number;
  } | null>(null);

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

  const resolveWorldPoint = (point: CadPoint, excludeEntityId?: string | null): SnapResult => {
    return snapPoint(point, document, {
      enabled: snapEnabled,
      scale: viewport.scale,
      excludeEntityId,
    });
  };

  const selectedEntity = selectedEntityId
    ? document.entities.find((entity) => entity.id === selectedEntityId)
    : null;

  const findResizeHandleAt = (point: CadPoint): ResizeHandleId | null => {
    if (!selectedEntity) return null;
    const layer = document.layers.find((item) => item.id === selectedEntity.layerId);
    if (
      !selectedEntity.visible ||
      selectedEntity.locked ||
      layer?.visible === false ||
      layer?.locked
    ) {
      return null;
    }

    return hitTestResizeHandle(selectedEntity, point, viewport.scale)?.id ?? null;
  };

  const currentLayerId = document.layers[0]?.id ?? 'layer-0';

  const updateDraftEntity = (entity: CadEntity | null) => {
    draftEntityRef.current = entity;
    setDraftEntity(entity);
  };

  const updateTextDraft = (draft: TextDraft | null) => {
    textDraftRef.current = draft;
    setTextDraftState(draft);
  };

  const commitTextDraft = () => {
    const draft = textDraftRef.current;
    updateTextDraft(null);

    if (!draft || !draft.value.trim()) {
      return;
    }

    if (draft.entityId) {
      onDocumentChange((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === draft.entityId && entity.type === 'text'
            ? { ...entity, content: draft.value.trim() }
            : entity,
        ),
      }));
      onSelectedEntityChange(draft.entityId);
      return;
    }

    const entity = createTextEntity(draft.worldPoint, draft.value.trim(), currentLayerId);
    onDocumentChange((current) => ({
      ...current,
      entities: [...current.entities, entity],
    }));
    onSelectedEntityChange(entity.id);
  };

  const openTextEditor = (entity: CadEntity) => {
    if (entity.type !== 'text') return;
    const worldPoint = { x: entity.x, y: entity.y };
    updateTextDraft({
      entityId: entity.id,
      screenPoint: worldToScreen(worldPoint, viewport),
      worldPoint,
      value: entity.content,
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingText =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditingText) return;
      if ((event.key !== 'Delete' && event.key !== 'Backspace') || !selectedPolylinePoint) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onDocumentChange((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === selectedPolylinePoint.entityId
            ? removePolylinePoint(entity, selectedPolylinePoint.pointIndex)
            : entity,
        ),
      }));
      setSelectedPolylinePoint(null);
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [onDocumentChange, selectedPolylinePoint]);

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
          const rawWorldPoint = screenToWorld(localPoint, viewport);
          const snap = resolveWorldPoint(rawWorldPoint, selectedEntityId);
          const worldPoint = snap.point;
          setSnapMarker(snap.type === 'none' ? null : snap);
          setDragStart(localPoint);
          setDrawingStart(worldPoint);
          setLastWorldPoint(worldPoint);

          if (activeTool === 'select') {
            const handleId = findResizeHandleAt(worldPoint);
            if (handleId && selectedEntityId) {
              if (handleId.startsWith('point-')) {
                setSelectedPolylinePoint({
                  entityId: selectedEntityId,
                  pointIndex: Number(handleId.replace('point-', '')),
                });
              } else {
                setSelectedPolylinePoint(null);
              }
              resizingHandleRef.current = handleId;
              resizingEntityRef.current = true;
              resizedEntityRef.current = false;
              onDocumentBatchStart(document);
              return;
            }

            const entityId = findEntityAt(worldPoint);
            onSelectedEntityChange(entityId);
            setSelectedPolylinePoint(null);
            if (entityId) {
              movingEntityRef.current = true;
              movedEntityRef.current = false;
              onDocumentBatchStart(document);
            }
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
            updateTextDraft({
              screenPoint: localPoint,
              worldPoint,
              value: '',
            });
            onSelectedEntityChange(null);
          }

          if (
            activeTool === 'line' ||
            activeTool === 'rect' ||
            activeTool === 'circle' ||
            activeTool === 'polyline'
          ) {
            const entity = createEntity(activeTool, worldPoint, worldPoint, currentLayerId);
            updateDraftEntity(entity);
          }
        }}
        onPointerMove={(event) => {
          const localPoint = getLocalPoint(event);
          const rawWorldPoint = screenToWorld(localPoint, viewport);
          const snap = resolveWorldPoint(rawWorldPoint, selectedEntityId);
          const worldPoint = snap.point;
          setSnapMarker(snap.type === 'none' ? null : snap);
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
            const handleId = resizingHandleRef.current;
            if (handleId) {
              resizedEntityRef.current = true;
              onDocumentChange((current) => ({
                ...current,
                entities: current.entities.map((entity) =>
                  entity.id === selectedEntityId ? resizeEntity(entity, handleId, worldPoint) : entity,
                ),
              }), { trackHistory: false });
              setDragStart(localPoint);
              setLastWorldPoint(worldPoint);
              return;
            }

            const unsnappedWorldPoint = screenToWorld(localPoint, viewport);
            const unsnappedLastPoint = lastWorldPoint;
            const delta = {
              x: unsnappedWorldPoint.x - unsnappedLastPoint.x,
              y: unsnappedWorldPoint.y - unsnappedLastPoint.y,
            };
            if (Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0) {
              movedEntityRef.current = true;
            }
            onDocumentChange((current) => ({
              ...current,
              entities: current.entities.map((entity) =>
                entity.id === selectedEntityId ? translateEntity(entity, delta) : entity,
              ),
            }), { trackHistory: false });
            setDragStart(localPoint);
            setLastWorldPoint(unsnappedWorldPoint);
            return;
          }

          if (
            (activeTool === 'line' ||
              activeTool === 'rect' ||
              activeTool === 'circle' ||
              activeTool === 'polyline') &&
            drawingStart
          ) {
            updateDraftEntity(createEntity(activeTool, drawingStart, worldPoint, currentLayerId));
          }

          setDragStart(localPoint);
          setLastWorldPoint(worldPoint);
        }}
        onPointerUp={() => {
          const entity = draftEntityRef.current;
          if (entity && isMeaningfulEntity(entity)) {
            onDocumentChange((current) => ({
              ...current,
              entities: [...current.entities, entity],
            }));
            onSelectedEntityChange(entity.id);
          }

          updateDraftEntity(null);
          setDragStart(null);
          setDrawingStart(null);
          setLastWorldPoint(null);
          setSnapMarker(null);
          if (movingEntityRef.current) {
            movingEntityRef.current = false;
            if (movedEntityRef.current) onDocumentBatchCommit();
            movedEntityRef.current = false;
          }
          if (resizingEntityRef.current) {
            resizingEntityRef.current = false;
            resizingHandleRef.current = null;
            if (resizedEntityRef.current) onDocumentBatchCommit();
            resizedEntityRef.current = false;
          }
        }}
        onDoubleClick={(event) => {
          const worldPoint = screenToWorld(getLocalPoint(event), viewport);
          const snap = resolveWorldPoint(worldPoint, selectedEntityId);
          const snapWorldPoint = snap.point;
          const entityId = findEntityAt(worldPoint);
          const entity = document.entities.find((item) => item.id === entityId);
          if (entity?.type === 'text') openTextEditor(entity);
          if (entity?.type === 'polyline') {
            onDocumentChange((current) => ({
              ...current,
              entities: current.entities.map((item) =>
                item.id === entity.id ? insertPolylinePoint(item, snapWorldPoint) : item,
              ),
            }));
            onSelectedEntityChange(entity.id);
          }
        }}
      />
      {snapMarker ? (
        <div
          className={`snap-marker ${snapMarker.type}`}
          style={{
            left: worldToScreen(snapMarker.point, viewport).x,
            top: worldToScreen(snapMarker.point, viewport).y,
          }}
        />
      ) : null}
      {textDraft ? (
        <input
          className="canvas-text-input"
          style={{
            left: textDraft.screenPoint.x,
            top: textDraft.screenPoint.y,
          }}
          value={textDraft.value}
          autoFocus
          onChange={(event) =>
            updateTextDraft(
              textDraftRef.current
                ? { ...textDraftRef.current, value: event.currentTarget.value }
                : null,
            )
          }
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          onBlur={commitTextDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitTextDraft();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              updateTextDraft(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
