import type { Workflow, WorkflowContext, WorkflowResult } from './types.js';

export interface CinematicVideoInput {
  shot_prompts: string[];
  aspect_ratio: string;
  resolution?: string;
  model?: string;
}

/**
 * cinematic_video: a sequence of prompted shots rendered with a consistent look.
 */
export const cinematicVideoWorkflow: Workflow<CinematicVideoInput> = {
  name: 'cinematic_video',
  description:
    'Render a shot list as a set of clips with consistent framing, lighting and camera language, ' +
    'then save each clip for editing.',
  async run(input: CinematicVideoInput, context: WorkflowContext): Promise<WorkflowResult> {
    void input;
    void context;
    return {
      success: false,
      workflow: this.name,
      steps: input.shot_prompts.map((_, index) => ({
        name: `shot_${index + 1}`,
        status: 'skipped' as const,
      })),
      final_outputs: [],
    };
  },
};
