import type { CadDocument, CadFileType } from '../types';
import { ConversionApiClient } from './conversionApiClient';
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

  async open(file: File): Promise<CadDocument> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') return this.importer.fromJson(await file.text());
    if (extension === 'dxf') return this.importer.fromDxf(await file.text());
    if (extension === 'dwg') {
      const result = await this.conversionApi.importCad(file);
      if (!result.document) throw new Error('DWG 변환 결과에 도면 데이터가 없습니다.');
      return {
        ...result.document,
        importWarnings: [
          ...(result.document.importWarnings ?? []),
          ...result.warnings.map((message) => ({
            code: 'CONVERSION_API_WARNING',
            message,
          })),
        ],
      };
    }

    throw new Error(`Unsupported import file: ${file.name}`);
  }

  async save(document: CadDocument, target: SaveTarget): Promise<Blob> {
    if (target.type === 'json') return this.exporter.toJson(document);
    if (target.type === 'svg') return this.exporter.toSvg(document);
    if (target.type === 'dxf') return this.exporter.toDxf(document);

    if (target.type === 'dwg') {
      const result = await this.conversionApi.exportCad(document, 'dwg');
      if (!result.blob) throw new Error('DWG 변환 결과 파일이 없습니다.');
      return result.blob;
    }

    throw new Error(`Unsupported export type: ${target.type}`);
  }
}
