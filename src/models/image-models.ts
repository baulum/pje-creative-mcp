import type { ModelDefinition } from './types.js';

const NSFW_CHECKER = {
  field: 'nsfw_checker',
  type: 'boolean' as const,
  description:
    'KIE content filtering. Defaults to false on the API side, which returns all results directly.',
};

/**
 * Seedream 4 / Ideogram v3 express the aspect ratio as a named size preset.
 * Mapping taken from the enum documentation on each model page.
 */
const SEEDREAM_V4_SIZE: Record<string, string> = {
  '1:1': 'square_hd',
  '3:4': 'portrait_4_3',
  '2:3': 'portrait_3_2',
  '9:16': 'portrait_16_9',
  '4:3': 'landscape_4_3',
  '3:2': 'landscape_3_2',
  '16:9': 'landscape_16_9',
  '21:9': 'landscape_21_9',
};

const IDEOGRAM_V3_SIZE: Record<string, string> = {
  '1:1': 'square_hd',
  '3:4': 'portrait_4_3',
  '9:16': 'portrait_16_9',
  '4:3': 'landscape_4_3',
  '16:9': 'landscape_16_9',
};

const NANO_BANANA_RATIOS = [
  '1:1',
  '9:16',
  '16:9',
  '3:4',
  '4:3',
  '3:2',
  '2:3',
  '5:4',
  '4:5',
  '21:9',
  'auto',
];

const NANO_BANANA_2_RATIOS = [
  '1:1',
  '2:3',
  '3:2',
  '1:4',
  '4:1',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '1:8',
  '8:1',
  '9:16',
  '16:9',
  '21:9',
  'auto',
];

export const IMAGE_MODELS: ModelDefinition[] = [
  // ---------------------------------------------------------------- Google --
  {
    id: 'google/nano-banana',
    provider: 'kie',
    label: 'Google - Nano Banana',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/google/nano-banana',
    notes:
      'Fast, reliable general-purpose text-to-image. Good default for social and concept work.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: { field: 'aspect_ratio', values: NANO_BANANA_RATIOS, default: '1:1' },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
    },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'google/nano-banana-edit',
    provider: 'kie',
    label: 'Google - Nano Banana Edit',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/google/nano-banana-edit',
    notes: 'Prompt-driven editing of up to 10 input images.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1, maxItems: 10 },
      aspect_ratio: { field: 'aspect_ratio', values: NANO_BANANA_RATIOS, default: '1:1' },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
    },
  },
  {
    id: 'nano-banana-2',
    provider: 'kie',
    label: 'Google - Nano Banana 2',
    type: 'image',
    capabilities: ['text-to-image', 'image-to-image'],
    docs: 'https://docs.kie.ai/market/google/nanobanana2',
    notes:
      'Highest-detail Nano Banana tier: up to 4K output and up to 14 reference images. Use for hero and product imagery.',
    params: {
      prompt: { field: 'prompt', required: true, max: 20000 },
      images: { field: 'image_input', encode: 'array', maxItems: 14 },
      aspect_ratio: { field: 'aspect_ratio', values: NANO_BANANA_2_RATIOS, default: 'auto' },
      resolution: { field: 'resolution', values: ['1K', '2K', '4K'], default: '1K' },
      output_format: { field: 'output_format', values: ['png', 'jpg'], default: 'jpg' },
    },
  },
  {
    id: 'nano-banana-2-lite',
    provider: 'kie',
    label: 'Google - Nano Banana 2 Lite',
    type: 'image',
    capabilities: ['text-to-image', 'image-to-image'],
    docs: 'https://docs.kie.ai/market/google/nano-banana-2-lite',
    notes: 'Cheaper Nano Banana 2 tier. Up to 10 reference images, no resolution control.',
    params: {
      prompt: { field: 'prompt', required: true, max: 20000 },
      images: { field: 'image_urls', encode: 'array', maxItems: 10 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: NANO_BANANA_2_RATIOS,
        default: 'auto',
        required: true,
      },
    },
    defaults: { aspect_ratio: 'auto' },
  },
  {
    id: 'nano-banana-pro',
    provider: 'kie',
    label: 'Google - Nano Banana Pro',
    type: 'image',
    capabilities: ['text-to-image', 'image-to-image'],
    docs: 'https://docs.kie.ai/market/google/pro-image-to-image',
    notes: 'Pro tier with up to 8 reference images and 4K output.',
    params: {
      prompt: { field: 'prompt', required: true, max: 10000 },
      images: { field: 'image_input', encode: 'array', maxItems: 8 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', 'auto'],
        default: '1:1',
      },
      resolution: { field: 'resolution', values: ['1K', '2K', '4K'], default: '1K' },
      output_format: { field: 'output_format', values: ['png', 'jpg'], default: 'png' },
    },
  },
  {
    id: 'google/imagen4',
    provider: 'kie',
    label: 'Google - Imagen 4',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/google/imagen4',
    notes: 'Photoreal text-to-image with negative prompt support. No reference images.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '16:9', '9:16', '3:4', '4:3', 'auto'],
        default: '1:1',
      },
      seed: { field: 'seed', encode: 'string' },
    },
  },
  {
    id: 'google/imagen4-fast',
    provider: 'kie',
    label: 'Google - Imagen 4 Fast',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/google/imagen4-fast',
    notes: 'Fast Imagen 4 tier for drafts and variation sweeps.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '16:9', '9:16', '3:4', '4:3', 'auto'],
        default: '16:9',
      },
      seed: { field: 'seed', encode: 'number' },
    },
  },
  {
    id: 'google/imagen4-ultra',
    provider: 'kie',
    label: 'Google - Imagen 4 Ultra',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/google/imagen4-ultra',
    notes: 'Highest-fidelity Imagen 4 tier.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '16:9', '9:16', '3:4', '4:3', 'auto'],
        default: '1:1',
      },
      seed: { field: 'seed', encode: 'string' },
    },
  },

  // ------------------------------------------------------------- Bytedance --
  {
    id: 'bytedance/seedream-v4-text-to-image',
    provider: 'kie',
    label: 'Seedream 4.0 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/seedream/seedream-v4-text-to-image',
    notes:
      'Strong commercial/product look. The only image model here that returns up to 6 images from one task.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'image_size',
        values: Object.keys(SEEDREAM_V4_SIZE),
        valueMap: SEEDREAM_V4_SIZE,
        default: '1:1',
      },
      resolution: { field: 'image_resolution', values: ['1K', '2K', '4K'], default: '1K' },
      number_of_images: { field: 'max_images', encode: 'number', min: 1, max: 6, default: 1 },
      seed: { field: 'seed', encode: 'number' },
    },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'bytedance/seedream-v4-edit',
    provider: 'kie',
    label: 'Seedream 4.0 - Edit',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/seedream/seedream-v4-edit',
    notes: 'Edits up to 10 input images and can return up to 6 variants per task.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1, maxItems: 10 },
      aspect_ratio: {
        field: 'image_size',
        values: Object.keys(SEEDREAM_V4_SIZE),
        valueMap: SEEDREAM_V4_SIZE,
        default: '1:1',
      },
      resolution: { field: 'image_resolution', values: ['1K', '2K', '4K'], default: '1K' },
      number_of_images: { field: 'max_images', encode: 'number', min: 1, max: 6, default: 1 },
      seed: { field: 'seed', encode: 'number' },
    },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'seedream/5-pro-text-to-image',
    provider: 'kie',
    label: 'Seedream 5.0 Pro - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/seedream/5-pro-text-to-image',
    notes: 'Seedream 5 quality tier. `basic` renders 1K, `high` renders 2K.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
        default: '1:1',
        required: true,
      },
      resolution: {
        field: 'quality',
        values: ['1K', '2K'],
        valueMap: { '1K': 'basic', '2K': 'high' },
        default: '1K',
        required: true,
        note: 'Sent as `quality`: 1K -> basic, 2K -> high.',
      },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
    },
    defaults: { aspect_ratio: '1:1', quality: 'basic' },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'seedream/5-pro-image-to-image',
    provider: 'kie',
    label: 'Seedream 5.0 Pro - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/seedream/5-pro-image-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
        default: '1:1',
        required: true,
      },
      resolution: {
        field: 'quality',
        values: ['1K', '2K'],
        valueMap: { '1K': 'basic', '2K': 'high' },
        default: '1K',
        required: true,
        note: 'Sent as `quality`: 1K -> basic, 2K -> high.',
      },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
    },
    defaults: { aspect_ratio: '1:1', quality: 'basic' },
    extraFields: [NSFW_CHECKER],
  },

  // ------------------------------------------------------------------ Flux --
  {
    id: 'flux-2/pro-text-to-image',
    provider: 'kie',
    label: 'Flux-2 Pro - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/flux2/pro-text-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'],
        default: '1:1',
        required: true,
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K', required: true },
    },
    defaults: { aspect_ratio: '1:1', resolution: '1K' },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'flux-2/pro-image-to-image',
    provider: 'kie',
    label: 'Flux-2 Pro - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/flux2/pro-image-to-image',
    notes: 'Accepts 1-8 reference images; `auto` matches the first input image ratio.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'input_urls', encode: 'array', required: true, minItems: 1, maxItems: 8 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', 'auto'],
        default: '1:1',
        required: true,
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K', required: true },
    },
    defaults: { aspect_ratio: 'auto', resolution: '1K' },
    extraFields: [NSFW_CHECKER],
  },

  // -------------------------------------------------------------- GPT Image --
  {
    id: 'gpt-image/1.5-text-to-image',
    provider: 'kie',
    label: 'GPT Image-1.5 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/gpt-image/1-5-text-to-image',
    notes: 'Strong at text rendering inside images. Only 1:1, 2:3 and 3:2 are available.',
    params: {
      prompt: { field: 'prompt', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2'],
        default: '1:1',
        required: true,
      },
    },
    defaults: { aspect_ratio: '1:1', quality: 'medium' },
    extraFields: [
      {
        field: 'quality',
        type: 'string',
        values: ['medium', 'high'],
        default: 'medium',
        required: true,
        description: 'Render quality: medium is balanced, high is slower and more detailed.',
      },
    ],
  },
  {
    id: 'gpt-image/1.5-image-to-image',
    provider: 'kie',
    label: 'GPT Image-1.5 - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/gpt-image/1-5-image-to-image',
    params: {
      prompt: { field: 'prompt', required: true },
      images: { field: 'input_urls', encode: 'array', required: true, minItems: 1 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2'],
        default: '3:2',
        required: true,
      },
    },
    defaults: { aspect_ratio: '3:2', quality: 'medium' },
    extraFields: [
      {
        field: 'quality',
        type: 'string',
        values: ['medium', 'high'],
        default: 'medium',
        required: true,
        description: 'Render quality: medium is balanced, high is slower and more detailed.',
      },
    ],
  },

  // ------------------------------------------------------------------ Qwen --
  {
    id: 'qwen3/text-to-image',
    provider: 'kie',
    label: 'Qwen3 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/qwen3/text-to-image',
    notes: 'Handles Chinese and English prompts. Built-in prompt rewriting via prompt_extend.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      aspect_ratio: {
        field: 'image_size',
        values: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['1K', '2K'] },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
    extraFields: [
      {
        field: 'prompt_extend',
        type: 'boolean',
        default: true,
        description: 'Intelligent prompt rewriting. Recommended on.',
      },
      NSFW_CHECKER,
    ],
  },
  {
    id: 'qwen3/image-to-image',
    provider: 'kie',
    label: 'Qwen3 - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/qwen3/image-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1, maxItems: 3 },
      aspect_ratio: {
        field: 'image_size',
        values: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K' },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
    extraFields: [
      {
        field: 'prompt_extend',
        type: 'boolean',
        default: true,
        description: 'Intelligent prompt rewriting. Recommended on.',
      },
      NSFW_CHECKER,
    ],
  },

  // -------------------------------------------------------------- Ideogram --
  {
    id: 'ideogram/v3-text-to-image',
    provider: 'kie',
    label: 'Ideogram V3 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/ideogram/v3-text-to-image',
    notes: 'Typography and graphic-design oriented. `style` picks the look.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      aspect_ratio: {
        field: 'image_size',
        values: Object.keys(IDEOGRAM_V3_SIZE),
        valueMap: IDEOGRAM_V3_SIZE,
      },
      seed: { field: 'seed', encode: 'number' },
    },
    extraFields: [
      {
        field: 'rendering_speed',
        type: 'string',
        values: ['TURBO', 'BALANCED', 'QUALITY'],
        description: 'Rendering speed / quality trade-off.',
      },
      {
        field: 'style',
        type: 'string',
        values: ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN'],
        description: 'Style preset.',
      },
      {
        field: 'expand_prompt',
        type: 'boolean',
        description: 'Use Ideogram MagicPrompt to enhance the request.',
      },
    ],
  },
  {
    id: 'ideogram/v3-edit',
    provider: 'kie',
    label: 'Ideogram V3 - Edit (inpainting)',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/ideogram/v3-edit',
    notes:
      'Masked inpainting. Requires both an image and a mask of identical dimensions - this is the only model here that takes a mask.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true, minItems: 1, maxItems: 1 },
      mask: { field: 'mask_url', encode: 'string', required: true },
      seed: { field: 'seed', encode: 'number' },
    },
    extraFields: [
      {
        field: 'rendering_speed',
        type: 'string',
        values: ['TURBO', 'BALANCED', 'QUALITY'],
        default: 'BALANCED',
        description: 'Rendering speed / quality trade-off.',
      },
      {
        field: 'expand_prompt',
        type: 'boolean',
        default: true,
        description: 'Use Ideogram MagicPrompt to enhance the request.',
      },
    ],
  },

  // --------------------------------------------------------------- Z-Image --
  {
    id: 'z-image',
    provider: 'kie',
    label: 'Z-Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/z-image/z-image',
    notes: 'Lightweight stylised generator. Prompt limit is only 1000 characters.',
    params: {
      prompt: { field: 'prompt', required: true, max: 1000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
    defaults: { aspect_ratio: '1:1' },
    extraFields: [NSFW_CHECKER],
  },

  // ----------------------------------------------------- Upscale / cleanup --
  {
    id: 'topaz/image-upscale',
    provider: 'kie',
    label: 'Topaz - Image Upscale',
    type: 'image',
    capabilities: ['image-upscale'],
    docs: 'https://docs.kie.ai/market/topaz/image-upscale',
    notes: 'Detail-preserving upscaler. Accepts jpeg/png/webp up to 10 MB.',
    params: {
      images: { field: 'image_url', encode: 'string', required: true, minItems: 1, maxItems: 1 },
      upscale_factor: {
        field: 'upscale_factor',
        values: ['1', '2', '4'],
        default: '2',
        required: true,
      },
    },
  },
  {
    id: 'recraft/crisp-upscale',
    provider: 'kie',
    label: 'Recraft - Crisp Upscale',
    type: 'image',
    capabilities: ['image-upscale'],
    docs: 'https://docs.kie.ai/market/recraft/crisp-upscale',
    notes: 'Sharpening-oriented upscale with no scale factor parameter.',
    params: {
      images: { field: 'image', encode: 'string', required: true, minItems: 1, maxItems: 1 },
    },
  },
  {
    id: 'recraft/remove-background',
    provider: 'kie',
    label: 'Recraft - Remove Background',
    type: 'image',
    capabilities: ['background-removal'],
    docs: 'https://docs.kie.ai/market/recraft/remove-background',
    notes: 'PNG/JPG/WEBP, max 5 MB, max 16 MP, 256-4096 px per side.',
    params: {
      images: { field: 'image', encode: 'string', required: true, minItems: 1, maxItems: 1 },
    },
  },

  // -------------------------------------------------------- Seedream 4.5 --
  {
    id: 'seedream/4-5-text-to-image',
    provider: 'kie',
    label: 'Seedream 4.5 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/seedream/4-5-text-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'image_size',
        values: Object.keys(SEEDREAM_V4_SIZE),
        valueMap: SEEDREAM_V4_SIZE,
        default: '1:1',
      },
      resolution: { field: 'image_resolution', values: ['1K', '2K', '4K'], default: '1K' },
      seed: { field: 'seed', encode: 'number' },
    },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'seedream/4-5-edit',
    provider: 'kie',
    label: 'Seedream 4.5 - Edit',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/seedream/4-5-edit',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1, maxItems: 10 },
      aspect_ratio: {
        field: 'image_size',
        values: Object.keys(SEEDREAM_V4_SIZE),
        valueMap: SEEDREAM_V4_SIZE,
        default: '1:1',
      },
      resolution: { field: 'image_resolution', values: ['1K', '2K', '4K'], default: '1K' },
      seed: { field: 'seed', encode: 'number' },
    },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'seedream/5-pro-layer-decomposition',
    provider: 'kie',
    label: 'Seedream 5.0 Pro - Layer Decomposition',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/seedream/5-pro-layer-decomposition',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
        default: '1:1',
        required: true,
      },
      resolution: {
        field: 'quality',
        values: ['1K', '2K'],
        valueMap: { '1K': 'basic', '2K': 'high' },
        default: '1K',
        required: true,
      },
    },
    extraFields: [NSFW_CHECKER],
  },

  // --------------------------------------------------------- Grok Imagine 2.0 --
  {
    id: 'grok-imagine-image-2-0/text-to-image',
    provider: 'kie',
    label: 'Grok Imagine Image 2.0 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/grok-imagine-image-2-0/text-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },
  {
    id: 'grok-imagine-image-2-0/image-to-image',
    provider: 'kie',
    label: 'Grok Imagine Image 2.0 - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/grok-imagine-image-2-0/image-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },
  {
    id: 'grok-imagine-image-2-0/segment-map',
    provider: 'kie',
    label: 'Grok Imagine Image 2.0 - Segment Map',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/grok-imagine-image-2-0/segment-map',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },
  {
    id: 'grok-imagine-image-2-0/image-edit',
    provider: 'kie',
    label: 'Grok Imagine Image 2.0 - Image Edit',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/grok-imagine-image-2-0/image-edit',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },

  // -------------------------------------------------------------- GPT Image 2.0 --
  {
    id: 'gpt-image-2-text-to-image',
    provider: 'kie',
    label: 'GPT Image 2.0 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/gpt/gpt-image-2-text-to-image',
    params: {
      prompt: { field: 'prompt', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },
  {
    id: 'gpt-image-2-image-to-image',
    provider: 'kie',
    label: 'GPT Image 2.0 - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/gpt/gpt-image-2-image-to-image',
    params: {
      prompt: { field: 'prompt', required: true },
      images: { field: 'input_urls', encode: 'array', required: true, minItems: 1 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },

  // -------------------------------------------------------- GPT Image 2.5 Flare --
  {
    id: 'gpt-image-2-5-flare-text-to-image',
    provider: 'kie',
    label: 'GPT Image 2.5 Flare - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/gpt/gpt-image-2-5-flare-text-to-image',
    params: {
      prompt: { field: 'prompt', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },
  {
    id: 'gpt-image-2-5-flare-image-to-image',
    provider: 'kie',
    label: 'GPT Image 2.5 Flare - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/gpt/gpt-image-2-5-flare-image-to-image',
    params: {
      prompt: { field: 'prompt', required: true },
      images: { field: 'input_urls', encode: 'array', required: true, minItems: 1 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },

  // ------------------------------------------------------- GPT Image 2.5 Sunburst --
  {
    id: 'gpt-image-2-5-sunburst-text-to-image',
    provider: 'kie',
    label: 'GPT Image 2.5 Sunburst - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/gpt/gpt-image-2-5-sunburst-text-to-image',
    params: {
      prompt: { field: 'prompt', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },
  {
    id: 'gpt-image-2-5-sunburst-image-to-image',
    provider: 'kie',
    label: 'GPT Image 2.5 Sunburst - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/gpt/gpt-image-2-5-sunburst-image-to-image',
    params: {
      prompt: { field: 'prompt', required: true },
      images: { field: 'input_urls', encode: 'array', required: true, minItems: 1 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '2:3', '3:2', '16:9', '9:16'],
        default: '1:1',
        required: true,
      },
    },
  },

  // ------------------------------------------------- Ideogram Character Models --
  {
    id: 'ideogram/character',
    provider: 'kie',
    label: 'Ideogram - Character',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/ideogram/character',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
    },
  },
  {
    id: 'ideogram/character-edit',
    provider: 'kie',
    label: 'Ideogram - Character Edit',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/ideogram/character-edit',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true },
    },
  },
  {
    id: 'ideogram/character-remix',
    provider: 'kie',
    label: 'Ideogram - Character Remix',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/ideogram/character-remix',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true },
    },
  },
  {
    id: 'ideogram/v3-remix',
    provider: 'kie',
    label: 'Ideogram V3 - Remix',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/ideogram/v3-remix',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true },
      aspect_ratio: {
        field: 'image_size',
        values: Object.keys(IDEOGRAM_V3_SIZE),
        valueMap: IDEOGRAM_V3_SIZE,
      },
      seed: { field: 'seed', encode: 'number' },
    },
  },

  // ------------------------------------------------------------ Qwen2 Models --
  {
    id: 'qwen2/text-to-image',
    provider: 'kie',
    label: 'Qwen2 - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/qwen2/text-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      aspect_ratio: {
        field: 'image_size',
        values: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K' },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
  },
  {
    id: 'qwen2/image-edit',
    provider: 'kie',
    label: 'Qwen2 - Image Edit',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/qwen2/image-edit',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1, maxItems: 3 },
      aspect_ratio: {
        field: 'image_size',
        values: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K' },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
  },

  // ---------------------------------------------------------- Qwen3 Pro Models --
  {
    id: 'qwen3-pro/text-to-image',
    provider: 'kie',
    label: 'Qwen3 Pro - Text to Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/qwen3-pro/text-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      aspect_ratio: {
        field: 'image_size',
        values: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K' },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
  },
  {
    id: 'qwen3-pro/image-to-image',
    provider: 'kie',
    label: 'Qwen3 Pro - Image to Image',
    type: 'image',
    capabilities: ['image-to-image'],
    docs: 'https://docs.kie.ai/market/qwen3-pro/image-to-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      negative_prompt: { field: 'negative_prompt', max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1, maxItems: 3 },
      aspect_ratio: {
        field: 'image_size',
        values: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K' },
      output_format: { field: 'output_format', values: ['png', 'jpeg'], default: 'png' },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
  },

  // ------------------------------------------------------------- Wan Models --
  {
    id: 'wan/2-7-image',
    provider: 'kie',
    label: 'Wan 2.7 - Image',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/wan/2-7-image',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'],
        default: '1:1',
        required: true,
      },
    },
  },
  {
    id: 'wan/2-7-image-pro',
    provider: 'kie',
    label: 'Wan 2.7 - Image Pro',
    type: 'image',
    capabilities: ['text-to-image'],
    docs: 'https://docs.kie.ai/market/wan/2-7-image-pro',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'],
        default: '1:1',
        required: true,
      },
      resolution: { field: 'resolution', values: ['1K', '2K'], default: '1K' },
    },
  },
];
