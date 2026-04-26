import type { CadDocument, CadFileType } from '../types';

export type ConversionResult = {
  blob?: Blob;
  document?: CadDocument;
  warnings: string[];
};

export type CadValidationResult = {
  supported: boolean;
  entityTypes: string[];
  warnings: string[];
};

export class ConversionApiClient {
  constructor(private readonly baseUrl = '/api/cad') {}

  async importCad(file: File): Promise<ConversionResult> {
    const body = new FormData();
    body.append('file', file);

    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      body,
    });

    if (!response.ok) {
      throw new Error(await this.errorMessage(response, 'DWG/DXF 변환 API가 연결되지 않았습니다.'));
    }

    const payload = (await response.json()) as {
      document?: CadDocument;
      warnings?: string[];
    };

    if (!payload.document) {
      throw new Error('변환 API 응답에 도면 데이터가 없습니다.');
    }

    return {
      document: payload.document,
      warnings: payload.warnings ?? [],
    };
  }

  async exportCad(
    document: CadDocument,
    type: Extract<CadFileType, 'dxf' | 'dwg' | 'svg'>,
  ): Promise<ConversionResult> {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetFormat: type,
        document,
      }),
    });

    if (!response.ok) {
      throw new Error(await this.errorMessage(response, 'CAD 내보내기 변환 API가 연결되지 않았습니다.'));
    }

    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        downloadUrl?: string;
        warnings?: string[];
      };

      if (payload.downloadUrl) {
        const fileResponse = await fetch(payload.downloadUrl);
        return {
          blob: await fileResponse.blob(),
          warnings: payload.warnings ?? [],
        };
      }

      throw new Error('변환 API 응답에 다운로드 URL이 없습니다.');
    }

    return {
      blob: await response.blob(),
      warnings: [],
    };
  }

  async validateCad(file: File): Promise<CadValidationResult> {
    const body = new FormData();
    body.append('file', file);

    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      body,
    });

    if (!response.ok) {
      throw new Error(await this.errorMessage(response, 'CAD 검증 API가 연결되지 않았습니다.'));
    }

    return (await response.json()) as CadValidationResult;
  }

  private async errorMessage(response: Response, fallback: string): Promise<string> {
    try {
      const payload = (await response.json()) as { message?: string; error?: string };
      return payload.message ?? payload.error ?? `${fallback} (${response.status})`;
    } catch {
      return `${fallback} (${response.status})`;
    }
  }
}
