/**
 * stderr logger.
 *
 * An MCP stdio server must keep stdout clean for the JSON-RPC stream, so every
 * log line goes to stderr. Values are redacted before they are written.
 */

export type LogLevel = 'silent' | 'error' | 'info' | 'debug';

const ORDER: Record<LogLevel, number> = { silent: 0, error: 1, info: 2, debug: 3 };

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

const SENSITIVE_KEYS = /^(authorization|api[_-]?key|kie[_-]?api[_-]?key|token|secret)$/i;

/** Strip API keys and other credentials from anything we are about to log. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[deep]';
  if (typeof value === 'string') {
    return value.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, 'Bearer [redacted]');
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.test(k) ? '[redacted]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function write(level: Exclude<LogLevel, 'silent'>, scope: string, msg: string, extra?: unknown) {
  if (ORDER[currentLevel] < ORDER[level]) return;
  const suffix = extra === undefined ? '' : ` ${JSON.stringify(redact(extra))}`;
  process.stderr.write(`[${scope}] ${msg}${suffix}\n`);
}

export function createLogger(scope: string) {
  return {
    error: (msg: string, extra?: unknown) => write('error', scope, msg, extra),
    info: (msg: string, extra?: unknown) => write('info', scope, msg, extra),
    debug: (msg: string, extra?: unknown) => write('debug', scope, msg, extra),
  };
}
