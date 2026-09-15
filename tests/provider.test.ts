import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KieProvider } from '../src/providers/kie/index.js';
import { McpError } from '../src/utils/errors.js';
import type { ServerConfig } from '../src/server/config.js';

const CONFIG: ServerConfig = {
  apiKey: 'test-key',
  baseUrl: 'https://api.kie.ai',
  uploadBaseUrl: 'https://kieai.redpandaai.co',
  requestTimeoutMs: 5000,
  defaultOutputDir: './output',
  logLevel: 'silent',
};

interface Call {
  url: string;
  body: unknown;
}

function scripted(responses: Record<string, unknown>): { impl: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const raw = init?.body;
    calls.push({ url, body: typeof raw === 'string' ? JSON.parse(raw) : raw });
    const key = Object.keys(responses).find((k) => url.includes(k));
    const body = key ? responses[key] : { code: 404, msg: 'no stub', data: null };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

test('generateImage submits the model and mapped input, and returns a queued task', async () => {
  const { impl, calls } = scripted({
    createTask: { code: 200, msg: 'success', data: { taskId: 'task_img' } },
  });
  const provider = new KieProvider(CONFIG, impl);

  const task = await provider.generateImage({
    prompt: 'a cinematic portrait',
    model: 'bytedance/seedream-v4-text-to-image',
    aspect_ratio: '9:16',
    resolution: '2K',
    number_of_images: 3,
  });

  assert.deepEqual(task, {
    task_id: 'task_img',
    status: 'queued',
    type: 'image',
    model: 'bytedance/seedream-v4-text-to-image',
    provider: 'kie',
    results: [],
  });
  assert.deepEqual(calls[0]!.body, {
    model: 'bytedance/seedream-v4-text-to-image',
    input: {
      prompt: 'a cinematic portrait',
      image_size: 'portrait_16_9',
      image_resolution: '2K',
      max_images: 3,
    },
  });
});

test('a model that cannot do the requested job is rejected with alternatives', async () => {
  const { impl } = scripted({});
  const provider = new KieProvider(CONFIG, impl);
  await assert.rejects(
    provider.generateVideo({ prompt: 'p', model: 'google/nano-banana' }),
    (err: unknown) => {
      assert.ok(err instanceof McpError);
      assert.equal(err.code, 'INVALID_MODEL');
      assert.match(err.message, /does not support text-to-video/);
      return true;
    },
  );
});

test('an unknown model id is rejected before any HTTP call', async () => {
  const { impl, calls } = scripted({});
  const provider = new KieProvider(CONFIG, impl);
  await assert.rejects(provider.generateImage({ prompt: 'p', model: 'not-a-model' }), McpError);
  assert.equal(calls.length, 0);
});

test('remote image URLs are passed straight through without an upload round-trip', async () => {
  const { impl, calls } = scripted({
    createTask: { code: 200, msg: 'success', data: { taskId: 'task_v' } },
  });
  const provider = new KieProvider(CONFIG, impl);

  await provider.imageToVideo({
    images: ['https://cdn.kie.ai/frame.png'],
    prompt: 'slow dolly in',
    model: 'kling/v3-turbo-image-to-video',
    duration: 10,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, 'https://api.kie.ai/api/v1/jobs/createTask');
  assert.deepEqual(calls[0]!.body, {
    model: 'kling/v3-turbo-image-to-video',
    input: {
      prompt: 'slow dolly in',
      image_urls: ['https://cdn.kie.ai/frame.png'],
      duration: '10',
      resolution: '720p',
    },
  });
});

test('callback_url is forwarded as KIE callBackUrl', async () => {
  const { impl, calls } = scripted({
    createTask: { code: 200, msg: 'success', data: { taskId: 't' } },
  });
  const provider = new KieProvider(CONFIG, impl);
  await provider.generateImage({
    prompt: 'p',
    model: 'google/nano-banana',
    callback_url: 'https://example.com/hook',
  });
  assert.equal((calls[0]!.body as { callBackUrl: string }).callBackUrl, 'https://example.com/hook');
});

test('getTask normalises the raw record', async () => {
  const { impl } = scripted({
    recordInfo: {
      code: 200,
      msg: 'success',
      data: {
        taskId: 't1',
        model: 'google/nano-banana',
        state: 'success',
        resultJson: '{"resultUrls":["https://cdn.kie.ai/a.png"]}',
      },
    },
  });
  const task = await new KieProvider(CONFIG, impl).getTask('t1');
  assert.equal(task.status, 'completed');
  assert.equal(task.results[0]!.mime_type, 'image/png');
});

test('waitForTask polls until the task settles', async () => {
  const states = ['waiting', 'generating', 'success'];
  let index = 0;
  const impl = (async () => {
    const state = states[Math.min(index++, states.length - 1)];
    return new Response(
      JSON.stringify({
        code: 200,
        msg: 'success',
        data: {
          taskId: 't1',
          model: 'google/nano-banana',
          state,
          resultJson: '{"resultUrls":["https://cdn.kie.ai/a.png"]}',
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as unknown as typeof fetch;

  const task = await new KieProvider(CONFIG, impl).waitForTask('t1', {
    timeoutMs: 5000,
    pollIntervalMs: 1,
  });
  assert.equal(task.status, 'completed');
  assert.equal(index, 3);
});

test('waitForTask times out with a recoverable hint instead of hanging', async () => {
  const impl = (async () =>
    new Response(
      JSON.stringify({
        code: 200,
        msg: 'success',
        data: { taskId: 't1', model: 'veo-3-1', state: 'generating' },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )) as unknown as typeof fetch;

  await assert.rejects(
    new KieProvider(CONFIG, impl).waitForTask('t1', { timeoutMs: 20, pollIntervalMs: 1 }),
    (err: unknown) => {
      assert.ok(err instanceof McpError);
      assert.equal(err.code, 'TIMEOUT');
      assert.match(err.hint ?? '', /get_task/);
      return true;
    },
  );
});

test('upload_file needs either a path or a URL', async () => {
  const { impl } = scripted({});
  await assert.rejects(new KieProvider(CONFIG, impl).uploadFile({}), McpError);
});
