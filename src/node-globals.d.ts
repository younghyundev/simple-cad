declare module 'node:fs/promises' {
  export function readFile(path: string | URL, encoding: BufferEncoding): Promise<string>;
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

type BufferEncoding = 'utf8';

declare const process: {
  argv: string[];
  cwd(): string;
  exitCode?: number;
};
