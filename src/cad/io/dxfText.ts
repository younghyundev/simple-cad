export function decodeDxfText(value: string): string {
  return value
    .replace(/\\P/g, '\n')
    .replace(/\\~/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\\[A-Za-z][^;]*;/g, '');
}

export function encodeDxfText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\\P');
}
