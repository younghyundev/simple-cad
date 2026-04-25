import type { CadDocument, CadFileType } from '../types';

export type SaveTarget = {
  fileName: string;
  type: CadFileType;
};

export class FileManager {
  async open(file: File): Promise<CadDocument> {
    throw new Error(`Import is not implemented yet for ${file.name}.`);
  }

  async save(document: CadDocument, target: SaveTarget): Promise<Blob> {
    throw new Error(`Export is not implemented yet for ${document.name}.${target.type}.`);
  }
}
