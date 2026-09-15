import { McpError } from '../../utils/errors.js';
import type { ModelDefinition, NormalizedParam, ParamSpec } from '../../models/types.js';

/** Normalised values handed to the payload builder, before provider mapping. */
export type NormalizedValues = Partial<Record<NormalizedParam, string | number | string[]>>;

function fail(model: ModelDefinition, param: string, message: string, hint?: string): never {
  throw new McpError('UNSUPPORTED_PARAMETER', `Model "${model.id}": ${message}`, {
    details: { model: model.id, parameter: param },
    ...(hint ? { hint } : {}),
  });
}

function encodeScalar(spec: ParamSpec, value: string | number): string | number {
  if (spec.encode === 'number') return typeof value === 'number' ? value : Number(value);
  if (spec.encode === 'string') return String(value);
  return value;
}

function applyValueConstraints(
  model: ModelDefinition,
  param: string,
  spec: ParamSpec,
  value: string | number,
): string | number {
  if (spec.values) {
    const asString = String(value);
    if (!spec.values.includes(asString)) {
      throw new McpError(
        'INVALID_PARAMETER',
        `Model "${model.id}" does not accept ${param}="${asString}".`,
        {
          details: { model: model.id, parameter: param, accepted_values: spec.values },
          hint: `Accepted values: ${spec.values.join(', ')}.`,
        },
      );
    }
    const mapped = spec.valueMap?.[asString];
    return mapped ?? encodeScalar(spec, asString);
  }

  if (typeof value === 'number') {
    if (spec.min !== undefined && value < spec.min) {
      throw new McpError(
        'INVALID_PARAMETER',
        `Model "${model.id}": ${param} must be >= ${spec.min} (got ${value}).`,
        { details: { model: model.id, parameter: param, min: spec.min, max: spec.max } },
      );
    }
    if (spec.max !== undefined && value > spec.max) {
      throw new McpError(
        'INVALID_PARAMETER',
        `Model "${model.id}": ${param} must be <= ${spec.max} (got ${value}).`,
        { details: { model: model.id, parameter: param, min: spec.min, max: spec.max } },
      );
    }
  }

  if (typeof value === 'string' && spec.max !== undefined && spec.encode !== 'string') {
    // `max` doubles as a character limit for text fields such as prompt.
    if (value.length > spec.max) {
      throw new McpError(
        'INVALID_PARAMETER',
        `Model "${model.id}": ${param} exceeds the ${spec.max} character limit (got ${value.length}).`,
        { details: { model: model.id, parameter: param, max_length: spec.max } },
      );
    }
  }

  return encodeScalar(spec, value);
}

function applyArray(
  model: ModelDefinition,
  param: string,
  spec: ParamSpec,
  value: string[],
): string[] | string {
  if (spec.minItems !== undefined && value.length < spec.minItems) {
    throw new McpError(
      'INVALID_PARAMETER',
      `Model "${model.id}": ${param} needs at least ${spec.minItems} item(s).`,
      { details: { model: model.id, parameter: param } },
    );
  }
  if (spec.maxItems !== undefined && value.length > spec.maxItems) {
    throw new McpError(
      'INVALID_PARAMETER',
      `Model "${model.id}": ${param} accepts at most ${spec.maxItems} item(s), got ${value.length}.`,
      { details: { model: model.id, parameter: param, max_items: spec.maxItems } },
    );
  }
  // Models with a single-value field (image_url, video_url, image) take the first entry.
  if (spec.encode === 'string') return value[0] as string;
  return value;
}

/** Validate `options` against the model's documented passthrough fields. */
function buildExtras(
  model: ModelDefinition,
  options: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!options || Object.keys(options).length === 0) return {};
  const allowed = new Map((model.extraFields ?? []).map((f) => [f.field, f]));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null) continue;
    const spec = allowed.get(key);
    if (!spec) {
      const names = [...allowed.keys()];
      fail(
        model,
        key,
        `option "${key}" is not a documented field for this model.`,
        names.length
          ? `Documented options for this model: ${names.join(', ')}. Call get_model for details.`
          : 'This model has no model-specific options.',
      );
    }
    if (spec.values && !spec.values.map(String).includes(String(value))) {
      throw new McpError(
        'INVALID_PARAMETER',
        `Model "${model.id}": option "${key}" must be one of ${spec.values.join(', ')}.`,
        { details: { model: model.id, parameter: key, accepted_values: spec.values } },
      );
    }
    if (typeof value === 'number') {
      if (spec.min !== undefined && value < spec.min) {
        throw new McpError(
          'INVALID_PARAMETER',
          `Model "${model.id}": option "${key}" must be >= ${spec.min}.`,
        );
      }
      if (spec.max !== undefined && value > spec.max) {
        throw new McpError(
          'INVALID_PARAMETER',
          `Model "${model.id}": option "${key}" must be <= ${spec.max}.`,
        );
      }
    }
    out[key] = value;
  }
  return out;
}

/**
 * Translate normalised tool arguments into the `input` object that KIE expects
 * for a specific model.
 *
 * Any normalised parameter the model does not document is rejected with an
 * explicit error rather than silently dropped, so Claude learns what the model
 * actually supports instead of getting a surprising result.
 */
export function buildInput(
  model: ModelDefinition,
  values: NormalizedValues,
  options?: Record<string, unknown>,
): Record<string, unknown> {
  const input: Record<string, unknown> = { ...(model.defaults ?? {}) };

  for (const [rawName, rawValue] of Object.entries(values)) {
    if (rawValue === undefined || rawValue === null) continue;
    if (Array.isArray(rawValue) && rawValue.length === 0) continue;
    const name = rawName as NormalizedParam;
    const spec = model.params[name];
    if (!spec) {
      const supported = Object.keys(model.params);
      fail(
        model,
        name,
        `parameter "${name}" is not supported.`,
        `Supported parameters: ${supported.join(', ')}. Call get_model("${model.id}") or pick another model with list_models.`,
      );
    }
    input[spec.field] = Array.isArray(rawValue)
      ? applyArray(model, name, spec, rawValue)
      : applyValueConstraints(model, name, spec, rawValue);
  }

  Object.assign(input, buildExtras(model, options));

  // Required provider fields that were neither supplied nor defaulted.
  for (const [name, spec] of Object.entries(model.params)) {
    if (!spec?.required) continue;
    if (input[spec.field] === undefined) {
      throw new McpError(
        'INVALID_PARAMETER',
        `Model "${model.id}" requires "${name}" (sent as "${spec.field}").`,
        { details: { model: model.id, parameter: name } },
      );
    }
  }
  for (const spec of model.extraFields ?? []) {
    if (spec.required && input[spec.field] === undefined && spec.default !== undefined) {
      input[spec.field] = spec.default;
    }
    if (spec.required && input[spec.field] === undefined) {
      throw new McpError(
        'INVALID_PARAMETER',
        `Model "${model.id}" requires the option "${spec.field}": ${spec.description}`,
        { details: { model: model.id, parameter: spec.field } },
      );
    }
  }

  return input;
}
