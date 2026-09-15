/**
 * Error taxonomy for the MCP server.
 *
 * Every failure that reaches a tool handler is converted into an `McpError`
 * with a stable machine-readable `code`, so Claude never sees a raw stack trace.
 */

export type ErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_MODEL'
  | 'UNSUPPORTED_PARAMETER'
  | 'INVALID_PARAMETER'
  | 'PROVIDER_ERROR'
  | 'AUTHENTICATION_FAILED'
  | 'INSUFFICIENT_CREDITS'
  | 'RATE_LIMITED'
  | 'CONTENT_REJECTED'
  | 'GENERATION_FAILED'
  | 'TASK_NOT_FOUND'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'FILE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INVALID_PATH'
  | 'FILE_EXISTS'
  | 'UPLOAD_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'INTERNAL_ERROR';

export class McpError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly hint?: string;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { details?: Record<string, unknown>; hint?: string; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'McpError';
    this.code = code;
    if (options?.details) this.details = options.details;
    if (options?.hint) this.hint = options.hint;
  }
}

/**
 * KIE returns its own status code inside the JSON body (`code`) as well as in
 * the HTTP status. Documented values are listed on every model page.
 * @see https://docs.kie.ai/market/common/get-task-detail
 */
export function mapKieCode(code: number, message: string): McpError {
  switch (code) {
    case 401:
      return new McpError('AUTHENTICATION_FAILED', `KIE rejected the API key: ${message}`, {
        hint: 'Check KIE_API_KEY. Keys are managed at https://kie.ai/api-key.',
      });
    case 402:
      return new McpError('INSUFFICIENT_CREDITS', `Not enough KIE credits: ${message}`, {
        hint: 'Top up at https://kie.ai/pricing, or call get_credits to check the balance.',
      });
    case 404:
      return new McpError('TASK_NOT_FOUND', `KIE resource not found: ${message}`);
    case 408:
      return new McpError(
        'PROVIDER_ERROR',
        `KIE upstream timed out (no result for over 10 minutes): ${message}`,
      );
    case 422:
      return new McpError('INVALID_PARAMETER', `KIE rejected the request parameters: ${message}`);
    case 429:
      return new McpError('RATE_LIMITED', `KIE rate limit exceeded: ${message}`, {
        hint: 'Back off and retry. Rate limits apply per API key and per IP.',
      });
    case 455:
      return new McpError('PROVIDER_ERROR', `KIE is under maintenance: ${message}`);
    case 501:
      return new McpError('GENERATION_FAILED', `KIE generation failed: ${message}`);
    case 505:
      return new McpError('PROVIDER_ERROR', `The requested KIE feature is disabled: ${message}`);
    case 500:
      return new McpError('PROVIDER_ERROR', `KIE server error: ${message}`);
    default:
      return new McpError('PROVIDER_ERROR', `KIE returned code ${code}: ${message}`, {
        details: { kie_code: code },
      });
  }
}

/** Normalise anything thrown into an McpError. */
export function toMcpError(err: unknown): McpError {
  if (err instanceof McpError) return err;
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return new McpError('TIMEOUT', `Request timed out: ${err.message}`, { cause: err });
    }
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return new McpError('FILE_NOT_FOUND', err.message, { cause: err });
    }
    if (err.name === 'TypeError' && /fetch/i.test(err.message)) {
      return new McpError('NETWORK_ERROR', `Could not reach the KIE API: ${err.message}`, {
        cause: err,
      });
    }
    return new McpError('INTERNAL_ERROR', err.message, { cause: err });
  }
  return new McpError('INTERNAL_ERROR', String(err));
}
