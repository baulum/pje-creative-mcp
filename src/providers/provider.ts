/**
 * Provider-agnostic contract.
 *
 * MCP tools only ever talk to this interface, so adding a second provider means
 * implementing `AIProvider` and registering it - the tools do not change.
 */

import type { Capability } from '../models/types.js';

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ResultAsset {
  url: string;
  mime_type: string | null;
}

/** Normalised task record returned by every provider method. */
export interface Task {
  task_id: string;
  status: TaskStatus;
  /** What the task produces. */
  type: 'image' | 'video';
  model: string;
  provider: string;
  results: ResultAsset[];
  error?: { code: string; message: string };
  /** Progress percentage when the provider reports one. */
  progress?: number;
  credits_consumed?: number;
  created_at?: string;
  completed_at?: string;
  cost_ms?: number;
}

/** Normalised inputs. `options` carries documented model-specific fields. */
export interface BaseGenerationInput {
  prompt?: string;
  model: string;
  aspect_ratio?: string;
  resolution?: string;
  negative_prompt?: string;
  seed?: number;
  output_format?: string;
  options?: Record<string, unknown>;
  /** URL that KIE should POST the finished task to. */
  callback_url?: string;
}

export interface ImageGenerationInput extends BaseGenerationInput {
  prompt: string;
  number_of_images?: number;
  /** Reference images, already resolved to public URLs. */
  reference_images?: string[];
}

export interface ImageEditInput extends BaseGenerationInput {
  prompt: string;
  images: string[];
  mask?: string;
  number_of_images?: number;
}

export interface ImageUpscaleInput extends BaseGenerationInput {
  image: string;
  upscale_factor?: string;
}

export interface VideoGenerationInput extends BaseGenerationInput {
  prompt: string;
  duration?: number;
}

export interface ImageToVideoInput extends BaseGenerationInput {
  images: string[];
  prompt?: string;
  duration?: number;
}

export interface VideoToVideoInput extends BaseGenerationInput {
  video?: string;
  audio?: string;
  prompt?: string;
  duration?: number;
}

export interface UploadedFile {
  url: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  expires_at: string | null;
}

export interface AIProvider {
  readonly name: string;

  generateImage(input: ImageGenerationInput): Promise<Task>;
  editImage(input: ImageEditInput): Promise<Task>;
  upscaleImage(input: ImageUpscaleInput): Promise<Task>;
  generateVideo(input: VideoGenerationInput): Promise<Task>;
  imageToVideo(input: ImageToVideoInput): Promise<Task>;
  videoToVideo(input: VideoToVideoInput): Promise<Task>;

  getTask(taskId: string): Promise<Task>;
  waitForTask(
    taskId: string,
    options: { timeoutMs: number; pollIntervalMs: number; signal?: AbortSignal },
  ): Promise<Task>;

  uploadFile(input: { path?: string; url?: string; uploadPath?: string }): Promise<UploadedFile>;
  getCredits(): Promise<number>;

  /** Capabilities this provider can serve, used for routing and validation. */
  supports(capability: Capability): boolean;
}
