import type { CadDocument, CadFileType } from '../types';
import { ExportService } from './exportService';
import { ImportService } from './importService';

export type SaveTarget = {
  fileName: string;
  type: CadFileType;
};

export class FileManager {
  private readonly importer = new ImportService();
  private readonly exporter = new ExportService();

  async open(file: File): Promise<CadDocument> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') return this.importer.fromJson(await file.text());
    if (extension === 'dxf') return this.importer.fromDxf(await file.text());
    if (extension === 'dwg') return this.importer.fromDwg(file);

    throw new Error(`Unsupported import file: ${file.name}`);
  }

  async save(document: CadDocument, target: SaveTarget): Promise<Blob> {
    if (target.type === 'json') return this.exporter.toJson(document);
    if (target.type === 'svg') return this.exporter.toSvg(document);
    if (target.type === 'dxf') return this.exporter.toDxf(document);

    throw new Error('DWG export requires the conversion API.');
  }
}
