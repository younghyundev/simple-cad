import { getSelectionBounds } from '../entityTransform';
import { ExportService } from '../io/exportService';
import { summarizeConversionWarnings } from '../io/conversionWarnings';
import { createLargeDocument } from './largeDocumentFixture';

type Measurement = {
  name: string;
  ms: number;
  thresholdMs: number;
};

const entityCount = 5000;
const thresholds = {
  generate: 250,
  bounds: 250,
  dxfExport: 2500,
  warningSummary: 100,
};

async function main(): Promise<void> {
  const measurements: Measurement[] = [];

  const generated = measure('generate large document', thresholds.generate, () =>
    createLargeDocument({ entityCount }),
  );
  measurements.push(generated.measurement);
  const document = generated.value;

  measurements.push(
    measure('selection bounds traversal', thresholds.bounds, () => {
      const bounds = getSelectionBounds(document.entities);
      if (!bounds) throw new Error('Expected large document bounds.');
      return bounds;
    }).measurement,
  );

  const exporter = new ExportService();
  measurements.push(
    (
      await measureAsync('DXF export', thresholds.dxfExport, async () => {
        const blob = exporter.toDxf(document);
        const text = await blob.text();
        if (!text.includes('ENTITIES')) throw new Error('DXF export did not include ENTITIES section.');
      })
    ).measurement,
  );

  measurements.push(
    measure('warning summary', thresholds.warningSummary, () => {
      const summary = summarizeConversionWarnings({
        ...document,
        importWarnings: [
          {
            code: 'PERF_WARNING',
            message: 'performance baseline warning',
            category: 'conversion',
          },
        ],
      });
      if (summary.total !== 1) throw new Error('Warning summary did not count the fixture warning.');
    }).measurement,
  );

  const failures = measurements.filter((item) => item.ms > item.thresholdMs);
  console.log('Performance baseline complete');
  console.log(`entities: ${document.entities.length}`);
  for (const item of measurements) {
    console.log(`${item.name}: ${item.ms.toFixed(1)}ms / ${item.thresholdMs}ms`);
  }

  if (failures.length) {
    console.error('Performance baseline failed:');
    for (const item of failures) {
      console.error(`- ${item.name}: ${item.ms.toFixed(1)}ms > ${item.thresholdMs}ms`);
    }
    process.exitCode = 1;
  }
}

function measure<T>(name: string, thresholdMs: number, callback: () => T): { measurement: Measurement; value: T } {
  const start = Date.now();
  const value = callback();
  return {
    value,
    measurement: {
      name,
      ms: Date.now() - start,
      thresholdMs,
    },
  };
}

async function measureAsync<T>(
  name: string,
  thresholdMs: number,
  callback: () => Promise<T>,
): Promise<{ measurement: Measurement; value: T }> {
  const start = Date.now();
  const value = await callback();
  return {
    value,
    measurement: {
      name,
      ms: Date.now() - start,
      thresholdMs,
    },
  };
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
