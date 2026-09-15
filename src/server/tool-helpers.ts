import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { toMcpError } from '../utils/errors.js';
import { errorEnvelope, type ToolEnvelope } from '../utils/validation.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('MCP');

/** Serialise a tool envelope into an MCP CallToolResult. */
export function respond(envelope: ToolEnvelope): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(envelope, null, 2) }],
    structuredContent: envelope as Record<string, unknown>,
    ...(envelope.success === false ? { isError: true } : {}),
  };
}

/**
 * Wraps a tool handler so every failure comes back as a structured error
 * envelope instead of an exception or a stack trace.
 */
export function guard<Args>(
  toolName: string,
  handler: (args: Args) => Promise<ToolEnvelope>,
): (args: Args) => Promise<CallToolResult> {
  return async (args: Args) => {
    try {
      return respond(await handler(args));
    } catch (err) {
      const mcpError = toMcpError(err);
      log.error(`${toolName} failed: ${mcpError.code} - ${mcpError.message}`);
      return respond(errorEnvelope(mcpError));
    }
  };
}
