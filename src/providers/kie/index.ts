import { KieClient } from './client.js';
import { normalizeTask } from './tasks.js';
import { editImage, generateImage, upscaleImage } from './images.js';
import { generateVideo, imageToVideo, videoToVideo } from './videos.js';
import { resolveToRemoteUrl, uploadLocalFile, uploadRemoteFile } from './files.js';
import { McpError } from '../../utils/errors.js';
import { createLogger } from '../../utils/logger.js';
import type { ServerConfig } from '../../server/config.js';
import type { Capability } from '../../models/types.js';
import type {
  AIProvider,
  ImageEditInput,
  ImageGenerationInput,
  ImageToVideoInput,
  ImageUpscaleInput,
  Task,
  UploadedFile,
  VideoGenerationInput,
  VideoToVideoInput,
} from '../provider.js';

const log = createLogger('KIE');

const SUPPORTED: Capability[] = [
  'text-to-image',
  'image-to-image',
  'image-upscale',
  'background-removal',
  'text-to-video',
  'image-to-video',
  'video-to-video',
];

/** KIE.ai implementation of the provider contract. */
export class KieProvider implements AIProvider {
  readonly name = 'kie';
  readonly client: KieClient;

  constructor(config: ServerConfig, fetchImpl?: typeof fetch) {
    this.client = new KieClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      uploadBaseUrl: config.uploadBaseUrl,
      requestTimeoutMs: config.requestTimeoutMs,
      ...(fetchImpl ? { fetchImpl } : {}),
    });
  }

  supports(capability: Capability): boolean {
    return SUPPORTED.includes(capability);
  }

  generateImage(input: ImageGenerationInput): Promise<Task> {
    return generateImage(this.client, input);
  }
  editImage(input: ImageEditInput): Promise<Task> {
    return editImage(this.client, input);
  }
  upscaleImage(input: ImageUpscaleInput): Promise<Task> {
    return upscaleImage(this.client, input);
  }
  generateVideo(input: VideoGenerationInput): Promise<Task> {
    return generateVideo(this.client, input);
  }
  imageToVideo(input: ImageToVideoInput): Promise<Task> {
    return imageToVideo(this.client, input);
  }
  videoToVideo(input: VideoToVideoInput): Promise<Task> {
    return videoToVideo(this.client, input);
  }

  async getTask(taskId: string): Promise<Task> {
    const record = await this.client.getTaskRecord(taskId);
    return normalizeTask(record);
  }

  /**
   * Polls recordInfo until the task settles.
   *
   * For production workloads KIE recommends a `callBackUrl` webhook instead;
   * polling is used here because a stdio MCP server has no public endpoint.
   */
  async waitForTask(
    taskId: string,
    options: { timeoutMs: number; pollIntervalMs: number; signal?: AbortSignal },
  ): Promise<Task> {
    const deadline = Date.now() + options.timeoutMs;
    let attempt = 0;
    for (;;) {
      const task = await this.getTask(taskId);
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        log.info(`Task ${task.status}: ${taskId}`);
        return task;
      }
      attempt += 1;
      if (Date.now() >= deadline) {
        throw new McpError(
          'TIMEOUT',
          `Task ${taskId} was still "${task.status}" after ${Math.round(options.timeoutMs / 1000)}s.`,
          {
            details: { task_id: taskId, status: task.status, polls: attempt },
            hint: 'The task keeps running on KIE. Call get_task later, or retry wait_for_task with a larger timeout_seconds.',
          },
        );
      }
      log.debug(`Task ${taskId} is ${task.status} (poll ${attempt})`);
      const remaining = deadline - Date.now();
      await new Promise<void>((resolveDelay, rejectDelay) => {
        const timer = setTimeout(resolveDelay, Math.min(options.pollIntervalMs, remaining));
        options.signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            rejectDelay(new McpError('TIMEOUT', `Waiting for task ${taskId} was aborted.`));
          },
          { once: true },
        );
      });
    }
  }

  async uploadFile(input: {
    path?: string;
    url?: string;
    uploadPath?: string;
  }): Promise<UploadedFile> {
    if (input.path) return uploadLocalFile(this.client, input.path, input.uploadPath);
    if (input.url) return uploadRemoteFile(this.client, input.url, input.uploadPath);
    throw new McpError('INVALID_PARAMETER', 'upload_file needs either a local path or a URL.');
  }

  /** Local path or URL -> a URL KIE can read. */
  toRemoteUrl(reference: string): Promise<string> {
    return resolveToRemoteUrl(this.client, reference);
  }

  getCredits(): Promise<number> {
    return this.client.getCredits();
  }

  /** Temporary (20 minute) download link for a KIE-generated file. */
  getDownloadUrl(url: string): Promise<string> {
    return this.client.getDownloadUrl(url);
  }
}
