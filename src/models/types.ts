/**
 * Model registry types.
 *
 * Everything in here mirrors the KIE.ai unified job API
 * (POST /api/v1/jobs/createTask, GET /api/v1/jobs/recordInfo).
 * Field names and enum values are taken verbatim from https://docs.kie.ai.
 */

/** What a model produces. */
export type ModelType = 'image' | 'video';

/** What a model can be used for. Drives which MCP tool accepts it. */
export type Capability =
  | 'text-to-image'
  | 'image-to-image'
  | 'image-upscale'
  | 'background-removal'
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video';

/**
 * Normalised parameter names the MCP tools expose. Each model declares which of
 * these it supports and how they translate to the provider's own field names.
 */
export type NormalizedParam =
  | 'prompt'
  | 'negative_prompt'
  | 'aspect_ratio'
  | 'resolution'
  | 'duration'
  | 'number_of_images'
  | 'output_format'
  | 'seed'
  | 'images'
  | 'mask'
  | 'video'
  | 'audio'
  | 'upscale_factor';

/** How one normalised parameter maps onto the provider payload. */
export interface ParamSpec {
  /** Provider field name inside the `input` object. */
  field: string;
  /**
   * Values accepted by the MCP tool for this parameter, in normalised form.
   * Undefined means "free value within min/max".
   */
  values?: string[];
  /** Normalised value -> provider value. Identity when omitted. */
  valueMap?: Record<string, string>;
  /** How the value is encoded in the payload. */
  encode?: 'string' | 'number' | 'array';
  /** Numeric bounds (duration, seed, counts). */
  min?: number;
  max?: number;
  /** Bounds for array-valued params such as `images`. */
  minItems?: number;
  maxItems?: number;
  /** Provider default, for documentation purposes. */
  default?: string | number;
  /** The provider requires this field on every request. */
  required?: boolean;
  /** Short note surfaced in list_models / get_model. */
  note?: string;
}

/** A model-specific passthrough field that has no normalised equivalent. */
export interface ExtraFieldSpec {
  field: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'string[]';
  values?: (string | number)[];
  min?: number;
  max?: number;
  default?: string | number | boolean;
  required?: boolean;
  description: string;
}

export interface ModelDefinition {
  /** Value sent as `model` in the createTask payload. */
  id: string;
  provider: 'kie';
  /** Human-readable name from the KIE docs. */
  label: string;
  type: ModelType;
  capabilities: Capability[];
  /** Normalised parameter support. */
  params: Partial<Record<NormalizedParam, ParamSpec>>;
  /** Model-specific fields with no normalised equivalent. */
  extraFields?: ExtraFieldSpec[];
  /** Values always merged into `input` unless overridden by the caller. */
  defaults?: Record<string, string | number | boolean>;
  /** Link to the KIE documentation page this entry was derived from. */
  docs: string;
  /** Free-form guidance for model selection. */
  notes?: string;
}

export interface ModelSummary {
  id: string;
  provider: 'kie';
  label: string;
  type: ModelType;
  capabilities: Capability[];
  supported_aspect_ratios: string[] | null;
  supported_resolutions: string[] | null;
  supported_durations: string[] | null;
  supports_reference_images: boolean;
  supports_image_to_video: boolean;
  supports_negative_prompt: boolean;
  supports_multiple_outputs: boolean;
  docs: string;
}
