import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../src/server/server.js';
import type { ServerConfig } from '../src/server/config.js';

const CONFIG: ServerConfig = {
  apiKey: 'test-key',
  baseUrl: 'https://api.kie.ai',
  uploadBaseUrl: 'https://kieai.redpandaai.co',
  requestTimeoutMs: 5000,
  defaultOutputDir: './output',
  logLevel: 'silent',
};

const EXPECTED_TOOLS = [
  'list_models',
  'get_model',
  'generate_image',
  'edit_image',
  'upscale_image',
  'generate_video',
  'image_to_video',
  'video_to_video',
  'get_task',
  'wait_for_task',
  'upload_file',
  'download_result',
  'get_credits',
];

async function connect(fetchImpl?: typeof fetch): Promise<Client> {
  const server = buildServer({ config: CONFIG, ...(fetchImpl ? { fetchImpl } : {}) });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

function parse(result: unknown): Record<string, unknown> {
  const content = (result as { content: { type: string; text: string }[] }).content;
  return JSON.parse(content[0]!.text) as Record<string, unknown>;
}

test('every tool is registered with a title and a description', async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [...EXPECTED_TOOLS].sort());
  for (const tool of tools) {
    assert.ok(tool.description && tool.description.length > 40, `${tool.name} needs a description`);
    assert.ok(tool.inputSchema, `${tool.name} needs an input schema`);
  }
  await client.close();
});

test('list_models reports the defaults and the registry', async () => {
  const client = await connect();
  const body = parse(await client.callTool({ name: 'list_models', arguments: { type: 'video' } }));
  assert.equal(body.success, true);
  assert.ok((body.count as number) > 0);
  assert.ok((body.models as { type: string }[]).every((m) => m.type === 'video'));
  await client.close();
});

test('get_model on an unknown id returns a structured error, never a stack trace', async () => {
  const client = await connect();
  const result = await client.callTool({ name: 'get_model', arguments: { model: 'nope' } });
  const body = parse(result);
  assert.equal(body.success, false);
  assert.equal((body.error as { code: string }).code, 'INVALID_MODEL');
  assert.equal((result as { isError?: boolean }).isError, true);
  await client.close();
});

test('a provider failure is surfaced as a mapped error envelope', async () => {
  const fetchImpl = (async () =>
    new Response(JSON.stringify({ code: 402, msg: 'no credits', data: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;

  const client = await connect(fetchImpl);
  const body = parse(
    await client.callTool({
      name: 'generate_image',
      arguments: { prompt: 'a cat', model: 'google/nano-banana' },
    }),
  );
  assert.equal(body.success, false);
  const error = body.error as { code: string; hint?: string };
  assert.equal(error.code, 'INSUFFICIENT_CREDITS');
  assert.match(error.hint ?? '', /get_credits|kie\.ai/);
  await client.close();
});

test('a successful generation returns the normalised task envelope', async () => {
  const fetchImpl = (async () =>
    new Response(JSON.stringify({ code: 200, msg: 'success', data: { taskId: 'task_9' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;

  const client = await connect(fetchImpl);
  const body = parse(
    await client.callTool({
      name: 'generate_image',
      arguments: { prompt: 'a cat', model: 'google/nano-banana', aspect_ratio: '16:9' },
    }),
  );
  assert.equal(body.success, true);
  assert.equal(body.task_id, 'task_9');
  assert.equal(body.status, 'queued');
  assert.equal(body.type, 'image');
  assert.deepEqual(body.metadata, { provider: 'kie', model: 'google/nano-banana' });
  await client.close();
});

test('an unsupported parameter is reported before any credits are spent', async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return new Response('{}');
  }) as unknown as typeof fetch;

  const client = await connect(fetchImpl);
  const body = parse(
    await client.callTool({
      name: 'generate_video',
      arguments: { prompt: 'p', model: 'hailuo/02-text-to-video-pro', duration: 5 },
    }),
  );
  assert.equal(body.success, false);
  assert.equal((body.error as { code: string }).code, 'UNSUPPORTED_PARAMETER');
  assert.equal(called, false);
  await client.close();
});

test('schema violations are rejected by the MCP layer itself', async () => {
  const client = await connect();
  const result = await client.callTool({ name: 'generate_image', arguments: { prompt: '' } });
  assert.equal((result as { isError?: boolean }).isError, true);
  await client.close();
});
