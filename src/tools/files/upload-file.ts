import { z } from 'zod';
import { resolve } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { KieProvider } from '../../providers/kie/index.js';
import { guard } from '../../server/tool-helpers.js';
import { isHttpUrl } from '../../utils/files.js';

const inputShape = {
  file: z
    .string()
    .min(1)
    .describe('Local file path or public URL of the file to place in KIE storage.'),
  upload_path: z
    .string()
    .optional()
    .describe('Folder inside KIE storage. Defaults to "pje-creative-mcp".'),
};

export function registerUploadFile(server: McpServer, provider: KieProvider): void {
  server.registerTool(
    'upload_file',
    {
      title: 'Upload a file to KIE storage',
      description:
        'Put a local file (or a remote URL) into KIE temporary storage and return a URL the KIE ' +
        'models can read. You rarely need this directly: generate_image, edit_image, image_to_video ' +
        'and video_to_video already upload local paths for you. Reach for it when you want to reuse ' +
        'one upload across several tasks. Uploaded files are deleted after 3 days and are limited to ' +
        '100 MB.',
      inputSchema: inputShape,
    },
    guard('upload_file', async (args: z.infer<z.ZodObject<typeof inputShape>>) => {
      const isUrl = isHttpUrl(args.file);
      const uploaded = await provider.uploadFile({
        ...(isUrl ? { url: args.file } : { path: resolve(args.file) }),
        ...(args.upload_path ? { uploadPath: args.upload_path } : {}),
      });
      return {
        success: true as const,
        type: 'file',
        file: uploaded,
        metadata: { provider: 'kie', source: isUrl ? 'url' : 'local' },
        next_step: 'Pass file.url to any tool that takes an image, video or audio input.',
      };
    }),
  );
}
