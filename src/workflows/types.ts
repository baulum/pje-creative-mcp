import type { KieProvider } from '../providers/kie/index.js';

/**
 * Workflow layer.
 *
 * Workflows are multi-step creative recipes (concept -> image -> variants ->
 * video -> saved file) built on top of the provider services, never on top of
 * the MCP tools. Nothing here is registered as an MCP tool yet: the low-level
 * tools plus the kie-creative skill already let Claude drive these sequences,
 * and a premature autonomous workflow would spend credits on steps the user did
 * not ask for. The types below fix the shape so a workflow can be exposed as a
 * tool later without touching the provider or tool layers.
 */

export interface WorkflowContext {
  provider: KieProvider;
  /** Directory that finished assets are written to. */
  outputDir: string;
  /** Per-step wait budget. */
  timeoutMs: number;
}

export interface WorkflowStep {
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  task_id?: string;
  outputs?: { url: string; local_path?: string }[];
  error?: { code: string; message: string };
}

export interface WorkflowResult {
  success: boolean;
  workflow: string;
  steps: WorkflowStep[];
  final_outputs: { url: string; local_path?: string }[];
}

export interface Workflow<Input> {
  name: string;
  description: string;
  run(input: Input, context: WorkflowContext): Promise<WorkflowResult>;
}
