import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_MODELS, listModels, summarizeModel } from '../../models/registry.js';
import { guard } from '../../server/tool-helpers.js';

const CAPABILITIES = [
  'text-to-image',
  'image-to-image',
  'image-upscale',
  'background-removal',
  'text-to-video',
  'image-to-video',
  'video-to-video',
] as const;

const inputShape = {
  type: z.enum(['image', 'video']).optional().describe('Filter by output type.'),
  capability: z.enum(CAPABILITIES).optional().describe('Filter by what the model can do.'),
};

export function registerListModels(server: McpServer): void {
  server.registerTool(
    'list_models',
    {
      title: 'List available KIE models',
      description:
        'List the KIE models this server supports, with their capabilities, aspect ratios, ' +
        'resolutions, durations and reference-image support. Call this before choosing a model when ' +
        'the task has specific format requirements (a 9:16 reel, a 15-second clip, 4K output), and ' +
        'call get_model for the full parameter detail of one model.',
      inputSchema: inputShape,
    },
    guard('list_models', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const models = listModels({
        ...(args.type ? { type: args.type } : {}),
        ...(args.capability ? { capability: args.capability } : {}),
      }).map(summarizeModel);
      return {
        success: true as const,
        type: 'models',
        count: models.length,
        defaults: DEFAULT_MODELS,
        models,
      };
    }),
  );
}
