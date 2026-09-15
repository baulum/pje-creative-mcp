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
      'Source image(s): local absolute paths or public URLs. Local files are uploaded to KIE ' +
        'automatically. Several models accept multiple images (Nano Banana Edit up to 10, ' +
        'Nano Banana 2 up to 14, Flux-2 Pro up to 8, Qwen3 up to 3).',
    ),
  prompt: z
    .string()
    .min(1)
    .describe('What to change. Be concrete about what stays the same and what should change.'),
  model: z
    .string()
    .optional()
    .describe(
      `Model id. Default "${DEFAULT_MODELS['image-to-image']}". Available: ${modelsForCapability('image-to-image').join(', ')}.`,
    ),
  mask: z
    .string()
    .optional()
    .describe(
      'Mask image (local path or URL) for masked inpainting. Only ideogram/v3-edit supports masks, ' +
        'and the mask must match the source image dimensions.',
    ),
  aspect_ratio: z.string().optional().describe('Output aspect ratio, where the model supports it.'),
  resolution: z.string().optional().describe('"1K", "2K" or "4K", where the model supports it.'),
  number_of_images: z
    .number()
    .int()
    .min(1)
    .max(6)
    .optional()
    .describe('Variants per task. Seedream 4 Edit only.'),
  negative_prompt: z.string().optional().describe('What to avoid. Qwen3 only among edit models.'),
  output_format: z.string().optional().describe('"png", "jpeg" or "jpg", depending on the model.'),
  seed: z.number().int().optional().describe('Seed for reproducible output, where supported.'),
  options: commonSchemas.options.optional(),
  callback_url: commonSchemas.callbackUrl.optional(),
};

export function registerEditImage(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'edit_image',
    {
      title: 'Edit image',
      description:
        'Modify an existing image with a text instruction via KIE.ai: retouch, restyle, replace ' +
        'elements, change backgrounds, or combine several reference images into one. Use this instead ' +
        'of generate_image whenever you already have a source image, including images this server ' +
        'produced earlier. Accepts local file paths as well as URLs. Returns a queued task - follow ' +
        'up with wait_for_task, then download_result.',
      inputSchema: inputShape,
    },
    guard('edit_image', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const images = Array.isArray(args.image) ? args.image : [args.image];
      const task = await provider.editImage({
        prompt: args.prompt,
        images,
        model: args.model ?? DEFAULT_MODELS['image-to-image'],
        ...(args.mask ? { mask: args.mask } : {}),
        ...(args.aspect_ratio ? { aspect_ratio: args.aspect_ratio } : {}),
        ...(args.resolution ? { resolution: args.resolution } : {}),
        ...(args.number_of_images ? { number_of_images: args.number_of_images } : {}),
        ...(args.negative_prompt ? { negative_prompt: args.negative_prompt } : {}),
        ...(args.output_format ? { output_format: args.output_format } : {}),
        ...(args.seed !== undefined ? { seed: args.seed } : {}),
        ...(args.options ? { options: args.options } : {}),
        ...(args.callback_url ? { callback_url: args.callback_url } : {}),
      });
      return taskEnvelope(task, {
        next_step: `Call wait_for_task with task_id "${task.task_id}" to get the edited image URLs.`,
      });
    }),
  );
}
