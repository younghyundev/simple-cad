const aciPalette: Array<{ code: number; hex: string; rgb: [number, number, number] }> = [
  { code: 1, hex: '#dc2626', rgb: [220, 38, 38] },
  { code: 2, hex: '#ca8a04', rgb: [202, 138, 4] },
  { code: 3, hex: '#16a34a', rgb: [22, 163, 74] },
  { code: 4, hex: '#0891b2', rgb: [8, 145, 178] },
  { code: 5, hex: '#2563eb', rgb: [37, 99, 235] },
  { code: 6, hex: '#c026d3', rgb: [192, 38, 211] },
  { code: 7, hex: '#1f2937', rgb: [31, 41, 55] },
  { code: 8, hex: '#6b7280', rgb: [107, 114, 128] },
  { code: 9, hex: '#d1d5db', rgb: [209, 213, 219] },
];

export function dxfAciToHex(value: string | number | undefined): string | null {
  const code = Math.abs(Number(value));
  if (!Number.isFinite(code) || code === 0 || code === 256) return null;

  return aciPalette.find((entry) => entry.code === code)?.hex ?? '#1f2937';
}

export function hexToDxfAci(value: string): number {
  const rgb = parseHexColor(value);
  if (!rgb) return 7;

  return aciPalette.reduce(
    (nearest, entry) => {
      const distance =
        (rgb[0] - entry.rgb[0]) ** 2 +
        (rgb[1] - entry.rgb[1]) ** 2 +
        (rgb[2] - entry.rgb[2]) ** 2;
      return distance < nearest.distance ? { code: entry.code, distance } : nearest;
    },
    { code: 7, distance: Number.POSITIVE_INFINITY },
  ).code;
}

function parseHexColor(value: string): [number, number, number] | null {
  const match = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;

  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ];
}
