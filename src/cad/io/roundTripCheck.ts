import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runDxfRoundTrip } from './dxfRoundTrip';

async function main(): Promise<void> {
  const basic = await checkFixture('fidelity-basic.dxf');
  const advanced = await checkFixture('fidelity-advanced-entities.dxf');
  const drift = [...basic.result.drift, ...advanced.result.drift];

  const basicApproximatedWarnings = basic.firstWarnings.filter((warning) => warning.category === 'approximated');
  if (!basicApproximatedWarnings.length) {
    drift.push('warnings drift: basic fixture did not produce an approximated entity warning');
  }

  const advancedTypes = advanced.result.firstSummary.entityCounts;
  if (advancedTypes.ellipse < 1) drift.push('advanced fixture: missing native ellipse');
  if (advancedTypes.spline < 1) drift.push('advanced fixture: missing native spline');
  if (advancedTypes.hatch < 1) drift.push('advanced fixture: missing hatch');
  if (advanced.result.firstSummary.metadata.insUnits !== '4') drift.push('advanced fixture: metadata insUnits was not preserved');
  if (advanced.result.firstSummary.metadata.measurement !== 'metric') drift.push('advanced fixture: metadata measurement was not preserved');

  const advancedCategories = advanced.result.firstSummary.warningCategories;
  if (!advancedCategories.preserved) drift.push('advanced fixture: missing preserved warning category');
  if (!advancedCategories.approximated) drift.push('advanced fixture: missing approximated warning category');

  const advancedCodes = advanced.result.firstSummary.warningCodes;
  if (!advancedCodes.DXF_HATCH_PRESERVED && !advancedCodes.DXF_HATCH_UNSUPPORTED) {
    drift.push('advanced fixture: hatch was neither preserved nor explicitly unsupported');
  }

  if (drift.length) {
    console.error('CAD fidelity check failed:');
    for (const item of drift) console.error(`- ${item}`);
    process.exitCode = 1;
    return;
  }

  console.log('CAD fidelity check passed');
  console.log(`basic entities: ${basic.result.firstImport.entities.length} -> ${basic.result.secondImport.entities.length}`);
  console.log(`advanced entities: ${advanced.result.firstImport.entities.length} -> ${advanced.result.secondImport.entities.length}`);
  console.log(`basic warnings: ${basic.firstWarnings.length} first import, ${basic.result.secondImport.importWarnings?.length ?? 0} second import`);
  console.log(`advanced warnings: ${advanced.firstWarnings.length} first import, ${advanced.result.secondImport.importWarnings?.length ?? 0} second import`);
  console.log(`approximated warnings: ${basicApproximatedWarnings.length + (advancedCategories.approximated ?? 0)}`);
}

async function checkFixture(name: string) {
  const fixturePath = resolve(process.cwd(), `src/cad/io/fixtures/${name}`);
  const fixtureText = await readFile(fixturePath, 'utf8');
  const result = await runDxfRoundTrip(fixtureText);
  return {
    result,
    firstWarnings: result.firstImport.importWarnings ?? [],
  };
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
