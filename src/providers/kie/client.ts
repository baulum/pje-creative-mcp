import { McpError, mapKieCode, toMcpError } from '../../utils/errors.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('KIE');

/** Envelope shared by every KIE JSON endpoint. */
export interface KieEnvelope<T> {
  code: number;
  msg: string;
  data: T;
  success?: boolean;
}

export interface KieClientOptions {
  apiKey: string;
  baseUrl: string;
  uploadBaseUrl: string;
  requestTimeoutMs: number;
  /** Injection point for tests. */
  fetchImpl?: typeof fetch;
}

/**
 * Thin HTTP layer over the KIE.ai REST API.
 *
 * Base URL: https://api.kie.ai
 * Auth: `Authorization: Bearer <KIE_API_KEY>` on every request.
 * File uploads live on a separate host (https://kieai.redpandaai.co).
 * @see https://docs.kie.ai/common-api/quickstart
 */
export class KieClient {
  private readonly apiKey: string;
  readonly baseUrl: string;
  readonly uploadBaseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: KieClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.uploadBaseUrl = options.uploadBaseUrl;
    this.timeoutMs = options.requestTimeoutMs;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private async request<T>(
    url: string,
    init: RequestInit & { expectEnvelope?: boolean } = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        ...init,
        signal: init.signal ?? controller.signal,
        headers: { ...this.authHeaders(), ...(init.headers as Record<string, string>) },
      });
    } catch (err) {
      throw toMcpError(err);
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw new McpError(
        'PROVIDER_ERROR',
        `KIE returned a non-JSON response (HTTP ${response.status}).`,
        { details: { status: response.status, body: text.slice(0, 500) } },
      );
    }

    const envelope = body as KieEnvelope<T>;
    const code = typeof envelope?.code === 'number' ? envelope.code : response.status;
    if (code !== 200) {
      throw mapKieCode(code, envelope?.msg ?? response.statusText ?? 'unknown error');
    }
    return envelope.data as T;
  }

  /** POST /api/v1/jobs/createTask */
  async createTask(payload: {
    model: string;
    input: Record<string, unknown>;
    callBackUrl?: string;
  }): Promise<{ taskId: string }> {
    log.info(`Creating task for model ${payload.model}`);
    log.debug('createTask payload', payload);
    const data = await this.request<{ taskId: string }>(`${this.baseUrl}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!data?.taskId) {
      throw new McpError('PROVIDER_ERROR', 'KIE accepted the request but returned no taskId.');
    }
    log.info(`Task created: ${data.taskId}`);
    return data;
  }

  /** GET /api/v1/jobs/recordInfo?taskId=... */
  async getTaskRecord(taskId: string): Promise<KieTaskRecord> {
    const url = `${this.baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;
    return this.request<KieTaskRecord>(url, { method: 'GET' });
  }

  /** GET /api/v1/chat/credit */
  async getCredits(): Promise<number> {
    const data = await this.request<number>(`${this.baseUrl}/api/v1/chat/credit`, {
      method: 'GET',
    });
    return typeof data === 'number' ? data : Number(data);
  }

  /**
   * POST /api/v1/common/download-url
   * Turns a KIE result URL into a temporary download link (valid 20 minutes).
   */
  async getDownloadUrl(url: string): Promise<string> {
    const data = await this.request<string>(`${this.baseUrl}/api/v1/common/download-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return typeof data === 'string' ? data : url;
  }

  /** POST https://kieai.redpandaai.co/api/file-stream-upload (multipart) */
  async uploadStream(params: {
    bytes: Uint8Array;
    fileName: string;
    mimeType: string;
    uploadPath: string;
  }): Promise<KieUploadResult> {
    const form = new FormData();
    const view = params.bytes;
    const buffer = view.buffer.slice(
      view.byteOffset,
      view.byteOffset + view.byteLength,
    ) as ArrayBuffer;
    form.append('file', new Blob([buffer], { type: params.mimeType }), params.fileName);
    form.append('uploadPath', params.uploadPath);
    form.append('fileName', params.fileName);
    log.info(`Uploading ${params.fileName} (${params.bytes.byteLength} bytes)`);
    return this.request<KieUploadResult>(`${this.uploadBaseUrl}/api/file-stream-upload`, {
      method: 'POST',
      body: form,
    });
  }

  /** POST https://kieai.redpandaai.co/api/file-url-upload */
  async uploadFromUrl(params: {
    fileUrl: string;
    uploadPath: string;
    fileName?: string;
  }): Promise<KieUploadResult> {
    log.info(`Mirroring remote file into KIE storage: ${params.fileUrl}`);
    return this.request<KieUploadResult>(`${this.uploadBaseUrl}/api/file-url-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }
}

/** Raw task record as documented at /market/common/get-task-detail. */
export interface KieTaskRecord {
  taskId: string;
  model: string;
  state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail' | string;
  param?: string;
  resultJson?: string;
  failCode?: string;
  failMsg?: string;
  costTime?: number;
  completeTime?: number;
  createTime?: number;
  updateTime?: number;
  progress?: number;
  creditsConsumed?: number;
}

/**
 * Upload responses differ slightly between the quickstart guide and the
 * endpoint reference, so both shapes are accepted.
 */
export interface KieUploadResult {
  fileName?: string;
  filePath?: string;
  originalName?: string;
  fileUrl?: string;
  downloadUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  uploadTime?: string;
  expiresAt?: string;
}
