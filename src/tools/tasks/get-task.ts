import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { taskEnvelope } from '../../utils/validation.js';
import { guard } from '../../server/tool-helpers.js';

const inputShape = {
  task_id: z.string().min(1).describe('The task_id returned by a generation tool.'),
};

export function registerGetTask(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'get_task',
    {
      title: 'Get task status',
      description:
        'Read the current state of a KIE task without blocking. Status is normalised to queued, ' +
        'processing, completed, failed or cancelled. Completed tasks include the result URLs. ' +
        'Use this for a single quick check; use wait_for_task when you actually want the result.',
      inputSchema: inputShape,
    },
    guard('get_task', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const task = await provider.getTask(args.task_id);
      return taskEnvelope(task);
    }),
  );
}
