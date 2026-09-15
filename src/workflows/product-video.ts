import type { Workflow, WorkflowContext, WorkflowResult } from './types.js';

export interface ProductVideoInput {
  product_image: string;
  scene_prompt: string;
  motion_prompt: string;
  aspect_ratio: string;
  duration?: number;
}

/**
 * create_product_video: product photo -> staged scene -> animated shot.
 *
 * Placed here so the eventual implementation composes provider services
 * (editImage, imageToVideo) rather than re-implementing KIE calls.
 */
export const productVideoWorkflow: Workflow<ProductVideoInput> = {
  name: 'create_product_video',
  description:
    'Place a product photo into a staged scene with edit_image, then animate the result with ' +
    'image_to_video so the product itself stays accurate.',
  async run(input: ProductVideoInput, context: WorkflowContext): Promise<WorkflowResult> {
    void input;
    void context;
    return {
      success: false,
      workflow: this.name,
      steps: [
        { name: 'staged_scene', status: 'skipped' },
        { name: 'animation', status: 'skipped' },
        { name: 'save', status: 'skipped' },
      ],
      final_outputs: [],
    };
  },
};
