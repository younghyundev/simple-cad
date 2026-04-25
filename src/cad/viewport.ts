import type { CadPoint, Viewport } from './types';

export function screenToWorld(point: CadPoint, viewport: Viewport): CadPoint {
  return {
    x: (point.x - viewport.offsetX) / viewport.scale,
    y: (point.y - viewport.offsetY) / viewport.scale,
  };
}

export function worldToScreen(point: CadPoint, viewport: Viewport): CadPoint {
  return {
    x: point.x * viewport.scale + viewport.offsetX,
    y: point.y * viewport.scale + viewport.offsetY,
  };
}

export function zoomAt(
  viewport: Viewport,
  screenPoint: CadPoint,
  nextScale: number,
): Viewport {
  const worldPoint = screenToWorld(screenPoint, viewport);

  return {
    scale: nextScale,
    offsetX: screenPoint.x - worldPoint.x * nextScale,
    offsetY: screenPoint.y - worldPoint.y * nextScale,
  };
}

export function clampScale(scale: number): number {
  return Math.min(8, Math.max(0.15, scale));
}
