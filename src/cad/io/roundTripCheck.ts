// @ts-nocheck
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runDxfRoundTrip } from './dxfRoundTrip';

async function main(): Promise<void> {
  const fixturePath = resolve(process.cwd(), 'src/cad/io/fixtures/fidelity-basic.dxf');
  const fixtureText = await readFile(fixturePath, 'utf8');
  const result = await runDxfRoundTrip(fixtureText);
  const firstWarnings = result.firstImport.importWarnings ?? [];
  const approximatedWarnings = firstWarnings.filter((warning) => warning.category === 'approximated');

  if (!approximatedWarnings.length) {
    result.drift.push('warnings drift: fixture did not produce an approximated entity warning');
  }

  if (result.drift.length) {
    console.error('CAD fidelity check failed:');
    for (const drift of result.drift) console.error(`- ${drift}`);
    process.exitCode = 1;
    return;
  }

  console.log('CAD fidelity check passed');
  console.log(`entities: ${result.firstImport.entities.length} -> ${result.secondImport.entities.length}`);
  console.log(`warnings: ${firstWarnings.length} first import, ${result.secondImport.importWarnings?.length ?? 0} second import`);
  console.log(`approximated warnings: ${approximatedWarnings.length}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
