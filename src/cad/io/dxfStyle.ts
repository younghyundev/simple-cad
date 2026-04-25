export function dxfLineTypeToStrokeStyle(value: string | undefined): 'solid' | 'dashed' {
  if (!value) return 'solid';
  const normalized = value.trim().toUpperCase();
  if (normalized === 'BYLAYER' || normalized === 'BYBLOCK' || normalized === 'CONTINUOUS') {
    return 'solid';
  }
  return 'dashed';
}

export function strokeStyleToDxfLineType(value: 'solid' | 'dashed' | undefined): string {
  return value === 'dashed' ? 'DASHED' : 'CONTINUOUS';
}

export function dxfLineWeightToStrokeWidth(value: string | undefined): number {
  const lineWeight = Number(value);
  if (!Number.isFinite(lineWeight) || lineWeight <= 0) return 1;

  return Math.max(1, Math.min(4, Math.round(lineWeight / 100)));
}

export function strokeWidthToDxfLineWeight(value: number): number {
  return Math.max(25, Math.min(400, Math.round(value * 100)));
}
