import type { CadDocument } from '../types';

export class ImportService {
  async fromJson(text: string): Promise<CadDocument> {
    return JSON.parse(text) as CadDocument;
  }

  async fromDxf(_text: string): Promise<CadDocument> {
    throw new Error('DXF import adapter is not implemented yet.');
  }

  async fromDwg(_file: File): Promise<CadDocument> {
    throw new Error('DWG import requires the conversion API.');
  }
}
