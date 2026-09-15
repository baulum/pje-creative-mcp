import { IMAGE_MODELS } from './image-models.js';
import { VIDEO_MODELS } from './video-models.js';
import type {
  Capability,
  ModelDefinition,
  ModelSummary,
  ModelType,
  NormalizedParam,
} from './types.js';

const ALL_MODELS: ModelDefinition[] = [...IMAGE_MODELS, ...VIDEO_MODELS];

const BY_ID = new Map<string, ModelDefinition>(ALL_MODELS.map((m) => [m.id, m]));

/** Default model per capability, used when a tool call omits `model`. */
export const DEFAULT_MODELS: Record<Capability, string> = {
  'text-to-image': 'google/nano-banana',
  'image-to-image': 'google/nano-banana-edit',
  'image-upscale': 'topaz/image-upscale',
  'background-removal': 'recraft/remove-background',
  'text-to-video': 'kling/v3-turbo-text-to-video',
  'image-to-video': 'kling/v3-turbo-image-to-video',
  'video-to-video': 'wan/2-6-video-to-video',
};

export function listModels(filter?: {
  type?: ModelType;
  capability?: Capability;
}): ModelDefinition[] {
  return ALL_MODELS.filter((m) => {
    if (filter?.type && m.type !== filter.type) return false;
    if (filter?.capability && !m.capabilities.includes(filter.capability)) return false;
    return true;
  });
}

export function getModel(id: string): ModelDefinition | undefined {
  return BY_ID.get(id);
}

export function modelIds(): string[] {
  return [...BY_ID.keys()];
}

export function modelsForCapability(capability: Capability): string[] {
  return listModels({ capability }).map((m) => m.id);
}

/** Does this model accept the given normalised parameter? */
export function supportsParam(model: ModelDefinition, param: NormalizedParam): boolean {
  return Boolean(model.params[param]);
}

function durationValues(model: ModelDefinition): string[] | null {
  const spec = model.params.duration;
  if (!spec) return null;
  if (spec.values) return spec.values;
  if (spec.min !== undefined && spec.max !== undefined) return [`${spec.min}-${spec.max}`];
  return null;
}

export function summarizeModel(model: ModelDefinition): ModelSummary {
  return {
    id: model.id,
    provider: model.provider,
    label: model.label,
    type: model.type,
    capabilities: model.capabilities,
    supported_aspect_ratios: model.params.aspect_ratio?.values ?? null,
    supported_resolutions: model.params.resolution?.values ?? null,
    supported_durations: durationValues(model),
    supports_reference_images: Boolean(model.params.images),
    supports_image_to_video: model.capabilities.includes('image-to-video'),
    supports_negative_prompt: Boolean(model.params.negative_prompt),
    supports_multiple_outputs: Boolean(model.params.number_of_images),
    docs: model.docs,
  };
}

/** Full, human-readable description of a model including passthrough options. */
export function describeModel(model: ModelDefinition): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(model.params)) {
    if (!spec) continue;
    params[name] = {
      provider_field: spec.field,
      accepted_values: spec.values ?? null,
      range:
        spec.min !== undefined || spec.max !== undefined
          ? { min: spec.min ?? null, max: spec.max ?? null }
          : null,
      max_items: spec.maxItems ?? null,
      required: Boolean(spec.required),
      default: spec.default ?? null,
      note: spec.note ?? null,
    };
  }
  return {
    ...summarizeModel(model),
    notes: model.notes ?? null,
    parameters: params,
    options: (model.extraFields ?? []).map((f) => ({
      name: f.field,
      type: f.type,
      accepted_values: f.values ?? null,
      default: f.default ?? null,
      required: Boolean(f.required),
      description: f.description,
    })),
  };
}

export { ALL_MODELS };
export type { ModelDefinition, ModelSummary, Capability, ModelType, NormalizedParam };
