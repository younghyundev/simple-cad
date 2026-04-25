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
  if (!Number.isFinite(lineWeight) || lineWeight <= 0) return 2;

  return Math.max(1, Math.min(12, Math.round(lineWeight / 25)));
}

export function strokeWidthToDxfLineWeight(value: number): number {
  return Math.max(25, Math.min(300, Math.round(value * 25)));
}
