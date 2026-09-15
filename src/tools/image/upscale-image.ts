import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { DEFAULT_MODELS, modelsForCapability } from '../../models/registry.js';
import { commonSchemas, taskEnvelope } from '../../utils/validation.js';
import { guard } from '../../server/tool-helpers.js';

const UPSCALE_MODELS = [
  ...modelsForCapability('image-upscale'),
  ...modelsForCapability('background-removal'),
];

const inputShape = {
  image: z
    .string()
    .min(1)
    .describe('Image to process: local absolute path or public URL.'),
  model: z
    .string()
    .optional()
    .describe(
      `Model id. Default "${DEFAULT_MODELS['image-upscale']}". Available: ${UPSCALE_MODELS.join(', ')}. ` +
        'recraft/remove-background strips the background instead of upscaling.',
    ),
  upscale_factor: z
    .enum(['1', '2', '4'])
    .optional()
    .describe('Scale factor. topaz/image-upscale only; the Recraft models take no factor.'),
  options: commonSchemas.options.optional(),
  callback_url: commonSchemas.callbackUrl.optional(),
};

export function registerUpscaleImage(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'upscale_image',
    {
      title: 'Upscale or clean up an image',
      description:
        'Enlarge an image with topaz/image-upscale or recraft/crisp-upscale, or remove its ' +
        'background with recraft/remove-background. Use this as a finishing step after ' +
        'generate_image / edit_image when print or large-format output is needed. Returns a queued ' +
        'task - follow up with wait_for_task, then download_result.',
      inputSchema: inputShape,
    },
    guard('upscale_image', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const task = await provider.upscaleImage({
        image: args.image,
        model: args.model ?? DEFAULT_MODELS['image-upscale'],
        ...(args.upscale_factor ? { upscale_factor: args.upscale_factor } : {}),
        ...(args.options ? { options: args.options } : {}),
        ...(args.callback_url ? { callback_url: args.callback_url } : {}),
      });
      return taskEnvelope(task, {
        next_step: `Call wait_for_task with task_id "${task.task_id}".`,
      });
    }),
  );
}
