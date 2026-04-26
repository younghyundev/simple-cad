import type { CadFileType } from '../types';

export type SimpleFileHandle = {
  name: string;
  createWritable: () => Promise<{
    write: (blob: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type SavePickerOptions = {
  suggestedName: string;
  type: CadFileType;
};

type WindowWithFileSystemAccess = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SimpleFileHandle>;
};

export function canUseFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && typeof getWindow().showSaveFilePicker === 'function';
}

export async function pickSaveFile(options: SavePickerOptions): Promise<SimpleFileHandle | null> {
  const picker = getWindow().showSaveFilePicker;
  if (!picker) return null;

  return picker({
    suggestedName: withExtension(options.suggestedName, options.type),
    types: [
      {
        description: `${options.type.toUpperCase()} file`,
        accept: {
          [mimeTypeFor(options.type)]: [`.${options.type}`],
        },
      },
    ],
  });
}

export async function writeBlobToFileHandle(blob: Blob, handle: SimpleFileHandle): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function getWindow(): WindowWithFileSystemAccess {
  return window as WindowWithFileSystemAccess;
}

function withExtension(fileName: string, type: CadFileType): string {
  const cleanName = fileName.trim() || `drawing.${type}`;
  return cleanName.toLowerCase().endsWith(`.${type}`) ? cleanName : `${cleanName}.${type}`;
}

function mimeTypeFor(type: CadFileType): string {
  if (type === 'json') return 'application/json';
  if (type === 'svg') return 'image/svg+xml';
  if (type === 'dxf') return 'application/dxf';
  return 'application/octet-stream';
}
