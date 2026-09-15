import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { DEFAULT_MODELS, modelsForCapability } from '../../models/registry.js';
import { commonSchemas, taskEnvelope } from '../../utils/validation.js';
import { guard } from '../../server/tool-helpers.js';

const inputShape = {
  prompt: z
    .string()
    .min(1)
    .describe(
      'Video prompt. Describe subject, action, camera movement, subject movement, environment ' +
        'movement, lighting, timing and composition - motion is what separates a video prompt from ' +
        'an image prompt.',
    ),
  model: z
    .string()
    .optional()
    .describe(
      `Model id. Default "${DEFAULT_MODELS['text-to-video']}". Available: ${modelsForCapability('text-to-video').join(', ')}.`,
    ),
  aspect_ratio: z
    .string()
    .optional()
    .describe('e.g. "16:9" or "9:16". Hailuo 02 and Wan 2.6 text-to-video have no aspect ratio parameter.'),
  resolution: z
    .string()
    .optional()
    .describe('"480p", "720p", "1080p" or "4k" depending on the model.'),
  duration: z
    .number()
    .optional()
    .describe(
      'Clip length in seconds. Ranges differ sharply: Veo 3.1 takes 4/6/8, Kling V3 Turbo 3-15, ' +
        'Seedance 1.5 Pro 4-12, PixVerse V6 1-15, Wan 2.6 5/10/15, Grok Imagine 6-30.',
    ),
  negative_prompt: z
    .string()
    .optional()
    .describe('What to avoid. Kling V2.5 Turbo Pro only among video models.'),
  seed: z.number().int().optional().describe('Seed, where supported.'),
  options: commonSchemas.options.optional(),
  callback_url: commonSchemas.callbackUrl.optional(),
};

export function registerGenerateVideo(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'generate_video',
    {
      title: 'Generate video from text',
      description:
        'Create a video from a text prompt via KIE.ai. Use this only when there is no source image; ' +
        'if you have or can generate a key frame, image_to_video gives far more control over the look. ' +
        'Video tasks take minutes, not seconds. Returns a queued task - follow up with wait_for_task ' +
        '(use a generous timeout_seconds), then download_result.',
      inputSchema: inputShape,
    },
    guard('generate_video', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const task = await provider.generateVideo({
        prompt: args.prompt,
        model: args.model ?? DEFAULT_MODELS['text-to-video'],
        ...(args.aspect_ratio ? { aspect_ratio: args.aspect_ratio } : {}),
        ...(args.resolution ? { resolution: args.resolution } : {}),
        ...(args.duration !== undefined ? { duration: args.duration } : {}),
        ...(args.negative_prompt ? { negative_prompt: args.negative_prompt } : {}),
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
