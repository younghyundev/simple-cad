import type { CadDocument } from '../types';

export class ExportService {
  toJson(document: CadDocument): Blob {
    return new Blob([JSON.stringify(document, null, 2)], {
      type: 'application/json',
    });
  }

  toSvg(_document: CadDocument): Blob {
    throw new Error('SVG export is not implemented yet.');
  }

  toDxf(_document: CadDocument): Blob {
    throw new Error('DXF export adapter is not implemented yet.');
  }
}
