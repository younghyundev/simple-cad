import { ConversionApiClient, ConversionApiError } from './conversionApiClient';
import { ImportService } from './importService';
import { runDxfRoundTrip } from './dxfRoundTrip';

async function main(): Promise<void> {
  const importer = new ImportService();
  const unsupportedDocument = await importer.fromDxf(unsupportedDxfFixture());
  const unsupportedWarnings = unsupportedDocument.importWarnings ?? [];
  assert(
    unsupportedWarnings.some((warning) => warning.category === 'unsupported'),
    'Unsupported DXF entities should produce an unsupported warning.',
  );

  const malformedDocument = await importer.fromDxf('this is not a valid dxf');
  assert(
    malformedDocument.entities.length === 0,
    'Malformed DXF text should not create accidental entities.',
  );

  const roundTrip = await runDxfRoundTrip(splineDxfFixture());
  assert(
    (roundTrip.firstImport.importWarnings ?? []).some((warning) => warning.category === 'approximated'),
    'SPLINE fixture should produce an approximated warning.',
  );

  const restoreFetch = installMockFetch();
  try {
    const client = new ConversionApiClient('/api/cad');
    const imported = await client.importCad(new File(['mock'], 'mock.dwg'));
    assert(imported.mode === 'mock', 'Mock DWG import should report mock mode.');
    assert(
      (imported.document?.importWarnings ?? []).some((warning) => warning.category === 'mock'),
      'Mock DWG import should annotate warnings as mock.',
    );

    const exported = await client.exportCad(imported.document!, 'dwg');
    assert(exported.mode === 'mock', 'Mock DWG export should report mock mode.');

    const asyncClient = new ConversionApiClient({
      baseUrl: '/api/async',
      pollIntervalMs: 1,
      jobTimeoutMs: 500,
    });
    const asyncImport = await asyncClient.importCad(new File(['mock'], 'async.dwg'));
    assert(asyncImport.document?.id === 'async-import-document', 'Async import job should resolve to a document.');

    const asyncExport = await asyncClient.exportCad(asyncImport.document!, 'dwg');
    assert((await asyncExport.blob?.text()) === 'async mock dwg bytes', 'Async export job should resolve to a blob.');

    const failingClient = new ConversionApiClient({
      baseUrl: '/api/fail',
      pollIntervalMs: 1,
      jobTimeoutMs: 500,
    });
    await assertRejects(
      () => failingClient.importCad(new File(['mock'], 'failed.dwg')),
      '변환 엔진 실패',
      'Failed conversion jobs should throw a controlled conversion error.',
      'conversion',
    );

    await assertRejects(
      () => client.validateCad(new File(['bad'], 'bad.dwg')),
      '검증 실패',
      'Conversion API failures should preserve controlled error messages.',
      'unsupported',
    );
  } finally {
    restoreFetch();
  }

  console.log('Conversion regression check passed');
  console.log(`unsupported warnings: ${unsupportedWarnings.length}`);
  console.log(`approximated warnings: ${roundTrip.firstImport.importWarnings?.length ?? 0}`);
  console.log('mock DWG import/export mode: passed');
  console.log('async job import/export: passed');
}

function installMockFetch(): () => void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/import')) {
      if (url.includes('/api/async/')) {
        return Response.json({
          jobId: 'import-1',
          status: 'queued',
          statusUrl: '/api/async/jobs/import-1',
          mode: 'mock',
        });
      }
      if (url.includes('/api/fail/')) {
        return Response.json({
          jobId: 'fail-1',
          status: 'running',
          statusUrl: '/api/fail/jobs/fail-1',
          mode: 'server',
        });
      }
      return Response.json({
        mode: 'mock',
        warnings: ['mock import warning'],
        document: {
          id: 'mock-dwg',
          name: 'Mock DWG',
          units: 'mm',
          layers: [
            {
              id: '0',
              name: '0',
              color: '#1f2937',
              visible: true,
              locked: false,
            },
          ],
          entities: [],
          importWarnings: [
            {
              code: 'MOCK_CONVERSION',
              message: 'mock conversion result',
            },
          ],
        },
      });
    }

    if (url.endsWith('/export')) {
      if (url.includes('/api/async/')) {
        return Response.json({
          jobId: 'export-1',
          status: 'running',
          statusUrl: '/api/async/jobs/export-1',
          mode: 'mock',
        });
      }
      return new Response('mock dwg bytes', {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-CAD-Conversion-Mode': 'mock',
        },
      });
    }

    if (url.endsWith('/api/async/jobs/import-1')) {
      return Response.json({
        status: 'complete',
        progress: 1,
        mode: 'mock',
        warnings: ['async import warning'],
        document: {
          id: 'async-import-document',
          name: 'Async Mock DWG',
          units: 'mm',
          layers: [
            {
              id: '0',
              name: '0',
              color: '#1f2937',
              visible: true,
              locked: false,
            },
          ],
          entities: [],
          importWarnings: [
            {
              code: 'MOCK_CONVERSION',
              message: 'async mock conversion result',
            },
          ],
        },
      });
    }

    if (url.endsWith('/api/async/jobs/export-1')) {
      return Response.json({
        status: 'complete',
        progress: 1,
        mode: 'mock',
        downloadUrl: '/api/async/download/export-1',
      });
    }

    if (url.endsWith('/api/async/download/export-1')) {
      return new Response('async mock dwg bytes', {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
    }

    if (url.endsWith('/api/fail/jobs/fail-1')) {
      return Response.json({
        status: 'failed',
        progress: 0.5,
        category: 'conversion',
        error: '변환 엔진 실패',
      });
    }

    if (url.endsWith('/validate')) {
      return Response.json({ message: '검증 실패' }, { status: 422 });
    }

    return Response.json({ message: 'not found' }, { status: 404 });
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function assertRejects(
  callback: () => Promise<unknown>,
  expectedMessage: string,
  description: string,
  expectedCategory?: string,
): Promise<void> {
  try {
    await callback();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(expectedMessage), description);
    if (expectedCategory) {
      assert(error instanceof ConversionApiError && error.category === expectedCategory, description);
    }
    return;
  }
  throw new Error(description);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function unsupportedDxfFixture(): string {
  return [
    '0',
    'SECTION',
    '2',
    'ENTITIES',
    '0',
    '3DSOLID',
    '8',
    '0',
    '0',
    'ENDSEC',
    '0',
    'EOF',
  ].join('\n');
}

function splineDxfFixture(): string {
  return [
    '0',
    'SECTION',
    '2',
    'ENTITIES',
    '0',
    'SPLINE',
    '8',
    '0',
    '70',
    '8',
    '71',
    '3',
    '72',
    '4',
    '73',
    '4',
    '10',
    '0',
    '20',
    '0',
    '10',
    '40',
    '20',
    '30',
    '10',
    '80',
    '20',
    '30',
    '10',
    '120',
    '20',
    '0',
    '0',
    'ENDSEC',
    '0',
    'EOF',
  ].join('\n');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
