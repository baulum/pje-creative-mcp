import { z } from 'zod';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { guard } from '../../server/tool-helpers.js';
import { downloadToFile, resolveWithinRoot, suggestFileName } from '../../utils/files.js';
import { loadConfig } from '../../server/config.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('KIE');

const inputShape = {
  url: z.string().url().describe('Result URL from a completed task.'),
  output_path: z
    .string()
    .optional()
    .describe(
      'Where to save the file. Relative paths resolve against the output directory ' +
        '(PJE_OUTPUT_DIR, default ./output). Missing directories are created. Paths that escape the ' +
        'output directory are rejected; absolute paths must stay inside it.',
    ),
  overwrite: z
    .boolean()
    .default(false)
    .describe('Allow replacing an existing file. Off by default so results are never lost silently.'),
  refresh_url: z
    .boolean()
    .default(false)
    .describe(
      'Ask KIE for a fresh temporary download link (valid 20 minutes) before downloading. Turn this ' +
        'on if a direct download failed because the original URL expired.',
    ),
};

export function registerDownloadResult(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'download_result',
    {
      title: 'Download a result to disk',
      description:
        'Save a generated image or video from its result URL to the local filesystem. KIE result ' +
        'URLs are temporary, so download anything worth keeping as soon as the task completes. ' +
        'Creates missing directories and refuses to overwrite an existing file unless overwrite=true.',
      inputSchema: inputShape,
    },
    guard('download_result', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const config = loadConfig();
      const root = config.defaultOutputDir;
      const relative = args.output_path ?? join(suggestFileName(args.url));
      const destination = resolveWithinRoot(relative, root);

      const sourceUrl = args.refresh_url ? await provider.getDownloadUrl(args.url) : args.url;
      log.info(`Downloading result to ${destination}`);
      const result = await downloadToFile(sourceUrl, destination, { overwrite: args.overwrite });

      return {
        success: true as const,
        type: 'file',
        file: {
          path: result.path,
          size_bytes: result.size_bytes,
          mime_type: result.mime_type,
        },
        metadata: { provider: 'kie', source_url: args.url },
      };
    }),
  );
}
