import type { CadDocument, CadEntity, Viewport } from './types';
import { getResizeHandles } from './entityGeometry';
import { getDimensionGeometry, getEntityBounds } from './entityTransform';
import { worldToScreen } from './viewport';

const majorGridEvery = 5;

export function renderDocument(
  context: CanvasRenderingContext2D,
  document: CadDocument,
  viewport: Viewport,
  selectedEntityIds: string[] = [],
  options: { showGrid: boolean } = { showGrid: true },
): void {
  const canvas = context.canvas;
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground(context);
  if (options.showGrid) drawGrid(context, viewport);

  const layersById = new Map(document.layers.map((layer) => [layer.id, layer]));
  const selectedSet = new Set(selectedEntityIds);

  for (const entity of document.entities) {
    const layer = layersById.get(entity.layerId);
    if (!entity.visible || layer?.visible === false) continue;
    drawEntity(context, entity, viewport, selectedSet.has(entity.id));
  }
}

function drawBackground(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

function drawGrid(context: CanvasRenderingContext2D, viewport: Viewport): void {
  const baseStep = 20;
  const step = baseStep * viewport.scale;
  if (step < 4) return;

  const width = context.canvas.width;
  const height = context.canvas.height;
  const startX = modulo(viewport.offsetX, step);
  const startY = modulo(viewport.offsetY, step);

  context.save();
  context.lineWidth = 1;

  for (let x = startX; x <= width; x += step) {
    const index = Math.round((x - viewport.offsetX) / step);
    context.strokeStyle = index % majorGridEvery === 0 ? '#d4dce8' : '#e8edf4';
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = startY; y <= height; y += step) {
    const index = Math.round((y - viewport.offsetY) / step);
    context.strokeStyle = index % majorGridEvery === 0 ? '#d4dce8' : '#e8edf4';
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const origin = worldToScreen({ x: 0, y: 0 }, viewport);
  context.strokeStyle = '#94a3b8';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(origin.x, 0);
  context.lineTo(origin.x, height);
  context.moveTo(0, origin.y);
  context.lineTo(width, origin.y);
  context.stroke();
  context.restore();
}

function drawEntity(
  context: CanvasRenderingContext2D,
  entity: CadEntity,
  viewport: Viewport,
  selected: boolean,
): void {
  if (entity.type === 'group') {
    for (const child of entity.children) {
      drawEntity(context, child, viewport, false);
    }
    if (selected) drawSelection(context, entity, viewport);
    return;
  }

  context.save();
  context.strokeStyle = entity.strokeColor;
  context.fillStyle = entity.fillColor;
  context.lineWidth = Math.max(1, entity.strokeWidth * viewport.scale);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.setLineDash(entity.strokeStyle === 'dashed' ? [8, 6] : []);

  if (entity.type === 'line') {
    const start = worldToScreen({ x: entity.x1, y: entity.y1 }, viewport);
    const end = worldToScreen({ x: entity.x2, y: entity.y2 }, viewport);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  if (entity.type === 'rect') {
    const point = worldToScreen({ x: entity.x, y: entity.y }, viewport);
    context.beginPath();
    context.rect(
      point.x,
      point.y,
      entity.width * viewport.scale,
      entity.height * viewport.scale,
    );
    if (entity.fillColor !== 'transparent') context.fill();
    context.stroke();
  }

  if (entity.type === 'circle') {
    const center = worldToScreen({ x: entity.cx, y: entity.cy }, viewport);
    context.beginPath();
    context.arc(center.x, center.y, entity.radius * viewport.scale, 0, Math.PI * 2);
    if (entity.fillColor !== 'transparent') context.fill();
    context.stroke();
  }

  if (entity.type === 'arc') {
    const center = worldToScreen({ x: entity.cx, y: entity.cy }, viewport);
    context.beginPath();
    context.arc(
      center.x,
      center.y,
      entity.radius * viewport.scale,
      degreesToRadians(-entity.startAngle),
      degreesToRadians(-entity.endAngle),
      true,
    );
    context.stroke();
  }

  if (entity.type === 'polyline') {
    context.beginPath();
    entity.points.forEach((point, index) => {
      const screenPoint = worldToScreen(point, viewport);
      if (index === 0) context.moveTo(screenPoint.x, screenPoint.y);
      else context.lineTo(screenPoint.x, screenPoint.y);
    });
    context.stroke();
  }

  if (entity.type === 'text') {
    const point = worldToScreen({ x: entity.x, y: entity.y }, viewport);
    const fontSize = entity.fontSize * viewport.scale;
    const lineHeight = fontSize * 1.25;
    context.fillStyle = entity.fillColor;
    context.font = `${fontSize}px Inter, system-ui, sans-serif`;
    if (entity.rotation) {
      context.translate(point.x, point.y);
      context.rotate(degreesToRadians(entity.rotation));
      getTextLines(entity.content).forEach((line, index) => {
        context.fillText(line, 0, index * lineHeight);
      });
      if (selected) drawSelection(context, entity, viewport);
      context.restore();
      return;
    }
    getTextLines(entity.content).forEach((line, index) => {
      context.fillText(line, point.x, point.y + index * lineHeight);
    });
  }

  if (entity.type === 'dimension') {
    drawDimension(context, entity, viewport);
  }

  if (selected) drawSelection(context, entity, viewport);
  context.restore();
}

function drawDimension(
  context: CanvasRenderingContext2D,
  entity: Extract<CadEntity, { type: 'dimension' }>,
  viewport: Viewport,
): void {
  const geometry = getDimensionGeometry(entity);
  const start = worldToScreen(entity.startPoint, viewport);
  const end = worldToScreen(entity.endPoint, viewport);
  const dimensionStart = worldToScreen(geometry.dimensionStart, viewport);
  const dimensionEnd = worldToScreen(geometry.dimensionEnd, viewport);
  const mid = {
    x: (dimensionStart.x + dimensionEnd.x) / 2,
    y: (dimensionStart.y + dimensionEnd.y) / 2,
  };
  const angle = Math.atan2(dimensionEnd.y - dimensionStart.y, dimensionEnd.x - dimensionStart.x);
  const arrowSize = 8;

  context.save();
  context.setLineDash([]);
  context.strokeStyle = entity.strokeColor;
  context.fillStyle = entity.fillColor;
  context.lineWidth = Math.max(1, entity.strokeWidth * viewport.scale);

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(dimensionStart.x, dimensionStart.y);
  context.moveTo(end.x, end.y);
  context.lineTo(dimensionEnd.x, dimensionEnd.y);
  context.stroke();

  context.beginPath();
  context.moveTo(dimensionStart.x, dimensionStart.y);
  context.lineTo(dimensionEnd.x, dimensionEnd.y);
  context.stroke();

  drawArrowHead(context, dimensionStart, angle + Math.PI, arrowSize);
  drawArrowHead(context, dimensionEnd, angle, arrowSize);

  context.font = `${13 * Math.max(1, Math.min(1.25, viewport.scale))}px Inter, system-ui, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  context.fillText(entity.label, mid.x, mid.y - 6);
  context.restore();
}

function drawArrowHead(
  context: CanvasRenderingContext2D,
  point: { x: number; y: number },
  angle: number,
  size: number,
): void {
  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(point.x - size * Math.cos(angle - Math.PI / 7), point.y - size * Math.sin(angle - Math.PI / 7));
  context.lineTo(point.x - size * Math.cos(angle + Math.PI / 7), point.y - size * Math.sin(angle + Math.PI / 7));
  context.closePath();
  context.fill();
}

function drawSelection(
  context: CanvasRenderingContext2D,
  entity: CadEntity,
  viewport: Viewport,
): void {
  const bounds = getEntityBounds(entity);
  const start = worldToScreen({ x: bounds.x, y: bounds.y }, viewport);
  const end = worldToScreen(
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    viewport,
  );

  context.save();
  context.strokeStyle = '#0f766e';
  context.lineWidth = 1.5;
  context.setLineDash([6, 4]);
  context.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  context.setLineDash([]);
  context.fillStyle = '#0f766e';

  const handles = getResizeHandles(entity);
  const points = handles.length
    ? handles.map((handle) => worldToScreen(handle.point, viewport))
    : [start, { x: end.x, y: start.y }, end, { x: start.x, y: end.y }];

  for (const point of points) {
    context.fillStyle = '#ffffff';
    context.fillRect(point.x - 5, point.y - 5, 10, 10);
    context.strokeStyle = '#0f766e';
    context.lineWidth = 1.5;
    context.strokeRect(point.x - 5, point.y - 5, 10, 10);
  }

  context.restore();
}

function modulo(value: number, size: number): number {
  return ((value % size) + size) % size;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getTextLines(value: string): string[] {
  return value.split(/\r\n|\r|\n/);
}
