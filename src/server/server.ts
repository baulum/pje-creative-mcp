import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { KieProvider } from '../providers/kie/index.js';
import { loadConfig, type ServerConfig } from './config.js';
import { registerGenerateImage } from '../tools/image/generate-image.js';
import { registerEditImage } from '../tools/image/edit-image.js';
import { registerUpscaleImage } from '../tools/image/upscale-image.js';
import { registerGenerateVideo } from '../tools/video/generate-video.js';
import { registerImageToVideo } from '../tools/video/image-to-video.js';
import { registerVideoToVideo } from '../tools/video/video-to-video.js';
import { registerGetTask } from '../tools/tasks/get-task.js';
import { registerWaitForTask } from '../tools/tasks/wait-for-task.js';
import { registerUploadFile } from '../tools/files/upload-file.js';
import { registerDownloadResult } from '../tools/files/download-result.js';
import { registerListModels } from '../tools/models/list-models.js';
import { registerGetModel } from '../tools/models/get-model.js';
import { registerGetCredits } from '../tools/account/get-credits.js';
import { createLogger, setLogLevel } from '../utils/logger.js';

const log = createLogger('MCP');

export const SERVER_NAME = 'pje-creative-mcp';
export const SERVER_VERSION = '0.1.0';

export interface BuildOptions {
  config?: ServerConfig;
  fetchImpl?: typeof fetch;
}

/** Builds the MCP server with every tool registered. */
export function buildServer(options: BuildOptions = {}): McpServer {
  const config = options.config ?? loadConfig();
  setLogLevel(config.logLevel);
  const provider = new KieProvider(config, options.fetchImpl);

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        'Creative generation through the KIE.ai API. Every generation tool returns a task id ' +
        'immediately; call wait_for_task to get the result URLs, then download_result to save the ' +
        'file, because KIE result URLs are temporary. Local file paths are accepted anywhere an ' +
        'image, video or audio input is expected - the server uploads them to KIE automatically. ' +
        'Model capabilities differ a lot: call list_models / get_model before using an unfamiliar ' +
        'model or an unusual aspect ratio, resolution or duration.',
    },
  );

  registerListModels(server);
  registerGetModel(server);
  registerGenerateImage(server, provider);
  registerEditImage(server, provider);
  registerUpscaleImage(server, provider);
  registerGenerateVideo(server, provider);
  registerImageToVideo(server, provider);
  registerVideoToVideo(server, provider);
  registerGetTask(server, provider);
  registerWaitForTask(server, provider);
  registerUploadFile(server, provider);
  registerDownloadResult(server, provider);
  registerGetCredits(server, provider);

  log.debug(`${SERVER_NAME} v${SERVER_VERSION} initialised`);
  return server;
}
