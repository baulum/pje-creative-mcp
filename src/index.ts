#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer, SERVER_NAME, SERVER_VERSION } from './server/server.js';
import { toMcpError } from './utils/errors.js';
import { createLogger } from './utils/logger.js';

const log = createLogger('MCP');

async function main(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info(`${SERVER_NAME} v${SERVER_VERSION} listening on stdio`);
}

main().catch((err) => {
  const error = toMcpError(err);
  // Startup failures cannot be reported over MCP, so surface them on stderr
  // where Claude Code shows them in the server log.
  process.stderr.write(`[MCP] fatal: ${error.code} - ${error.message}\n`);
  if (error.hint) process.stderr.write(`[MCP] hint: ${error.hint}\n`);
  process.exit(1);
});
