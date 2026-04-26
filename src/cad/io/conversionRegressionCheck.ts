import { ConversionApiClient, ConversionApiError } from './conversionApiClient';
import { ExportService } from './exportService';
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

  const layerStyleDocument = await importer.fromDxf(layerStyleDxfFixture());
  const hiddenLayer = layerStyleDocument.layers.find((layer) => layer.id === 'hidden_dash');
  assert(hiddenLayer?.visible === false, 'Negative DXF layer color should import as hidden layer.');
  assert(hiddenLayer?.locked === true, 'DXF layer lock flag should be preserved.');
  assert(hiddenLayer?.lineType === 'DASHED', 'DXF layer linetype should be preserved.');
  assert(hiddenLayer?.lineWeight === 211, 'DXF layer lineweight should be preserved.');
  const exportedLayerStyle = await new ExportService().toDxf(layerStyleDocument).text();
  assert(exportedLayerStyle.includes('hidden_dash'), 'DXF export should include imported layer name.');
  assert(exportedLayerStyle.includes('-3'), 'DXF export should preserve hidden layer color sign.');
  assert(exportedLayerStyle.includes('DASHED'), 'DXF export should include imported layer linetype.');
  assert(exportedLayerStyle.includes('211'), 'DXF export should include imported layer lineweight.');

  const annotationDocument = await importer.fromDxf(annotationBlockDxfFixture());
  const rotatedText = annotationDocument.entities.find(
    (entity) => entity.type === 'text' && entity.content.includes('Rotated'),
  );
  assert(rotatedText?.type === 'text' && rotatedText.rotation === 30, 'TEXT rotation should be preserved.');
  assert(rotatedText?.type === 'text' && rotatedText.textAlign === 'center', 'TEXT alignment should be preserved.');
  assert(
    (annotationDocument.importWarnings ?? []).some((warning) =>
      warning.code === 'DXF_TEXT_PRESERVED' && warning.details?.rotation === 30,
    ),
    'TEXT preserved warning should include rotation detail.',
  );
  assert(
    (annotationDocument.importWarnings ?? []).some((warning) =>
      warning.code === 'DXF_DIMENSION_IMPORTED' && warning.details?.measuredValue,
    ),
    'DIMENSION warning should include measured value detail.',
  );
  assert(
    (annotationDocument.importWarnings ?? []).some((warning) =>
      warning.code === 'DXF_INSERT_EXPLODED' && warning.details?.scaleX === 2 && warning.details?.rotationDegrees === 45,
    ),
    'INSERT warning should include transform details.',
  );

  const roundTrip = await runDxfRoundTrip(splineDxfFixture());
  assert(
    (roundTrip.firstImport.importWarnings ?? []).some((warning) => warning.code === 'DXF_SPLINE_PRESERVED'),
    'SPLINE fixture should produce a preserved warning.',
  );

  const malformedAdvancedDocument = await importer.fromDxf(malformedAdvancedDxfFixture());
  assert(
    (malformedAdvancedDocument.importWarnings ?? []).some((warning) => warning.code === 'DXF_HATCH_UNSUPPORTED'),
    'Malformed HATCH should produce DXF_HATCH_UNSUPPORTED.',
  );
  assert(
    (malformedAdvancedDocument.unsupportedEntities ?? []).some((entity) =>
      entity.reason.includes('INSERT nesting depth exceeded 8'),
    ),
    'Nested INSERT depth overflow should be reported.',
  );
  assert(
    (malformedAdvancedDocument.unsupportedEntities ?? []).some((entity) => entity.sourceType === 'SPLINE'),
    'Malformed SPLINE should be reported as unsupported.',
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
  console.log(`preserved spline warnings: ${roundTrip.firstImport.importWarnings?.length ?? 0}`);
  console.log('mock DWG import/export mode: passed');
  console.log('async job import/export: passed');
}

function annotationBlockDxfFixture(): string {
  return [
    '0', 'SECTION',
    '2', 'BLOCKS',
    '0', 'BLOCK',
    '2', 'NOTE_BLOCK',
    '10', '0',
    '20', '0',
    '0', 'TEXT',
    '8', '0',
    '10', '0',
    '20', '0',
    '40', '10',
    '50', '15',
    '72', '2',
    '1', 'Block Text',
    '0', 'ATTDEF',
    '8', '0',
    '10', '10',
    '20', '0',
    '40', '8',
    '2', 'TAG',
    '3', 'Prompt',
    '1', 'Value',
    '0', 'ENDBLK',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
    '0', 'TEXT',
    '8', '0',
    '10', '0',
    '20', '0',
    '40', '12',
    '50', '30',
    '72', '1',
    '1', 'Rotated',
    '0', 'MTEXT',
    '8', '0',
    '10', '0',
    '20', '20',
    '40', '10',
    '50', '10',
    '71', '3',
    '1', 'A\\PNote',
    '0', 'DIMENSION',
    '8', '0',
    '13', '0',
    '23', '0',
    '14', '30',
    '24', '0',
    '1', '30',
    '70', '0',
    '0', 'INSERT',
    '8', '0',
    '2', 'NOTE_BLOCK',
    '10', '100',
    '20', '100',
    '41', '2',
    '42', '2',
    '50', '45',
    '0', 'ENDSEC',
    '0', 'EOF',
  ].join('\n');
}

function layerStyleDxfFixture(): string {
  return [
    '0',
    'SECTION',
    '2',
    'TABLES',
    '0',
    'TABLE',
    '2',
    'LAYER',
    '70',
    '1',
    '0',
    'LAYER',
    '2',
    'hidden_dash',
    '70',
    '4',
    '62',
    '-3',
    '6',
    'DASHED',
    '370',
    '211',
    '0',
    'ENDTAB',
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
    '0',
    'LINE',
    '8',
    'hidden_dash',
    '10',
    '0',
    '20',
    '0',
    '11',
    '100',
    '21',
    '0',
    '0',
    'ENDSEC',
    '0',
    'EOF',
  ].join('\n');
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

function malformedAdvancedDxfFixture(): string {
  const blockDefinitions = Array.from({ length: 10 }, (_, index) => {
    const next = index === 9 ? 'B9' : `B${index + 1}`;
    return [
      '0',
      'BLOCK',
      '2',
      `B${index}`,
      '10',
      '0',
      '20',
      '0',
      '0',
      'INSERT',
      '2',
      next,
      '10',
      '0',
      '20',
      '0',
      '0',
      'ENDBLK',
    ].join('\n');
  }).join('\n');

  return [
    '0',
    'SECTION',
    '2',
    'BLOCKS',
    blockDefinitions,
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
    '0',
    'HATCH',
    '8',
    '0',
    '2',
    'SOLID',
    '70',
    '1',
    '91',
    '1',
    '92',
    '2',
    '93',
    '0',
    '0',
    'SPLINE',
    '8',
    '0',
    '71',
    '3',
    '10',
    '1',
    '20',
    '1',
    '0',
    'INSERT',
    '8',
    '0',
    '2',
    'B0',
    '10',
    '0',
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
