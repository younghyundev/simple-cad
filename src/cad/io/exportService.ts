import type { CadDocument, CadEntity } from '../types';

export class ExportService {
  toJson(document: CadDocument): Blob {
    return new Blob([JSON.stringify(document, null, 2)], {
      type: 'application/json',
    });
  }

  toSvg(document: CadDocument): Blob {
    const bounds = getDocumentBounds(document);
    const padding = 40;
    const minX = bounds.minX - padding;
    const minY = bounds.minY - padding;
    const width = Math.max(400, bounds.maxX - bounds.minX + padding * 2);
    const height = Math.max(300, bounds.maxY - bounds.minY + padding * 2);

    const body = document.entities
      .filter((entity) => entity.visible)
      .map((entity) => entityToSvg(entity))
      .filter(Boolean)
      .join('\n  ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/>
  ${body}
</svg>`;

    return new Blob([svg], { type: 'image/svg+xml' });
  }

  toDxf(document: CadDocument): Blob {
    const lines = [
      '0',
      'SECTION',
      '2',
      'HEADER',
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'ENTITIES',
    ];

    for (const entity of document.entities) {
      if (!entity.visible) continue;
      lines.push(...entityToDxf(entity));
    }

    lines.push('0', 'ENDSEC', '0', 'EOF');
    return new Blob([lines.join('\n')], { type: 'application/dxf' });
  }
}

function entityToSvg(entity: CadEntity): string {
  const strokeDasharray = entity.strokeStyle === 'dashed' ? '8 6' : undefined;
  const common = `stroke="${escapeXml(entity.strokeColor)}" stroke-width="${entity.strokeWidth}" fill="${escapeXml(entity.fillColor)}"${strokeDasharray ? ` stroke-dasharray="${strokeDasharray}"` : ''}`;

  if (entity.type === 'line') {
    return `<line x1="${entity.x1}" y1="${entity.y1}" x2="${entity.x2}" y2="${entity.y2}" ${common}/>`;
  }

  if (entity.type === 'rect') {
    return `<rect x="${entity.x}" y="${entity.y}" width="${entity.width}" height="${entity.height}" ${common}/>`;
  }

  if (entity.type === 'circle') {
    return `<circle cx="${entity.cx}" cy="${entity.cy}" r="${entity.radius}" ${common}/>`;
  }

  if (entity.type === 'polyline') {
    const points = entity.points.map((point) => `${point.x},${point.y}`).join(' ');
    return `<polyline points="${points}" ${common}/>`;
  }

  if (entity.type === 'text') {
    return `<text x="${entity.x}" y="${entity.y}" font-size="${entity.fontSize}" fill="${escapeXml(entity.fillColor)}">${escapeXml(entity.content)}</text>`;
  }

  return '';
}

function entityToDxf(entity: CadEntity): string[] {
  const layer = entity.layerId;

  if (entity.type === 'line') {
    return ['0', 'LINE', '8', layer, '10', `${entity.x1}`, '20', `${-entity.y1}`, '11', `${entity.x2}`, '21', `${-entity.y2}`];
  }

  if (entity.type === 'rect') {
    const x2 = entity.x + entity.width;
    const y2 = entity.y + entity.height;
    return [
      '0',
      'LWPOLYLINE',
      '8',
      layer,
      '90',
      '4',
      '70',
      '1',
      '10',
      `${entity.x}`,
      '20',
      `${-entity.y}`,
      '10',
      `${x2}`,
      '20',
      `${-entity.y}`,
      '10',
      `${x2}`,
      '20',
      `${-y2}`,
      '10',
      `${entity.x}`,
      '20',
      `${-y2}`,
    ];
  }

  if (entity.type === 'circle') {
    return ['0', 'CIRCLE', '8', layer, '10', `${entity.cx}`, '20', `${-entity.cy}`, '40', `${entity.radius}`];
  }

  if (entity.type === 'polyline') {
    return [
      '0',
      'LWPOLYLINE',
      '8',
      layer,
      '90',
      `${entity.points.length}`,
      '70',
      '0',
      ...entity.points.flatMap((point) => ['10', `${point.x}`, '20', `${-point.y}`]),
    ];
  }

  if (entity.type === 'text') {
    return [
      '0',
      'TEXT',
      '8',
      layer,
      '10',
      `${entity.x}`,
      '20',
      `${-entity.y}`,
      '40',
      `${entity.fontSize}`,
      '1',
      entity.content,
    ];
  }

  return [];
}

function getDocumentBounds(document: CadDocument) {
  const points = document.entities.flatMap((entity) => {
    if (entity.type === 'line') return [{ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }];
    if (entity.type === 'rect') return [{ x: entity.x, y: entity.y }, { x: entity.x + entity.width, y: entity.y + entity.height }];
    if (entity.type === 'circle') return [{ x: entity.cx - entity.radius, y: entity.cy - entity.radius }, { x: entity.cx + entity.radius, y: entity.cy + entity.radius }];
    if (entity.type === 'polyline') return entity.points;
    if (entity.type === 'text') return [{ x: entity.x, y: entity.y }, { x: entity.x + entity.content.length * entity.fontSize * 0.6, y: entity.y - entity.fontSize }];
    return [entity.startPoint, entity.endPoint];
  });

  if (points.length === 0) return { minX: -200, minY: -150, maxX: 200, maxY: 150 };

  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
