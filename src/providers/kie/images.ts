import type { KieClient } from './client.js';
import { buildInput, type NormalizedValues } from './payload.js';
import { resolveAllToRemoteUrls, resolveToRemoteUrl } from './files.js';
import { normalizeTask } from './tasks.js';
import { getModel } from '../../models/registry.js';
import { McpError } from '../../utils/errors.js';
import type {
  ImageEditInput,
  ImageGenerationInput,
  ImageUpscaleInput,
  Task,
} from '../provider.js';
import type { Capability, ModelDefinition } from '../../models/types.js';
import { modelsForCapability } from '../../models/registry.js';

export function requireModel(id: string, capability: Capability): ModelDefinition {
  const model = getModel(id);
  if (!model) {
    throw new McpError('INVALID_MODEL', `Unknown model "${id}".`, {
      details: { known_models: modelsForCapability(capability) },
      hint: `Models for ${capability}: ${modelsForCapability(capability).join(', ')}. Use list_models to see everything.`,
    });
  }
  if (!model.capabilities.includes(capability)) {
    throw new McpError(
      'INVALID_MODEL',
      `Model "${id}" does not support ${capability} (it supports: ${model.capabilities.join(', ')}).`,
      {
        details: { model: id, capability, alternatives: modelsForCapability(capability) },
        hint: `Try one of: ${modelsForCapability(capability).join(', ')}.`,
      },
    );
  }
  return model;
}

async function submit(
  client: KieClient,
  model: ModelDefinition,
  values: NormalizedValues,
  options: Record<string, unknown> | undefined,
  callbackUrl: string | undefined,
): Promise<Task> {
  const input = buildInput(model, values, options);
  const { taskId } = await client.createTask({
    model: model.id,
    input,
    ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
  });
  return {
    task_id: taskId,
    status: 'queued',
    type: model.type,
    model: model.id,
    provider: 'kie',
    results: [],
  };
}

export async function generateImage(
  client: KieClient,
  input: ImageGenerationInput,
): Promise<Task> {
  const model = requireModel(input.model, 'text-to-image');
  const values: NormalizedValues = { prompt: input.prompt };
  if (input.aspect_ratio) values.aspect_ratio = input.aspect_ratio;
  if (input.resolution) values.resolution = input.resolution;
  if (input.negative_prompt) values.negative_prompt = input.negative_prompt;
  if (input.output_format) values.output_format = input.output_format;
  if (input.seed !== undefined) values.seed = input.seed;
  if (input.number_of_images !== undefined) values.number_of_images = input.number_of_images;
  if (input.reference_images?.length) {
    values.images = await resolveAllToRemoteUrls(client, input.reference_images);
  }
  return submit(client, model, values, input.options, input.callback_url);
}

export async function editImage(client: KieClient, input: ImageEditInput): Promise<Task> {
  const model = requireModel(input.model, 'image-to-image');
  const values: NormalizedValues = {
    prompt: input.prompt,
    images: await resolveAllToRemoteUrls(client, input.images),
  };
  if (input.mask) values.mask = await resolveToRemoteUrl(client, input.mask);
  if (input.aspect_ratio) values.aspect_ratio = input.aspect_ratio;
  if (input.resolution) values.resolution = input.resolution;
  if (input.negative_prompt) values.negative_prompt = input.negative_prompt;
  if (input.output_format) values.output_format = input.output_format;
  if (input.seed !== undefined) values.seed = input.seed;
  if (input.number_of_images !== undefined) values.number_of_images = input.number_of_images;
  return submit(client, model, values, input.options, input.callback_url);
}

export async function upscaleImage(client: KieClient, input: ImageUpscaleInput): Promise<Task> {
  const model = getModel(input.model);
  if (!model) {
    throw new McpError('INVALID_MODEL', `Unknown model "${input.model}".`, {
      hint: `Available: ${[...modelsForCapability('image-upscale'), ...modelsForCapability('background-removal')].join(', ')}.`,
    });
  }
  const capability: Capability = model.capabilities.includes('image-upscale')
    ? 'image-upscale'
    : 'background-removal';
  requireModel(input.model, capability);

  const values: NormalizedValues = {
    images: [await resolveToRemoteUrl(client, input.image)],
  };
  if (input.upscale_factor) values.upscale_factor = input.upscale_factor;
  return submit(client, model, values, input.options, input.callback_url);
}

export { submit as submitTask };
