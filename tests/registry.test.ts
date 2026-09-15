import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_MODELS,
  DEFAULT_MODELS,
  describeModel,
  getModel,
  listModels,
  modelsForCapability,
  summarizeModel,
} from '../src/models/registry.js';

test('model ids are unique', () => {
  const ids = ALL_MODELS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every default model exists and has the capability it is the default for', () => {
  for (const [capability, id] of Object.entries(DEFAULT_MODELS)) {
    const model = getModel(id);
    assert.ok(model, `default model ${id} is not in the registry`);
    assert.ok(
      model.capabilities.includes(capability as never),
      `${id} is the default for ${capability} but does not declare it`,
    );
  }
});

test('every capability has at least one model', () => {
  for (const capability of Object.keys(DEFAULT_MODELS)) {
    assert.ok(modelsForCapability(capability as never).length > 0, capability);
  }
});

test('value maps only map values the model declares as accepted', () => {
  for (const model of ALL_MODELS) {
    for (const [name, spec] of Object.entries(model.params)) {
      if (!spec?.valueMap) continue;
      for (const key of Object.keys(spec.valueMap)) {
        assert.ok(
          spec.values?.includes(key),
          `${model.id}.${name}: valueMap key "${key}" is not in accepted values`,
        );
      }
    }
  }
});

test('declared defaults refer to real provider fields', () => {
  for (const model of ALL_MODELS) {
    const fields = new Set([
      ...Object.values(model.params).map((spec) => spec?.field),
      ...(model.extraFields ?? []).map((f) => f.field),
    ]);
    for (const key of Object.keys(model.defaults ?? {})) {
      assert.ok(fields.has(key), `${model.id}: default "${key}" is not a declared field`);
    }
  }
});

test('every model declares a prompt or an input asset', () => {
  for (const model of ALL_MODELS) {
    const hasInput =
      model.params.prompt ||
      model.params.images ||
      model.params.video ||
      (model.extraFields ?? []).some((f) => f.required);
    assert.ok(hasInput, `${model.id} has no usable input parameter`);
  }
});

test('summaries expose the registry facts the tools rely on', () => {
  const veo = summarizeModel(getModel('veo-3-1')!);
  assert.equal(veo.type, 'video');
  assert.deepEqual(veo.supported_durations, ['4', '6', '8']);
  assert.equal(veo.supports_image_to_video, true);

  const seedream = summarizeModel(getModel('bytedance/seedream-v4-text-to-image')!);
  assert.equal(seedream.supports_multiple_outputs, true);
  assert.equal(seedream.supports_reference_images, false);
});

test('describeModel lists the provider field each parameter maps to', () => {
  const described = describeModel(getModel('seedream/5-pro-text-to-image')!) as Record<
    string,
    Record<string, { provider_field: string }>
  >;
  assert.equal(described.parameters!.resolution!.provider_field, 'quality');
});

test('listModels filters by type and capability', () => {
  assert.ok(listModels({ type: 'video' }).every((m) => m.type === 'video'));
  assert.ok(
    listModels({ capability: 'video-to-video' }).every((m) =>
      m.capabilities.includes('video-to-video'),
    ),
  );
});
