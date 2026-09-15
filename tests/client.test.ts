import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KieClient } from '../src/providers/kie/client.js';
import { McpError } from '../src/utils/errors.js';

interface Recorded {
  url: string;
  init: RequestInit | undefined;
}

/** Minimal fetch stub - no test in this file touches the network. */
function stubFetch(
  responder: (url: string, init?: RequestInit) => { status?: number; body: unknown },
): { fetchImpl: typeof fetch; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const { status = 200, body } = responder(url, init);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

function makeClient(fetchImpl: typeof fetch): KieClient {
  return new KieClient({
    apiKey: 'test-key',
    baseUrl: 'https://api.kie.ai',
    uploadBaseUrl: 'https://kieai.redpandaai.co',
    requestTimeoutMs: 5000,
    fetchImpl,
  });
}

test('createTask posts to the unified job endpoint with a bearer token', async () => {
  const { fetchImpl, calls } = stubFetch(() => ({
    body: { code: 200, msg: 'success', data: { taskId: 'task_1' } },
  }));
  const result = await makeClient(fetchImpl).createTask({
    model: 'google/nano-banana',
    input: { prompt: 'hello' },
  });

  assert.equal(result.taskId, 'task_1');
  assert.equal(calls[0]!.url, 'https://api.kie.ai/api/v1/jobs/createTask');
  assert.equal(calls[0]!.init?.method, 'POST');
  const headers = calls[0]!.init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer test-key');
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    model: 'google/nano-banana',
    input: { prompt: 'hello' },
  });
});

test('recordInfo url-encodes the task id', async () => {
  const { fetchImpl, calls } = stubFetch(() => ({
    body: { code: 200, msg: 'success', data: { taskId: 'a/b', model: 'x', state: 'success' } },
  }));
  await makeClient(fetchImpl).getTaskRecord('a/b');
  assert.equal(calls[0]!.url, 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=a%2Fb');
});

test('the in-body KIE code drives the error, not just the HTTP status', async () => {
  const cases: [number, string][] = [
    [401, 'AUTHENTICATION_FAILED'],
    [402, 'INSUFFICIENT_CREDITS'],
    [404, 'TASK_NOT_FOUND'],
    [422, 'INVALID_PARAMETER'],
    [429, 'RATE_LIMITED'],
    [501, 'GENERATION_FAILED'],
    [505, 'PROVIDER_ERROR'],
  ];
  for (const [kieCode, expected] of cases) {
    const { fetchImpl } = stubFetch(() => ({
      status: 200,
      body: { code: kieCode, msg: 'nope', data: null },
    }));
    await assert.rejects(
      makeClient(fetchImpl).createTask({ model: 'm', input: {} }),
      (err: unknown) => {
        assert.ok(err instanceof McpError);
        assert.equal(err.code, expected, `KIE ${kieCode}`);
        return true;
      },
    );
  }
});

test('a non-JSON response becomes a PROVIDER_ERROR, not a parse crash', async () => {
  const fetchImpl = (async () =>
    new Response('<html>gateway</html>', { status: 502 })) as unknown as typeof fetch;
  await assert.rejects(makeClient(fetchImpl).getCredits(), (err: unknown) => {
    assert.ok(err instanceof McpError);
    assert.equal(err.code, 'PROVIDER_ERROR');
    return true;
  });
});

test('a task accepted without a taskId is reported rather than passed on', async () => {
  const { fetchImpl } = stubFetch(() => ({ body: { code: 200, msg: 'success', data: {} } }));
  await assert.rejects(makeClient(fetchImpl).createTask({ model: 'm', input: {} }), McpError);
});

test('credits and download-url unwrap the KIE envelope', async () => {
  const { fetchImpl, calls } = stubFetch((url) =>
    url.endsWith('/chat/credit')
      ? { body: { code: 200, msg: 'success', data: 100 } }
      : { body: { code: 200, msg: 'success', data: 'https://tempfile.kie/abc' } },
  );
  const client = makeClient(fetchImpl);
  assert.equal(await client.getCredits(), 100);
  assert.equal(await client.getDownloadUrl('https://cdn.kie.ai/a.png'), 'https://tempfile.kie/abc');
  assert.equal(calls[1]!.url, 'https://api.kie.ai/api/v1/common/download-url');
});
