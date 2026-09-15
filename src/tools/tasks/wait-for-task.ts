import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { taskEnvelope } from '../../utils/validation.js';
import { guard } from '../../server/tool-helpers.js';

const inputShape = {
  task_id: z.string().min(1).describe('The task_id returned by a generation tool.'),
  timeout_seconds: z
    .number()
    .int()
    .min(5)
    .max(1800)
    .default(300)
    .describe(
      'How long to wait before giving up. Images usually finish in well under 120s; videos often ' +
        'need 300-900s. Timing out does not cancel the task - call get_task later.',
    ),
  polling_interval_seconds: z
    .number()
    .min(1)
    .max(60)
    .default(5)
    .describe('Seconds between status polls.'),
};

export function registerWaitForTask(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'wait_for_task',
    {
      title: 'Wait for a task to finish',
      description:
        'Poll a KIE task until it completes or fails, then return the normalised result including ' +
        'the output URLs. This is the standard follow-up to every generation tool. KIE also supports ' +
        'webhook callbacks (callBackUrl) for production use, but a local stdio server has no public ' +
        'endpoint, so this server polls.',
      inputSchema: inputShape,
    },
    guard('wait_for_task', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const task = await provider.waitForTask(args.task_id, {
        timeoutMs: args.timeout_seconds * 1000,
        pollIntervalMs: args.polling_interval_seconds * 1000,
      });
      return taskEnvelope(task, {
        ...(task.status === 'completed' && task.results.length
          ? {
              next_step:
                'Call download_result with one of the result URLs to save the file locally. ' +
                'KIE result URLs are temporary.',
            }
          : {}),
      });
    }),
  );
}
