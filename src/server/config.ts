import { config as loadDotenv } from 'dotenv';
import { McpError } from '../utils/errors.js';
import { setLogLevel, type LogLevel } from '../utils/logger.js';

export interface ServerConfig {
  apiKey: string;
  baseUrl: string;
  uploadBaseUrl: string;
  requestTimeoutMs: number;
  defaultOutputDir: string;
  logLevel: LogLevel;
}

const DEFAULTS = {
  baseUrl: 'https://api.kie.ai',
  uploadBaseUrl: 'https://kieai.redpandaai.co',
  requestTimeoutMs: 120_000,
  defaultOutputDir: './output',
  logLevel: 'info' as LogLevel,
};

function parseLogLevel(raw: string | undefined): LogLevel {
  if (raw === 'silent' || raw === 'error' || raw === 'info' || raw === 'debug') return raw;
  return DEFAULTS.logLevel;
}

let cached: ServerConfig | undefined;

/**
 * Reads configuration from the environment.
 *
 * `.env.local` is loaded before `.env` so a personal key can sit beside a
 * checked-in default. Neither file overrides a variable that is already set, so
 * a Claude Code `env` block always wins.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  if (cached) return cached;
  loadDotenv({ path: ['.env.local', '.env'], quiet: true });

  // `env` defaults to process.env by reference, so dotenv values are visible here.
  const apiKey = (env.KIE_API_KEY ?? '').trim();
  if (!apiKey) {
    throw new McpError('MISSING_API_KEY', 'KIE_API_KEY is not set.', {
      hint:
        'Create a key at https://kie.ai/api-key, then put KIE_API_KEY in .env or in the env block ' +
        'of the MCP server entry in your Claude Code configuration.',
    });
  }

  const timeoutRaw = env.KIE_REQUEST_TIMEOUT_MS;
  const parsedTimeout = timeoutRaw ? Number(timeoutRaw) : NaN;

  cached = {
    apiKey,
    baseUrl: (env.KIE_BASE_URL ?? DEFAULTS.baseUrl).replace(/\/+$/, ''),
    uploadBaseUrl: (env.KIE_UPLOAD_BASE_URL ?? DEFAULTS.uploadBaseUrl).replace(/\/+$/, ''),
    requestTimeoutMs:
      Number.isFinite(parsedTimeout) && parsedTimeout > 0
        ? parsedTimeout
        : DEFAULTS.requestTimeoutMs,
    defaultOutputDir: env.PJE_OUTPUT_DIR ?? DEFAULTS.defaultOutputDir,
    logLevel: parseLogLevel(env.PJE_LOG_LEVEL),
  };
  setLogLevel(cached.logLevel);
  return cached;
}

/** Test helper: forget the memoised config. */
export function resetConfig(): void {
  cached = undefined;
}
