import type { CadConversionMode, CadDocument, CadFileType } from '../types';

export type ConversionErrorCategory =
  | 'network'
  | 'server'
  | 'unsupported'
  | 'conversion'
  | 'timeout'
  | 'invalid-response';

export type ConversionJobStatus = 'queued' | 'running' | 'complete' | 'failed';

export type ConversionProgress = {
  operation: 'import' | 'export' | 'validate';
  status: 'requesting' | ConversionJobStatus;
  progress?: number;
  mode?: CadConversionMode;
  message?: string;
};

export type ConversionResult = {
  blob?: Blob;
  document?: CadDocument;
  warnings: string[];
  mode: CadConversionMode;
};

export type CadValidationResult = {
  supported: boolean;
  entityTypes: string[];
  warnings: string[];
  mode?: CadConversionMode;
};

export type ConversionApiConfig = {
  baseUrl?: string;
  requestTimeoutMs?: number;
  pollIntervalMs?: number;
  jobTimeoutMs?: number;
};

export type ConversionRequestOptions = {
  onProgress?: (progress: ConversionProgress) => void;
};

type ConversionJobResponse = {
  jobId?: string;
  statusUrl?: string;
  status?: ConversionJobStatus;
  progress?: number;
  mode?: CadConversionMode;
  warnings?: string[];
  message?: string;
};

type ImportPayload = ConversionJobResponse & {
  document?: CadDocument;
};

type ExportPayload = ConversionJobResponse & {
  downloadUrl?: string;
};

type JobStatusPayload = ConversionJobResponse & {
  document?: CadDocument;
  downloadUrl?: string;
  error?: string;
  category?: ConversionErrorCategory;
};

export class ConversionApiError extends Error {
  constructor(
    message: string,
    readonly category: ConversionErrorCategory,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ConversionApiError';
  }
}

export class ConversionApiClient {
  private readonly baseUrl: string;
  private readonly requestTimeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly jobTimeoutMs: number;

  constructor(config: string | ConversionApiConfig = {}) {
    const resolvedConfig = typeof config === 'string' ? { baseUrl: config } : config;
    this.baseUrl = trimTrailingSlash(resolvedConfig.baseUrl ?? defaultConversionBaseUrl());
    this.requestTimeoutMs = resolvedConfig.requestTimeoutMs ?? numberFromEnv('VITE_CAD_CONVERSION_TIMEOUT_MS', 60_000);
    this.pollIntervalMs = resolvedConfig.pollIntervalMs ?? numberFromEnv('VITE_CAD_CONVERSION_POLL_MS', 1_000);
    this.jobTimeoutMs = resolvedConfig.jobTimeoutMs ?? numberFromEnv('VITE_CAD_CONVERSION_JOB_TIMEOUT_MS', 180_000);
  }

  async importCad(file: File, options: ConversionRequestOptions = {}): Promise<ConversionResult> {
    options.onProgress?.({ operation: 'import', status: 'requesting', message: 'DWG 변환 요청 중...' });

    const body = new FormData();
    body.append('file', file);

    const response = await this.fetchWithTimeout(`${this.baseUrl}/import`, {
      method: 'POST',
      body,
    });

    if (!response.ok) {
      throw await this.responseError(response, 'DWG/DXF 변환 API가 연결되지 않았습니다.');
    }

    const payload = await readJson<ImportPayload>(response, '변환 API 응답을 읽을 수 없습니다.');
    if (isJobPayload(payload)) {
      return this.waitForJob(payload, 'import', options);
    }

    if (!payload.document) {
      throw new ConversionApiError('변환 API 응답에 도면 데이터가 없습니다.', 'invalid-response');
    }

    const mode = payload.mode ?? 'server';
    return {
      document: annotateDocumentMode(payload.document, mode),
      warnings: payload.warnings ?? [],
      mode,
    };
  }

  async exportCad(
    document: CadDocument,
    type: Extract<CadFileType, 'dxf' | 'dwg' | 'svg'>,
    options: ConversionRequestOptions = {},
  ): Promise<ConversionResult> {
    options.onProgress?.({ operation: 'export', status: 'requesting', message: 'DWG 내보내기 변환 요청 중...' });

    const response = await this.fetchWithTimeout(`${this.baseUrl}/export`, {
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
      throw await this.responseError(response, 'CAD 내보내기 변환 API가 연결되지 않았습니다.');
    }

    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = await readJson<ExportPayload>(response, '변환 API 응답을 읽을 수 없습니다.');
      if (isJobPayload(payload)) {
        return this.waitForJob(payload, 'export', options);
      }

      if (payload.downloadUrl) {
        const blob = await this.downloadResultBlob(payload.downloadUrl);
        return {
          blob,
          warnings: payload.warnings ?? [],
          mode: payload.mode ?? 'server',
        };
      }

      throw new ConversionApiError('변환 API 응답에 다운로드 URL이 없습니다.', 'invalid-response');
    }

    return {
      blob: await response.blob(),
      warnings: [],
      mode: response.headers.get('X-CAD-Conversion-Mode') === 'mock' ? 'mock' : 'server',
    };
  }

  async validateCad(file: File, options: ConversionRequestOptions = {}): Promise<CadValidationResult> {
    options.onProgress?.({ operation: 'validate', status: 'requesting', message: 'CAD 파일 검증 중...' });

    const body = new FormData();
    body.append('file', file);

    const response = await this.fetchWithTimeout(`${this.baseUrl}/validate`, {
      method: 'POST',
      body,
    });

    if (!response.ok) {
      throw await this.responseError(response, 'CAD 검증 API가 연결되지 않았습니다.');
    }

    return readJson<CadValidationResult>(response, 'CAD 검증 응답을 읽을 수 없습니다.');
  }

  private async waitForJob(
    initial: ConversionJobResponse,
    operation: 'import' | 'export',
    options: ConversionRequestOptions,
  ): Promise<ConversionResult> {
    const statusUrl = initial.statusUrl ?? (initial.jobId ? `${this.baseUrl}/jobs/${initial.jobId}` : null);
    if (!statusUrl) {
      throw new ConversionApiError('변환 job 상태 URL이 없습니다.', 'invalid-response');
    }

    const startedAt = Date.now();
    let current: JobStatusPayload = {
      ...initial,
      status: initial.status ?? 'queued',
    };

    while (current.status === 'queued' || current.status === 'running') {
      options.onProgress?.({
        operation,
        status: current.status,
        progress: current.progress,
        mode: current.mode,
        message: conversionProgressMessage(operation, current),
      });

      if (Date.now() - startedAt > this.jobTimeoutMs) {
        throw new ConversionApiError('DWG 변환 시간이 초과되었습니다.', 'timeout');
      }

      await sleep(this.pollIntervalMs);
      const response = await this.fetchWithTimeout(resolveStatusUrl(statusUrl, this.baseUrl), {
        method: 'GET',
      });

      if (!response.ok) {
        throw await this.responseError(response, 'DWG 변환 job 상태를 확인할 수 없습니다.');
      }

      current = await readJson<JobStatusPayload>(response, 'DWG 변환 job 응답을 읽을 수 없습니다.');
      if (!current.status) {
        throw new ConversionApiError('DWG 변환 job 응답에 상태가 없습니다.', 'invalid-response');
      }
    }

    if (current.status === 'failed') {
      throw new ConversionApiError(
        current.error ?? 'DWG 변환 job이 실패했습니다.',
        current.category ?? 'conversion',
      );
    }

    options.onProgress?.({
      operation,
      status: 'complete',
      progress: 1,
      mode: current.mode,
      message: operation === 'import' ? 'DWG 변환 완료' : 'DWG 내보내기 변환 완료',
    });

    if (operation === 'import') {
      if (!current.document) {
        throw new ConversionApiError('완료된 변환 job에 도면 데이터가 없습니다.', 'invalid-response');
      }
      const mode = current.mode ?? initial.mode ?? 'server';
      return {
        document: annotateDocumentMode(current.document, mode),
        warnings: [...(initial.warnings ?? []), ...(current.warnings ?? [])],
        mode,
      };
    }

    if (!current.downloadUrl) {
      throw new ConversionApiError('완료된 변환 job에 다운로드 URL이 없습니다.', 'invalid-response');
    }

    return {
      blob: await this.downloadResultBlob(current.downloadUrl),
      warnings: [...(initial.warnings ?? []), ...(current.warnings ?? [])],
      mode: current.mode ?? initial.mode ?? 'server',
    };
  }

  private async downloadResultBlob(downloadUrl: string): Promise<Blob> {
    const response = await this.fetchWithTimeout(resolveStatusUrl(downloadUrl, this.baseUrl), {
      method: 'GET',
    });

    if (!response.ok) {
      throw await this.responseError(response, '변환 결과 파일을 다운로드할 수 없습니다.');
    }

    return response.blob();
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ConversionApiError('DWG 변환 요청 시간이 초과되었습니다.', 'timeout');
      }
      throw new ConversionApiError('DWG 변환 서버에 연결할 수 없습니다.', 'network');
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }

  private async responseError(response: Response, fallback: string): Promise<ConversionApiError> {
    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        category?: ConversionErrorCategory;
      };
      return new ConversionApiError(
        payload.message ?? payload.error ?? `${fallback} (${response.status})`,
        payload.category ?? categoryForStatus(response.status),
        response.status,
      );
    } catch {
      return new ConversionApiError(`${fallback} (${response.status})`, categoryForStatus(response.status), response.status);
    }
  }
}

function annotateDocumentMode(document: CadDocument, mode: CadConversionMode): CadDocument {
  return {
    ...document,
    conversionMode: mode,
    sourceFile: document.sourceFile
      ? {
          ...document.sourceFile,
          conversionMode: mode,
        }
      : document.sourceFile,
    importWarnings: (document.importWarnings ?? []).map((warning) =>
      warning.code.includes('MOCK')
        ? {
            ...warning,
            severity: warning.severity ?? 'info',
            category: warning.category ?? 'mock',
            sourceType: warning.sourceType ?? 'DWG',
          }
        : {
            ...warning,
            severity: warning.severity ?? 'warning',
            category: warning.category ?? 'conversion',
          },
    ),
  };
}

async function readJson<T>(response: Response, message: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ConversionApiError(message, 'invalid-response', response.status);
  }
}

function isJobPayload(payload: ConversionJobResponse): boolean {
  return Boolean(payload.jobId || payload.statusUrl || payload.status === 'queued' || payload.status === 'running');
}

function categoryForStatus(status: number): ConversionErrorCategory {
  if (status === 408 || status === 504) return 'timeout';
  if (status === 400 || status === 415 || status === 422) return 'unsupported';
  if (status >= 500) return 'server';
  return 'conversion';
}

function conversionProgressMessage(operation: 'import' | 'export', payload: ConversionJobResponse): string {
  const percent = typeof payload.progress === 'number' ? ` ${Math.round(payload.progress * 100)}%` : '';
  const label = operation === 'import' ? 'DWG 변환' : 'DWG 내보내기 변환';
  return `${label} ${payload.status === 'queued' ? '대기 중' : '진행 중'}${percent}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function resolveStatusUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return url;
  return `${baseUrl}/${url}`;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function defaultConversionBaseUrl(): string {
  return import.meta.env.VITE_CAD_CONVERSION_API_BASE_URL ?? '/api/cad';
}

function numberFromEnv(key: string, fallback: number): number {
  const raw = import.meta.env[key];
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
