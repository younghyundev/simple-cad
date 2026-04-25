import type { CadDocument, CadFileType } from '../types';

export type ConversionResult = {
  blob?: Blob;
  document?: CadDocument;
  warnings: string[];
};

export class ConversionApiClient {
  constructor(private readonly baseUrl = '/api/cad') {}

  async importCad(_file: File): Promise<ConversionResult> {
    throw new Error(`CAD import API is not connected: ${this.baseUrl}/import`);
  }

  async exportCad(_document: CadDocument, _type: Extract<CadFileType, 'dxf' | 'dwg' | 'svg'>): Promise<ConversionResult> {
    throw new Error(`CAD export API is not connected: ${this.baseUrl}/export`);
  }
}
