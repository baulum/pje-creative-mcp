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
      'Full image prompt. Write it as a scene description: subject, environment, composition, ' +
        'camera and lens, lighting, materials, atmosphere. Avoid generic "AI art" wording.',
    ),
  model: z
    .string()
    .optional()
    .describe(
      `Model id. Default "${DEFAULT_MODELS['text-to-image']}". Available: ${modelsForCapability('text-to-image').join(', ')}.`,
    ),
  aspect_ratio: z
    .string()
    .optional()
    .describe(
      'Aspect ratio, e.g. "1:1" (feed post), "9:16" (story/reel), "16:9" (YouTube/web hero), "4:5" (Instagram portrait). ' +
        'Supported values differ per model - call get_model if unsure.',
    ),
  resolution: z
    .string()
    .optional()
    .describe('Image resolution: "1K", "2K" or "4K". Not every model exposes this.'),
  number_of_images: z
    .number()
    .int()
    .min(1)
    .max(6)
    .optional()
    .describe(
      'How many images the task should return. Only the Seedream 4 models support this (1-6); ' +
        'for other models, run the tool several times instead.',
    ),
  reference_images: z
    .array(z.string())
    .optional()
    .describe(
      'Style or subject reference images, as local absolute paths or public URLs. Local files are ' +
        'uploaded to KIE automatically. Only models with supports_reference_images accept these.',
    ),
  negative_prompt: z.string().optional().describe('What to avoid. Imagen, Qwen and Ideogram only.'),
  output_format: z.string().optional().describe('"png", "jpeg" or "jpg", depending on the model.'),
  seed: z.number().int().optional().describe('Seed for reproducible output, where supported.'),
  options: commonSchemas.options.optional(),
  callback_url: commonSchemas.callbackUrl.optional(),
};

export function registerGenerateImage(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'generate_image',
    {
      title: 'Generate image',
      description:
        'Create an image from a text prompt via KIE.ai. Use this whenever a new image is needed and ' +
        'there is no existing image to modify; use edit_image instead when you have a source image. ' +
        'Returns a queued task immediately - follow up with wait_for_task (or get_task) to obtain the ' +
        'result URLs, then download_result to save them locally. Model-specific parameter support is ' +
        'documented by list_models / get_model.',
      inputSchema: inputShape,
    },
    guard('generate_image', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const task = await provider.generateImage({
        prompt: args.prompt,
        model: args.model ?? DEFAULT_MODELS['text-to-image'],
        ...(args.aspect_ratio ? { aspect_ratio: args.aspect_ratio } : {}),
        ...(args.resolution ? { resolution: args.resolution } : {}),
        ...(args.number_of_images ? { number_of_images: args.number_of_images } : {}),
        ...(args.reference_images ? { reference_images: args.reference_images } : {}),
        ...(args.negative_prompt ? { negative_prompt: args.negative_prompt } : {}),
        ...(args.output_format ? { output_format: args.output_format } : {}),
        ...(args.seed !== undefined ? { seed: args.seed } : {}),
        ...(args.options ? { options: args.options } : {}),
        ...(args.callback_url ? { callback_url: args.callback_url } : {}),
      });
      return taskEnvelope(task, {
        next_step: `Call wait_for_task with task_id "${task.task_id}" to get the image URLs.`,
      });
    }),
  );
}
