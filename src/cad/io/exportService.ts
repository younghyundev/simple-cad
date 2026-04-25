import type { CadDocument, CadEntity } from '../types';
import { hexToDxfAci } from './dxfColor';
import { strokeStyleToDxfLineType, strokeWidthToDxfLineWeight } from './dxfStyle';
import { encodeDxfText } from './dxfText';

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
      ...tablesToDxf(document),
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

  if (entity.type === 'arc') {
    const start = polarPoint(entity.cx, entity.cy, entity.radius, -entity.startAngle);
    const end = polarPoint(entity.cx, entity.cy, entity.radius, -entity.endAngle);
    const largeArc = Math.abs(entity.endAngle - entity.startAngle) > 180 ? 1 : 0;
    return `<path d="M ${start.x} ${start.y} A ${entity.radius} ${entity.radius} 0 ${largeArc} 1 ${end.x} ${end.y}" ${common}/>`;
  }

  if (entity.type === 'polyline') {
    const points = entity.points.map((point) => `${point.x},${point.y}`).join(' ');
    return `<polyline points="${points}" ${common}/>`;
  }

  if (entity.type === 'text') {
    const lines = getTextLines(entity.content);
    if (lines.length === 1) {
      return `<text x="${entity.x}" y="${entity.y}" font-size="${entity.fontSize}" fill="${escapeXml(entity.fillColor)}">${escapeXml(entity.content)}</text>`;
    }

    const tspans = lines
      .map(
        (line, index) =>
          `<tspan x="${entity.x}" dy="${index === 0 ? 0 : entity.fontSize * 1.25}">${escapeXml(line)}</tspan>`,
      )
      .join('');
    return `<text x="${entity.x}" y="${entity.y}" font-size="${entity.fontSize}" fill="${escapeXml(entity.fillColor)}">${tspans}</text>`;
  }

  if (entity.type === 'dimension') {
    const geometry = getDimensionGeometry(entity);
    return `<g stroke="${escapeXml(entity.strokeColor)}" fill="${escapeXml(entity.fillColor)}" stroke-width="${entity.strokeWidth}">
    <line x1="${entity.startPoint.x}" y1="${entity.startPoint.y}" x2="${geometry.dimensionStart.x}" y2="${geometry.dimensionStart.y}"/>
    <line x1="${entity.endPoint.x}" y1="${entity.endPoint.y}" x2="${geometry.dimensionEnd.x}" y2="${geometry.dimensionEnd.y}"/>
    <line x1="${geometry.dimensionStart.x}" y1="${geometry.dimensionStart.y}" x2="${geometry.dimensionEnd.x}" y2="${geometry.dimensionEnd.y}"/>
    <text x="${geometry.mid.x}" y="${geometry.mid.y - 6}" font-size="13" text-anchor="middle">${escapeXml(entity.label)}</text>
  </g>`;
  }

  return '';
}

function entityToDxf(entity: CadEntity): string[] {
  const header = entityHeader(entity);

  if (entity.type === 'line') {
    return [
      '0',
      'LINE',
      ...header,
      '10',
      `${entity.x1}`,
      '20',
      `${-entity.y1}`,
      '11',
      `${entity.x2}`,
      '21',
      `${-entity.y2}`,
    ];
  }

  if (entity.type === 'rect') {
    const x2 = entity.x + entity.width;
    const y2 = entity.y + entity.height;
    return [
      '0',
      'LWPOLYLINE',
      ...header,
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
    return [
      '0',
      'CIRCLE',
      ...header,
      '10',
      `${entity.cx}`,
      '20',
      `${-entity.cy}`,
      '40',
      `${entity.radius}`,
    ];
  }

  if (entity.type === 'arc') {
    return [
      '0',
      'ARC',
      ...header,
      '10',
      `${entity.cx}`,
      '20',
      `${-entity.cy}`,
      '40',
      `${entity.radius}`,
      '50',
      `${entity.startAngle}`,
      '51',
      `${entity.endAngle}`,
    ];
  }

  if (entity.type === 'polyline') {
    return [
      '0',
      'LWPOLYLINE',
      ...header,
      '90',
      `${entity.points.length}`,
      '70',
      '0',
      ...entity.points.flatMap((point) => ['10', `${point.x}`, '20', `${-point.y}`]),
    ];
  }

  if (entity.type === 'text') {
    if (getTextLines(entity.content).length > 1) {
      return [
        '0',
        'MTEXT',
        ...header,
        '10',
        `${entity.x}`,
        '20',
        `${-entity.y}`,
        '40',
        `${entity.fontSize}`,
        '1',
        encodeDxfText(entity.content),
      ];
    }

    return [
      '0',
      'TEXT',
      ...header,
      '10',
      `${entity.x}`,
      '20',
      `${-entity.y}`,
      '40',
      `${entity.fontSize}`,
      '1',
      encodeDxfText(entity.content),
    ];
  }

  if (entity.type === 'dimension') {
    const geometry = getDimensionGeometry(entity);
    return [
      '0',
      'LINE',
      ...header,
      '10',
      `${entity.startPoint.x}`,
      '20',
      `${-entity.startPoint.y}`,
      '11',
      `${geometry.dimensionStart.x}`,
      '21',
      `${-geometry.dimensionStart.y}`,
      '0',
      'LINE',
      ...header,
      '10',
      `${entity.endPoint.x}`,
      '20',
      `${-entity.endPoint.y}`,
      '11',
      `${geometry.dimensionEnd.x}`,
      '21',
      `${-geometry.dimensionEnd.y}`,
      '0',
      'LINE',
      ...header,
      '10',
      `${geometry.dimensionStart.x}`,
      '20',
      `${-geometry.dimensionStart.y}`,
      '11',
      `${geometry.dimensionEnd.x}`,
      '21',
      `${-geometry.dimensionEnd.y}`,
      '0',
      'TEXT',
      ...header,
      '10',
      `${geometry.mid.x}`,
      '20',
      `${-geometry.mid.y}`,
      '40',
      '13',
      '1',
      encodeDxfText(entity.label),
    ];
  }

  return [];
}

function tablesToDxf(document: CadDocument): string[] {
  return [
    '0',
    'SECTION',
    '2',
    'TABLES',
    ...lineTypesToDxf(),
    ...layersToDxf(document),
    '0',
    'ENDSEC',
  ];
}

function lineTypesToDxf(): string[] {
  return [
    '0',
    'TABLE',
    '2',
    'LTYPE',
    '70',
    '2',
    '0',
    'LTYPE',
    '2',
    'CONTINUOUS',
    '70',
    '0',
    '3',
    'Solid line',
    '72',
    '65',
    '73',
    '0',
    '40',
    '0',
    '0',
    'LTYPE',
    '2',
    'DASHED',
    '70',
    '0',
    '3',
    'Dashed line',
    '72',
    '65',
    '73',
    '2',
    '40',
    '12',
    '49',
    '6',
    '74',
    '0',
    '49',
    '-6',
    '74',
    '0',
    '0',
    'ENDTAB',
  ];
}

function layersToDxf(document: CadDocument): string[] {
  return [
    '0',
    'TABLE',
    '2',
    'LAYER',
    '70',
    `${document.layers.length}`,
    ...document.layers.flatMap((layer) => [
      '0',
      'LAYER',
      '2',
      layer.id,
      '70',
      layer.locked ? '4' : '0',
      '62',
      `${hexToDxfAci(layer.color)}`,
      '6',
      'CONTINUOUS',
      '370',
      '50',
    ]),
    '0',
    'ENDTAB',
  ];
}

function entityHeader(entity: CadEntity): string[] {
  return [
    '8',
    entity.layerId,
    '62',
    `${hexToDxfAci(entity.strokeColor)}`,
    '6',
    strokeStyleToDxfLineType(entity.strokeStyle),
    '370',
    `${strokeWidthToDxfLineWeight(entity.strokeWidth)}`,
  ];
}

function getDimensionGeometry(entity: Extract<CadEntity, { type: 'dimension' }>) {
  const dx = entity.endPoint.x - entity.startPoint.x;
  const dy = entity.endPoint.y - entity.startPoint.y;
  const length = Math.hypot(dx, dy) || 1;
  const offset = entity.labelOffset ?? -24;
  const normal = {
    x: -dy / length,
    y: dx / length,
  };
  const dimensionStart = {
    x: entity.startPoint.x + normal.x * offset,
    y: entity.startPoint.y + normal.y * offset,
  };
  const dimensionEnd = {
    x: entity.endPoint.x + normal.x * offset,
    y: entity.endPoint.y + normal.y * offset,
  };

  return {
    dimensionStart,
    dimensionEnd,
    mid: {
      x: (dimensionStart.x + dimensionEnd.x) / 2,
      y: (dimensionStart.y + dimensionEnd.y) / 2,
    },
  };
}

function entityBoundsPoints(entity: CadEntity) {
  if (entity.type === 'dimension') {
    const geometry = getDimensionGeometry(entity);
    return [entity.startPoint, entity.endPoint, geometry.dimensionStart, geometry.dimensionEnd];
  }

  return null;
}

function getDocumentBounds(document: CadDocument) {
  const points = document.entities.flatMap((entity) => {
    if (entity.type === 'line') return [{ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }];
    if (entity.type === 'rect') return [{ x: entity.x, y: entity.y }, { x: entity.x + entity.width, y: entity.y + entity.height }];
    if (entity.type === 'circle') return [{ x: entity.cx - entity.radius, y: entity.cy - entity.radius }, { x: entity.cx + entity.radius, y: entity.cy + entity.radius }];
    if (entity.type === 'arc') return [{ x: entity.cx - entity.radius, y: entity.cy - entity.radius }, { x: entity.cx + entity.radius, y: entity.cy + entity.radius }];
    if (entity.type === 'polyline') return entity.points;
    if (entity.type === 'text') {
      const lines = getTextLines(entity.content);
      const maxLineLength = Math.max(...lines.map((line) => line.length), 1);
      return [
        { x: entity.x, y: entity.y - entity.fontSize },
        {
          x: entity.x + maxLineLength * entity.fontSize * 0.6,
          y: entity.y + entity.fontSize * (lines.length - 1) * 1.25,
        },
      ];
    }
    if (entity.type === 'dimension') return entityBoundsPoints(entity) ?? [];
    return [];
  });

  if (points.length === 0) return { minX: -200, minY: -150, maxX: 200, maxY: 150 };

  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTextLines(value: string): string[] {
  return value.split(/\r\n|\r|\n/);
}
