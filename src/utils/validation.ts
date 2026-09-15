import { z } from 'zod';
import { McpError } from './errors.js';
import type { Task } from '../providers/provider.js';

/** Envelope every tool returns on success. */
export interface SuccessEnvelope {
  success: true;
  [key: string]: unknown;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    hint?: string;
    details?: Record<string, unknown>;
  };
}

export type ToolEnvelope = SuccessEnvelope | ErrorEnvelope;

/** Normalised task -> tool response body. */
export function taskEnvelope(task: Task, extra?: Record<string, unknown>): SuccessEnvelope {
  const body: SuccessEnvelope = {
    success: true,
    type: task.type,
    task_id: task.task_id,
    status: task.status,
    metadata: {
      provider: task.provider,
      model: task.model,
      ...(task.progress !== undefined ? { progress: task.progress } : {}),
      ...(task.credits_consumed !== undefined ? { credits_consumed: task.credits_consumed } : {}),
      ...(task.cost_ms !== undefined ? { cost_ms: task.cost_ms } : {}),
      ...(task.created_at ? { created_at: task.created_at } : {}),
      ...(task.completed_at ? { completed_at: task.completed_at } : {}),
    },
    ...extra,
  };
  if (task.status === 'completed') body.results = task.results;
  if (task.status === 'failed' && task.error) {
    return {
      success: true,
      type: task.type,
      task_id: task.task_id,
      status: 'failed',
      failure: task.error,
      metadata: body.metadata,
    };
  }
  return body;
}

export function errorEnvelope(err: McpError): ErrorEnvelope {
  return {
    success: false,
    error: {
      code: err.code,
      message: err.message,
      ...(err.hint ? { hint: err.hint } : {}),
      ...(err.details ? { details: err.details } : {}),
    },
  };
}

/** Shared zod fragments used across several tools. */
export const commonSchemas = {
  model: z
    .string()
    .min(1)
    .describe('KIE model id. Omit to use the default for this tool; see list_models.'),
  prompt: z.string().min(1).describe('The generation prompt.'),
  aspectRatio: z
    .string()
    .describe('Aspect ratio such as "16:9" or "9:16". Model-dependent; see get_model.'),
  resolution: z
    .string()
    .describe('Output resolution. Images use 1K/2K/4K, videos use 480p/720p/1080p/4k.'),
  options: z
    .record(z.string(), z.unknown())
    .describe(
      'Model-specific fields that have no normalised equivalent (e.g. cfg_scale, mode, generate_audio). ' +
        'Only fields documented for the chosen model are accepted; call get_model to list them.',
    ),
  callbackUrl: z
    .string()
    .url()
    .describe(
      'Optional public URL that KIE POSTs the finished task to. Only useful if you run a reachable webhook receiver; otherwise poll with wait_for_task.',
    ),
};

export function assertNonEmptyArray<T>(value: T[] | undefined, name: string): T[] {
  if (!value || value.length === 0) {
    throw new McpError('INVALID_PARAMETER', `${name} must contain at least one entry.`);
  }
  return value;
}
