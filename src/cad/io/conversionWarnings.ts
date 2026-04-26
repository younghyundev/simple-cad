import type { CadConversionMode, CadDocument, CadWarning } from '../types';

export type WarningCategory = NonNullable<CadWarning['category']>;

export type ConversionWarningSummary = {
  total: number;
  approximated: number;
  unsupported: number;
  conversion: number;
  mock: number;
  mode?: CadConversionMode;
  modeLabel?: string;
  groups: ConversionWarningGroup[];
};

export type ConversionWarningGroup = {
  code: string;
  message: string;
  count: number;
  severity: NonNullable<CadWarning['severity']>;
  category: WarningCategory;
  sourceType?: string;
};

export function summarizeConversionWarnings(document: CadDocument): ConversionWarningSummary {
  const warnings = [
    ...(document.importWarnings ?? []),
    ...(document.unsupportedEntities ?? []).map<CadWarning>((entity) => ({
      code: 'UNSUPPORTED_CAD_ENTITY',
      message: `${entity.sourceType} 객체는 현재 변환되지 않았습니다.`,
      severity: 'warning',
      category: 'unsupported',
      sourceType: entity.sourceType,
    })),
  ];
  const groups = groupWarnings(warnings);
  const mode = document.conversionMode ?? document.sourceFile?.conversionMode;

  return {
    total: warnings.length,
    approximated: groups
      .filter((group) => group.category === 'approximated')
      .reduce((total, group) => total + group.count, 0),
    unsupported: groups
      .filter((group) => group.category === 'unsupported')
      .reduce((total, group) => total + group.count, 0),
    conversion: groups
      .filter((group) => group.category === 'conversion')
      .reduce((total, group) => total + group.count, 0),
    mock: groups.filter((group) => group.category === 'mock').reduce((total, group) => total + group.count, 0),
    mode,
    modeLabel: mode ? conversionModeLabel(mode) : undefined,
    groups,
  };
}

function groupWarnings(warnings: CadWarning[]): ConversionWarningGroup[] {
  const groups = new Map<string, ConversionWarningGroup>();

  for (const warning of warnings) {
    const category = warning.category ?? inferWarningCategory(warning);
    const severity = warning.severity ?? (category === 'unsupported' ? 'warning' : 'info');
    const key = `${warning.code}:${warning.message}:${category}:${warning.sourceType ?? ''}`;
    const current = groups.get(key);

    if (current) {
      current.count += 1;
      continue;
    }

    groups.set(key, {
      code: warning.code,
      message: warning.message,
      count: 1,
      severity,
      category,
      sourceType: warning.sourceType,
    });
  }

  return [...groups.values()].sort((a, b) => warningSortWeight(a) - warningSortWeight(b));
}

function warningSortWeight(warning: ConversionWarningGroup): number {
  const categoryWeight: Record<WarningCategory, number> = {
    mock: 0,
    unsupported: 1,
    approximated: 2,
    conversion: 3,
    preserved: 4,
  };
  return categoryWeight[warning.category] ?? 9;
}

function inferWarningCategory(warning: CadWarning): WarningCategory {
  if (warning.code.includes('MOCK')) return 'mock';
  if (warning.code.includes('UNSUPPORTED')) return 'unsupported';
  if (warning.code.includes('APPROXIMATED')) return 'approximated';
  return 'conversion';
}

function conversionModeLabel(mode: CadConversionMode): string {
  if (mode === 'mock') return '개발용 mock 변환';
  if (mode === 'server') return '서버 변환';
  return '클라이언트 변환';
}
