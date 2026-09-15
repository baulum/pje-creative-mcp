import type { Workflow, WorkflowContext, WorkflowResult, WorkflowStep } from './types.js';

export interface SocialAdInput {
  /** What is being advertised. */
  concept: string;
  /** Image prompt for the key visual. */
  image_prompt: string;
  /** Motion prompt used to animate the key visual. */
  motion_prompt: string;
  /** "9:16" for stories/reels, "1:1" for feed, "16:9" for YouTube. */
  aspect_ratio: string;
  image_model?: string;
  video_model?: string;
  variants?: number;
}

/**
 * create_social_ad: key visual -> variants -> animated cut.
 *
 * Not registered as an MCP tool yet - see workflows/types.ts for why. The step
 * list is the contract the eventual tool will follow.
 */
export const socialAdWorkflow: Workflow<SocialAdInput> = {
  name: 'create_social_ad',
  description:
    'Generate a social ad: key visual with generate_image, optional variants with edit_image, ' +
    'then animate the chosen still with image_to_video and save the result.',
  async run(input: SocialAdInput, context: WorkflowContext): Promise<WorkflowResult> {
    const steps: WorkflowStep[] = [
      { name: 'key_visual', status: 'skipped' },
      { name: 'variants', status: 'skipped' },
      { name: 'animation', status: 'skipped' },
      { name: 'save', status: 'skipped' },
    ];
    void input;
    void context;
    return {
      success: false,
      workflow: this.name,
      steps,
      final_outputs: [],
    };
  },
};
