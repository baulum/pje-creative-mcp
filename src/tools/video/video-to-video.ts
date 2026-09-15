import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { DEFAULT_MODELS, modelsForCapability } from '../../models/registry.js';
import { commonSchemas, taskEnvelope } from '../../utils/validation.js';
import { guard } from '../../server/tool-helpers.js';

const inputShape = {
  video: z
    .string()
    .min(1)
    .describe('Source video: local absolute path or public URL. mp4/mov/mkv.'),
  model: z
    .string()
    .optional()
    .describe(
      `Model id. Default "${DEFAULT_MODELS['video-to-video']}". Available: ${modelsForCapability('video-to-video').join(', ')}.`,
    ),
  prompt: z
    .string()
    .optional()
    .describe(
      'How the video should be transformed. Required for wan/2-6-video-to-video and ' +
        'runway/gen4-aleph; volcengine lip sync takes no prompt.',
    ),
  audio: z
    .string()
    .optional()
    .describe(
      'Audio track (local path or URL) that drives the lip movement. Required by, and only used by, ' +
        'volcengine/video-to-video-lip-sync.',
    ),
  aspect_ratio: z.string().optional().describe('runway/gen4-aleph only.'),
  resolution: z.string().optional().describe('"720p" or "1080p". Wan 2.6 only.'),
  duration: z.number().optional().describe('Output length in seconds. Wan 2.6 accepts 5 or 10.'),
  seed: z.number().int().optional().describe('Seed. runway/gen4-aleph only.'),
  options: commonSchemas.options.optional(),
  callback_url: commonSchemas.callbackUrl.optional(),
};

export function registerVideoToVideo(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'video_to_video',
    {
      title: 'Transform an existing video',
      description:
        'Transform a source video via KIE.ai: prompt-driven restyling (wan/2-6-video-to-video), ' +
        'Runway Gen-4 Aleph transformation, or audio-driven lip sync ' +
        '(volcengine/video-to-video-lip-sync, which needs an audio track and no prompt). ' +
        'Accepts local file paths as well as URLs. Returns a queued task - follow up with ' +
        'wait_for_task, then download_result.',
      inputSchema: inputShape,
    },
    guard('video_to_video', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const task = await provider.videoToVideo({
        video: args.video,
        model: args.model ?? DEFAULT_MODELS['video-to-video'],
        ...(args.prompt ? { prompt: args.prompt } : {}),
        ...(args.audio ? { audio: args.audio } : {}),
        ...(args.aspect_ratio ? { aspect_ratio: args.aspect_ratio } : {}),
        ...(args.resolution ? { resolution: args.resolution } : {}),
        ...(args.duration !== undefined ? { duration: args.duration } : {}),
        ...(args.seed !== undefined ? { seed: args.seed } : {}),
        ...(args.options ? { options: args.options } : {}),
        ...(args.callback_url ? { callback_url: args.callback_url } : {}),
      });
      return taskEnvelope(task, {
        next_step: `Call wait_for_task with task_id "${task.task_id}" and timeout_seconds around 600.`,
      });
    }),
  );
}
