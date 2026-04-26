import type { CadDocument, CadFileType } from '../types';
import { ConversionApiClient, type ConversionRequestOptions } from './conversionApiClient';
import { ExportService } from './exportService';
import { ImportService } from './importService';

export type SaveTarget = {
  fileName: string;
  type: CadFileType;
};

export class FileManager {
  private readonly importer = new ImportService();
  private readonly exporter = new ExportService();
  private readonly conversionApi = new ConversionApiClient();

  async open(file: File, options: ConversionRequestOptions = {}): Promise<CadDocument> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') return this.importer.fromJson(await file.text());
    if (extension === 'dxf') return this.importer.fromDxf(await file.text());
    if (extension === 'dwg') {
      const result = await this.conversionApi.importCad(file, options);
      if (!result.document) throw new Error('DWG 변환 결과에 도면 데이터가 없습니다.');
      return {
        ...result.document,
        importWarnings: [
          ...(result.document.importWarnings ?? []),
          ...result.warnings.map((message) => ({
            code: 'CONVERSION_API_WARNING',
            message,
            severity: 'warning' as const,
            category: result.mode === 'mock' ? ('mock' as const) : ('conversion' as const),
            sourceType: 'DWG',
          })),
        ],
        conversionMode: result.mode,
        sourceFile: {
          ...result.document.sourceFile,
          name: result.document.sourceFile?.name ?? file.name,
          type: 'dwg',
          conversionMode: result.mode,
        },
      };
    }

    throw new Error(`Unsupported import file: ${file.name}`);
  }

  async save(document: CadDocument, target: SaveTarget, options: ConversionRequestOptions = {}): Promise<Blob> {
    if (target.type === 'json') return this.exporter.toJson(document);
    if (target.type === 'svg') return this.exporter.toSvg(document);
    if (target.type === 'dxf') return this.exporter.toDxf(document);

    if (target.type === 'dwg') {
      const result = await this.conversionApi.exportCad(document, 'dwg', options);
      if (!result.blob) throw new Error('DWG 변환 결과 파일이 없습니다.');
      return result.blob;
    }

    throw new Error(`Unsupported export type: ${target.type}`);
  }
}
