import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { guard } from '../../server/tool-helpers.js';

export function registerGetCredits(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'get_credits',
    {
      title: 'Check KIE credit balance',
      description:
        'Return the remaining credit balance on the configured KIE account. Useful before a batch ' +
        'of expensive video generations, or when a task fails with INSUFFICIENT_CREDITS.',
      inputSchema: {},
    },
    guard('get_credits', async () => {
      const credits = await provider.getCredits();
      return {
        success: true as const,
        type: 'account',
        credits,
        metadata: { provider: 'kie' },
      };
    }),
  );
}
