import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describeModel, getModel, modelIds } from '../../models/registry.js';
import { McpError } from '../../utils/errors.js';
import { guard } from '../../server/tool-helpers.js';

const inputShape = {
  model: z.string().min(1).describe('Model id, e.g. "google/nano-banana" or "veo-3-1".'),
};

export function registerGetModel(server: McpServer): void {
  server.registerTool(
    'get_model',
    {
      title: 'Get model details',
      description:
        'Return everything this server knows about one KIE model: which normalised parameters it ' +
        'accepts, the exact accepted values, which provider field each maps to, and the ' +
        'model-specific options you can pass via the `options` argument. Call this when a generation ' +
        'tool rejects a parameter, or before using an unfamiliar model.',
      inputSchema: inputShape,
    },
    guard('get_model', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const model = getModel(args.model);
      if (!model) {
        throw new McpError('INVALID_MODEL', `Unknown model "${args.model}".`, {
          details: { known_models: modelIds() },
          hint: 'Call list_models to see the supported ids.',
        });
      }
      return { success: true as const, type: 'model', model: describeModel(model) };
    }),
  );
}
