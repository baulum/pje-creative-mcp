import type { KieTaskRecord } from './client.js';
import type { ResultAsset, Task, TaskStatus } from '../provider.js';
import { getModel } from '../../models/registry.js';

/**
 * KIE task states -> normalised MCP states.
 *
 * KIE documents `waiting`, `queuing`, `generating`, `success` and `fail`.
 * There is no documented cancelled state; `cancelled` stays in the union for
 * providers that do report one.
 * @see https://docs.kie.ai/market/common/get-task-detail
 */
const STATE_MAP: Record<string, TaskStatus> = {
  waiting: 'queued',
  queuing: 'queued',
  generating: 'processing',
  success: 'completed',
  fail: 'failed',
  // Defensive extras in case KIE adds aliases.
  pending: 'queued',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
};

export function mapState(state: string | undefined): TaskStatus {
  if (!state) return 'queued';
  return STATE_MAP[state.toLowerCase()] ?? 'processing';
}

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

export function guessMimeType(url: string): string | null {
  const clean = url.split('?')[0] ?? url;
  const ext = clean.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return MIME_BY_EXT[ext] ?? null;
}

/**
 * `resultJson` is a JSON *string*. The documented shapes are
 * `{"resultUrls":[...]}` and `{"resultObject":{...}}`.
 */
export function extractResults(resultJson: string | undefined): ResultAsset[] {
  if (!resultJson) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(resultJson);
  } catch {
    return [];
  }
  const urls = new Set<string>();

  const visit = (node: unknown, depth = 0): void => {
    if (depth > 5) return;
    if (typeof node === 'string') {
      if (/^https?:\/\//i.test(node)) urls.add(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1);
      return;
    }
    if (node && typeof node === 'object') {
      for (const value of Object.values(node)) visit(value, depth + 1);
    }
  };
  visit(parsed);

  return [...urls].map((url) => ({ url, mime_type: guessMimeType(url) }));
}

function toIso(ms: number | undefined): string | undefined {
  if (!ms) return undefined;
  return new Date(ms).toISOString();
}

/** Convert a raw KIE record into the normalised Task shape. */
export function normalizeTask(record: KieTaskRecord, fallbackType?: 'image' | 'video'): Task {
  const status = mapState(record.state);
  const model = getModel(record.model);
  const type = model?.type ?? fallbackType ?? 'image';

  const task: Task = {
    task_id: record.taskId,
    status,
    type,
    model: record.model,
    provider: 'kie',
    results: status === 'completed' ? extractResults(record.resultJson) : [],
  };

  if (status === 'failed') {
    task.error = {
      code: record.failCode ? `KIE_${record.failCode}` : 'GENERATION_FAILED',
      message: record.failMsg || 'KIE reported the task as failed without a message.',
    };
  }
  if (typeof record.progress === 'number') task.progress = record.progress;
  if (typeof record.creditsConsumed === 'number') task.credits_consumed = record.creditsConsumed;
  if (typeof record.costTime === 'number') task.cost_ms = record.costTime;
  const createdAt = toIso(record.createTime);
  if (createdAt) task.created_at = createdAt;
  const completedAt = toIso(record.completeTime);
  if (completedAt) task.completed_at = completedAt;

  return task;
}
