import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractResults, mapState, normalizeTask } from '../src/providers/kie/tasks.js';

test('every documented KIE state maps to a normalised status', () => {
  assert.equal(mapState('waiting'), 'queued');
  assert.equal(mapState('queuing'), 'queued');
  assert.equal(mapState('generating'), 'processing');
  assert.equal(mapState('success'), 'completed');
  assert.equal(mapState('fail'), 'failed');
});

test('unknown states degrade to processing rather than throwing', () => {
  assert.equal(mapState('something-new'), 'processing');
  assert.equal(mapState(undefined), 'queued');
});

test('resultJson resultUrls are extracted with mime types', () => {
  const results = extractResults('{"resultUrls":["https://cdn.kie.ai/a.png","https://cdn.kie.ai/b.mp4"]}');
  assert.deepEqual(results, [
    { url: 'https://cdn.kie.ai/a.png', mime_type: 'image/png' },
    { url: 'https://cdn.kie.ai/b.mp4', mime_type: 'video/mp4' },
  ]);
});

test('resultObject shapes are extracted too', () => {
  const results = extractResults(
    '{"resultObject":{"mask_urls":["https://cdn.kie.ai/mask_1.png"]}}',
  );
  assert.equal(results.length, 1);
  assert.equal(results[0]!.url, 'https://cdn.kie.ai/mask_1.png');
});

test('malformed or empty resultJson yields no results instead of throwing', () => {
  assert.deepEqual(extractResults('not json'), []);
  assert.deepEqual(extractResults(undefined), []);
  assert.deepEqual(extractResults('{"resultObject":{"subject_status":1}}'), []);
});

test('a successful record becomes a completed task with results and metadata', () => {
  const task = normalizeTask({
    taskId: 't1',
    model: 'google/nano-banana',
    state: 'success',
    resultJson: '{"resultUrls":["https://cdn.kie.ai/a.png"]}',
    createTime: 1698765400000,
    completeTime: 1698765432000,
    costTime: 15000,
    creditsConsumed: 50,
  });
  assert.equal(task.status, 'completed');
  assert.equal(task.type, 'image');
  assert.equal(task.results.length, 1);
  assert.equal(task.credits_consumed, 50);
  assert.equal(task.created_at, new Date(1698765400000).toISOString());
});

test('a failed record carries the KIE failure code and message', () => {
  const task = normalizeTask({
    taskId: 't2',
    model: 'veo-3-1',
    state: 'fail',
    failCode: '501',
    failMsg: 'content policy',
  });
  assert.equal(task.status, 'failed');
  assert.equal(task.type, 'video');
  assert.equal(task.error?.code, 'KIE_501');
  assert.equal(task.error?.message, 'content policy');
});

test('results are not reported for tasks that have not completed', () => {
  const task = normalizeTask({
    taskId: 't3',
    model: 'google/nano-banana',
    state: 'generating',
    resultJson: '{"resultUrls":["https://cdn.kie.ai/partial.png"]}',
    progress: 45,
  });
  assert.equal(task.status, 'processing');
  assert.deepEqual(task.results, []);
  assert.equal(task.progress, 45);
});
