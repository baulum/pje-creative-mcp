import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInput } from '../src/providers/kie/payload.js';
import { getModel } from '../src/models/registry.js';
import { McpError } from '../src/utils/errors.js';


/** assert.throws does not hand back the error, so capture it directly. */
function expectError(fn: () => unknown): McpError {
  try {
    fn();
  } catch (err) {
    assert.ok(err instanceof McpError, `expected McpError, got ${String(err)}`);
    return err;
  }
  throw new assert.AssertionError({ message: 'expected the call to throw' });
}

const nanoBanana = getModel('google/nano-banana')!;
const seedream4 = getModel('bytedance/seedream-v4-text-to-image')!;
const seedream5 = getModel('seedream/5-pro-text-to-image')!;
const kling = getModel('kling/v3-turbo-text-to-video')!;
const veo = getModel('veo-3-1')!;
const nanoEdit = getModel('google/nano-banana-edit')!;

test('normalised params map onto the documented provider field names', () => {
  const input = buildInput(nanoBanana, { prompt: 'a cat', aspect_ratio: '16:9' });
  assert.deepEqual(input, { prompt: 'a cat', aspect_ratio: '16:9' });
});

test('aspect ratios are translated for models that use named size presets', () => {
  const input = buildInput(seedream4, { prompt: 'p', aspect_ratio: '16:9', resolution: '2K' });
  assert.equal(input.image_size, 'landscape_16_9');
  assert.equal(input.image_resolution, '2K');
});

test('resolution maps onto quality where the docs define that equivalence', () => {
  const input = buildInput(seedream5, { prompt: 'p', resolution: '2K' });
  assert.equal(input.quality, 'high');
});

test('model defaults are applied and can be overridden', () => {
  const withDefaults = buildInput(kling, { prompt: 'p' });
  assert.deepEqual(withDefaults, {
    prompt: 'p',
    duration: '5',
    aspect_ratio: '16:9',
    resolution: '720p',
  });
  const overridden = buildInput(kling, { prompt: 'p', duration: 12, resolution: '1080p' });
  assert.equal(overridden.duration, '12');
  assert.equal(overridden.resolution, '1080p');
});

test('unsupported normalised parameters are rejected with the supported list', () => {
  const err = expectError(() => buildInput(getModel('hailuo/02-text-to-video-pro')!, { prompt: 'p', duration: 5 }));
  assert.equal(err.code, 'UNSUPPORTED_PARAMETER');
  assert.match(err.hint ?? '', /Supported parameters/);
});

test('out-of-enum values are rejected and list what is accepted', () => {
  const err = expectError(() => buildInput(veo, { prompt: 'p', aspect_ratio: '1:1' }));
  assert.equal(err.code, 'INVALID_PARAMETER');
  assert.deepEqual(err.details?.accepted_values, ['16:9', '9:16', 'Auto']);
});

test('numeric ranges are enforced', () => {
  assert.throws(() => buildInput(kling, { prompt: 'p', duration: 30 }), McpError);
  assert.doesNotThrow(() => buildInput(kling, { prompt: 'p', duration: 15 }));
});

test('prompt length limits are enforced', () => {
  const err = expectError(() => buildInput(getModel('z-image')!, { prompt: 'x'.repeat(1001) }));
  assert.equal(err.code, 'INVALID_PARAMETER');
  assert.equal(err.details?.max_length, 1000);
});

test('image arrays respect the per-model item limit', () => {
  const err = expectError(() => buildInput(nanoEdit, { prompt: 'p', images: Array(11).fill('https://x/y.png') }));
  assert.equal(err.details?.max_items, 10);
});

test('single-image models receive a scalar, not an array', () => {
  const input = buildInput(getModel('bytedance/v1-pro-image-to-video')!, {
    prompt: 'p',
    images: ['https://x/y.png'],
  });
  assert.equal(input.image_url, 'https://x/y.png');
});

test('documented model options pass through, undocumented ones do not', () => {
  const input = buildInput(kling, { prompt: 'p' }, undefined);
  assert.equal(input.cfg_scale, undefined);

  const withOption = buildInput(
    getModel('kling/v2-5-turbo-text-to-video-pro')!,
    { prompt: 'p' },
    { cfg_scale: 0.8 },
  );
  assert.equal(withOption.cfg_scale, 0.8);

  const err = expectError(() => buildInput(nanoBanana, { prompt: 'p' }, { made_up_field: 1 }));
  assert.equal(err.code, 'UNSUPPORTED_PARAMETER');
});

test('required provider options get their documented default', () => {
  const input = buildInput(getModel('gpt-image/1.5-text-to-image')!, { prompt: 'p' });
  assert.equal(input.quality, 'medium');
  assert.equal(input.aspect_ratio, '1:1');
});

test('required parameters with no value produce a clear error', () => {
  const err = expectError(() => buildInput(getModel('topaz/image-upscale')!, {}));
  assert.equal(err.code, 'INVALID_PARAMETER');
});
