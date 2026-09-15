import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { DEFAULT_MODELS, modelsForCapability } from '../../models/registry.js';
import { commonSchemas, taskEnvelope } from '../../utils/validation.js';
import { guard } from '../../server/tool-helpers.js';

const inputShape = {
  image: z
    .union([z.string(), z.array(z.string()).min(1)])
    .describe(
      'Source image(s): local absolute paths or public URLs. Local files are uploaded automatically. ' +
        'Veo 3.1 reads 2 images as first and last frame; Seedance 1.5 Pro takes up to 2, PixVerse up ' +
        'to 2, Grok Imagine up to 7. Most other models take exactly one.',
    ),
  prompt: z
    .string()
    .optional()
    .describe(
      'How the image should come alive: camera movement, subject movement, environment movement, ' +
        'timing. Required by every model except grok-imagine/image-to-video.',
    ),
  model: z
    .string()
    .optional()
    .describe(
      `Model id. Default "${DEFAULT_MODELS['image-to-video']}". Available: ${modelsForCapability('image-to-video').join(', ')}.`,
    ),
  aspect_ratio: z
    .string()
    .optional()
    .describe('Only Veo 3.1, Seedance 1.5 Pro and Grok Imagine expose an aspect ratio here.'),
  resolution: z.string().optional().describe('"480p", "720p", "1080p", "768P"/"1080P" or "4k", model-dependent.'),
  duration: z.number().optional().describe('Clip length in seconds. Ranges differ per model.'),
  seed: z.number().int().optional().describe('Seed, where supported.'),
  options: commonSchemas.options.optional(),
  callback_url: commonSchemas.callbackUrl.optional(),
};

export function registerImageToVideo(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'image_to_video',
    {
      title: 'Animate an image into a video',
      description:
        'Animate an existing image via KIE.ai. This is the preferred route to a controlled video: ' +
        'generate or edit a key frame first, then animate it here, because the still fixes framing, ' +
        'styling and product accuracy that text-to-video would re-invent. Accepts local file paths as ' +
        'well as URLs. Returns a queued task - follow up with wait_for_task, then download_result.',
      inputSchema: inputShape,
    },
    guard('image_to_video', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const images = Array.isArray(args.image) ? args.image : [args.image];
      const task = await provider.imageToVideo({
        images,
        model: args.model ?? DEFAULT_MODELS['image-to-video'],
        ...(args.prompt ? { prompt: args.prompt } : {}),
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
