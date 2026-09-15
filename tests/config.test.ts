import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, resetConfig } from '../src/server/config.js';
import { McpError, mapKieCode, toMcpError } from '../src/utils/errors.js';
import { redact } from '../src/utils/logger.js';
import { errorEnvelope, taskEnvelope } from '../src/utils/validation.js';

afterEach(() => resetConfig());

test('a missing API key fails with an actionable error rather than a silent default', () => {
  try {
    loadConfig({ KIE_API_KEY: '' } as NodeJS.ProcessEnv);
    assert.fail('expected loadConfig to throw');
  } catch (err) {
    assert.ok(err instanceof McpError);
    assert.equal(err.code, 'MISSING_API_KEY');
    assert.match(err.hint ?? '', /kie\.ai\/api-key/);
  }
});

test('defaults are applied and overrides are honoured', () => {
  const config = loadConfig({ KIE_API_KEY: 'k' } as NodeJS.ProcessEnv);
  assert.equal(config.baseUrl, 'https://api.kie.ai');
  assert.equal(config.uploadBaseUrl, 'https://kieai.redpandaai.co');
  assert.equal(config.requestTimeoutMs, 120_000);

  resetConfig();
  const overridden = loadConfig({
    KIE_API_KEY: 'k',
    KIE_BASE_URL: 'https://example.test/',
    KIE_REQUEST_TIMEOUT_MS: '5000',
    PJE_LOG_LEVEL: 'debug',
  } as NodeJS.ProcessEnv);
  assert.equal(overridden.baseUrl, 'https://example.test');
  assert.equal(overridden.requestTimeoutMs, 5000);
  assert.equal(overridden.logLevel, 'debug');
});

test('a nonsensical timeout falls back to the default instead of breaking requests', () => {
  const config = loadConfig({
    KIE_API_KEY: 'k',
    KIE_REQUEST_TIMEOUT_MS: 'soon',
  } as NodeJS.ProcessEnv);
  assert.equal(config.requestTimeoutMs, 120_000);
});

test('every documented KIE status code maps to a distinct, actionable error', () => {
  assert.equal(mapKieCode(401, 'x').code, 'AUTHENTICATION_FAILED');
  assert.equal(mapKieCode(402, 'x').code, 'INSUFFICIENT_CREDITS');
  assert.equal(mapKieCode(408, 'x').code, 'PROVIDER_ERROR');
  assert.equal(mapKieCode(429, 'x').code, 'RATE_LIMITED');
  assert.equal(mapKieCode(455, 'x').code, 'PROVIDER_ERROR');
  assert.equal(mapKieCode(9999, 'x').details?.kie_code, 9999);
});

test('arbitrary throwables become McpErrors without losing the message', () => {
  assert.equal(toMcpError(new Error('boom')).code, 'INTERNAL_ERROR');
  const abort = new Error('aborted');
  abort.name = 'AbortError';
  assert.equal(toMcpError(abort).code, 'TIMEOUT');
  assert.equal(toMcpError('plain string').message, 'plain string');
  const existing = new McpError('RATE_LIMITED', 'x');
  assert.equal(toMcpError(existing), existing);
});

test('credentials never reach the logs', () => {
  const redacted = redact({
    Authorization: 'Bearer sk-secret',
    nested: { KIE_API_KEY: 'sk-secret', note: 'Bearer sk-secret in text' },
    keep: 'visible',
  }) as Record<string, Record<string, string> | string>;

  assert.equal(redacted.Authorization, '[redacted]');
  assert.equal((redacted.nested as Record<string, string>).KIE_API_KEY, '[redacted]');
  assert.equal((redacted.nested as Record<string, string>).note, 'Bearer [redacted] in text');
  assert.equal(redacted.keep, 'visible');
});

test('the task envelope shape matches what the tools promise', () => {
  const running = taskEnvelope({
    task_id: 't',
    status: 'processing',
    type: 'video',
    model: 'veo-3-1',
    provider: 'kie',
    results: [],
  });
  assert.equal(running.success, true);
  assert.equal(running.status, 'processing');
  assert.equal(running.results, undefined);

  const done = taskEnvelope({
    task_id: 't',
    status: 'completed',
    type: 'image',
    model: 'google/nano-banana',
    provider: 'kie',
    results: [{ url: 'https://cdn.kie.ai/a.png', mime_type: 'image/png' }],
  });
  assert.deepEqual(done.results, [{ url: 'https://cdn.kie.ai/a.png', mime_type: 'image/png' }]);

  const failed = taskEnvelope({
    task_id: 't',
    status: 'failed',
    type: 'image',
    model: 'google/nano-banana',
    provider: 'kie',
    results: [],
    error: { code: 'KIE_501', message: 'blocked' },
  });
  assert.equal(failed.status, 'failed');
  assert.deepEqual(failed.failure, { code: 'KIE_501', message: 'blocked' });
});

test('the error envelope carries code, message and hint', () => {
  const envelope = errorEnvelope(
    new McpError('RATE_LIMITED', 'too fast', { hint: 'back off', details: { retry_after: 5 } }),
  );
  assert.deepEqual(envelope, {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'too fast', hint: 'back off', details: { retry_after: 5 } },
  });
});
