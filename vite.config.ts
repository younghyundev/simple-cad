import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-cad-conversion-api',
      configureServer(server) {
        server.middlewares.use('/api/cad/validate', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              supported: true,
              entityTypes: ['LINE', 'CIRCLE', 'TEXT', 'LWPOLYLINE'],
              warnings: ['개발용 mock 검증 응답입니다. 실제 DWG 호환성은 서버 변환 엔진에서 확인해야 합니다.'],
            }),
          );
        });

        server.middlewares.use('/api/cad/import', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }

          await drainRequest(req);
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              document: mockConvertedDocument(),
              warnings: ['개발용 mock DWG import입니다. 업로드 파일 내용은 아직 실제 변환하지 않습니다.'],
            }),
          );
        });

        server.middlewares.use('/api/cad/export', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }

          const body = await readRequestBody(req);
          const payload = safeJsonParse(body);
          const targetFormat = payload?.targetFormat ?? 'dwg';

          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="mock-export.${targetFormat}"`);
          res.end(`Mock ${String(targetFormat).toUpperCase()} export\n\nThis file is produced by the Vite development mock API.\nConnect a real CAD conversion engine for production DWG output.\n`);
        });
      },
    },
  ],
});

function mockConvertedDocument() {
  return {
    id: `mock-dwg-${Date.now()}`,
    name: 'Mock DWG Import',
    sourceFile: {
      name: 'mock-import.dwg',
      type: 'dwg',
      lastSavedAt: new Date().toISOString(),
      fileHandleAvailable: false,
    },
    units: 'mm',
    layers: [
      {
        id: '0',
        name: '0',
        color: '#2563eb',
        visible: true,
        locked: false,
      },
      {
        id: 'notes',
        name: 'notes',
        color: '#16a34a',
        visible: true,
        locked: false,
      },
    ],
    entities: [
      {
        id: 'mock-line-1',
        type: 'line',
        layerId: '0',
        rotation: 0,
        strokeColor: '#1f2937',
        fillColor: 'transparent',
        strokeWidth: 2,
        strokeStyle: 'solid',
        visible: true,
        locked: false,
        x1: -160,
        y1: -60,
        x2: 160,
        y2: -60,
      },
      {
        id: 'mock-circle-1',
        type: 'circle',
        layerId: '0',
        rotation: 0,
        strokeColor: '#dc2626',
        fillColor: 'rgba(220, 38, 38, 0.08)',
        strokeWidth: 2,
        strokeStyle: 'solid',
        visible: true,
        locked: false,
        cx: 80,
        cy: 40,
        radius: 46,
      },
      {
        id: 'mock-text-1',
        type: 'text',
        layerId: 'notes',
        rotation: 0,
        strokeColor: '#166534',
        fillColor: '#166534',
        strokeWidth: 1,
        strokeStyle: 'solid',
        visible: true,
        locked: false,
        x: -150,
        y: 90,
        content: 'Mock DWG conversion result',
        fontSize: 18,
      },
    ],
    unsupportedEntities: [
      {
        sourceType: 'INSERT',
        reason: 'Mock converter marks block inserts as unsupported.',
      },
    ],
    importWarnings: [
      {
        code: 'MOCK_CONVERSION',
        message: '개발용 mock 변환 결과입니다. 실제 DWG 파일 내용은 아직 반영하지 않습니다.',
      },
    ],
  };
}

function readRequestBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function drainRequest(req: import('http').IncomingMessage): Promise<void> {
  await readRequestBody(req);
}

function safeJsonParse(value: string): { targetFormat?: string } | null {
  try {
    return JSON.parse(value) as { targetFormat?: string };
  } catch {
    return null;
  }
}
