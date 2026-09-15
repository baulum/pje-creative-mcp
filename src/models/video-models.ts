import type { ModelDefinition } from './types.js';

const NSFW_CHECKER = {
  field: 'nsfw_checker',
  type: 'boolean' as const,
  description:
    'KIE content filtering. Defaults to false on the API side, which returns all results directly.',
};

export const VIDEO_MODELS: ModelDefinition[] = [
  // ------------------------------------------------------------------ Veo 3 --
  {
    id: 'veo-3-1',
    provider: 'kie',
    label: 'Google Veo 3.1',
    type: 'video',
    capabilities: ['text-to-video', 'image-to-video'],
    docs: 'https://docs.kie.ai/veo3-api/generate-veo-3-video',
    notes:
      'Cinematic flagship with native audio. One input image animates that image; two images are treated as first and last frame. Supports 4-, 6- and 8-second clips and 4K output.',
    params: {
      prompt: { field: 'prompt', required: true },
      images: {
        field: 'image_urls',
        encode: 'array',
        maxItems: 3,
        note: '1 image animates it, 2 images = first/last frame, up to 3 with generation_type REFERENCE_2_VIDEO.',
      },
      aspect_ratio: { field: 'aspect_ratio', values: ['16:9', '9:16', 'Auto'], default: '16:9' },
      resolution: { field: 'resolution', values: ['720p', '1080p', '4k'], default: '720p' },
      duration: { field: 'duration', encode: 'number', values: ['4', '6', '8'], default: 8 },
    },
    extraFields: [
      {
        field: 'generation_type',
        type: 'string',
        values: ['TEXT_2_VIDEO', 'FIRST_AND_LAST_FRAMES_2_VIDEO', 'REFERENCE_2_VIDEO'],
        description:
          'Generation mode. Inferred from the presence of images when omitted. REFERENCE_2_VIDEO takes 1-3 images and is limited to the veo3_fast / veo3_lite tiers.',
      },
      {
        field: 'enable_translation',
        type: 'boolean',
        default: false,
        description: 'Auto-translate the prompt to English before generation.',
      },
      {
        field: 'watermark',
        type: 'string',
        description: 'Optional watermark text burned into the video.',
      },
    ],
  },

  // ------------------------------------------------------------------ Kling --
  {
    id: 'kling/v3-turbo-text-to-video',
    provider: 'kie',
    label: 'Kling V3 Turbo - Text to Video',
    type: 'video',
    capabilities: ['text-to-video'],
    docs: 'https://docs.kie.ai/market/kling/v3-turbo-text-to-video',
    notes: 'Free duration between 3 and 15 seconds - the widest duration range available here.',
    params: {
      prompt: { field: 'prompt', required: true, max: 2500 },
      duration: { field: 'duration', encode: 'string', min: 3, max: 15, default: 5, required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '9:16', '16:9'],
        default: '16:9',
        required: true,
      },
      resolution: { field: 'resolution', values: ['720p', '1080p'], default: '720p', required: true },
    },
    defaults: { duration: '5', aspect_ratio: '16:9', resolution: '720p' },
  },
  {
    id: 'kling/v3-turbo-image-to-video',
    provider: 'kie',
    label: 'Kling V3 Turbo - Image to Video',
    type: 'video',
    capabilities: ['image-to-video'],
    docs: 'https://docs.kie.ai/market/kling/v3-turbo-image-to-video',
    params: {
      prompt: { field: 'prompt', required: true, max: 2500 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1 },
      duration: { field: 'duration', encode: 'string', min: 3, max: 15, default: 5, required: true },
      resolution: { field: 'resolution', values: ['720p', '1080p'], default: '720p', required: true },
    },
    defaults: { duration: '5', resolution: '720p' },
  },
  {
    id: 'kling/v2-5-turbo-text-to-video-pro',
    provider: 'kie',
    label: 'Kling V2.5 Turbo Pro - Text to Video',
    type: 'video',
    capabilities: ['text-to-video'],
    docs: 'https://docs.kie.ai/market/kling/v25-turbo-text-to-video-pro',
    notes: 'Supports negative prompts and a CFG scale for prompt adherence.',
    params: {
      prompt: { field: 'prompt', required: true, max: 2500 },
      negative_prompt: { field: 'negative_prompt', max: 2500 },
      duration: { field: 'duration', encode: 'string', values: ['5', '10'], default: 5 },
      aspect_ratio: { field: 'aspect_ratio', values: ['16:9', '9:16', '1:1'], default: '16:9' },
    },
    extraFields: [
      {
        field: 'cfg_scale',
        type: 'number',
        min: 0,
        max: 1,
        default: 0.5,
        description: 'How closely the model follows the prompt (0-1, step 0.1).',
      },
    ],
  },

  // -------------------------------------------------------------- Bytedance --
  {
    id: 'bytedance/seedance-1.5-pro',
    provider: 'kie',
    label: 'Bytedance Seedance 1.5 Pro',
    type: 'video',
    capabilities: ['text-to-video', 'image-to-video'],
    docs: 'https://docs.kie.ai/market/bytedance/seedance-1-5-pro',
    notes:
      'Single endpoint for both modes: 0 images = text-to-video, 1-2 images = image-to-video. Free duration 4-12 s and optional audio generation.',
    params: {
      prompt: { field: 'prompt', required: true, max: 20000 },
      images: { field: 'input_urls', encode: 'array', maxItems: 2 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
        default: '1:1',
        required: true,
      },
      resolution: { field: 'resolution', values: ['480p', '720p', '1080p'], default: '720p' },
      duration: { field: 'duration', encode: 'number', min: 4, max: 12, required: true, default: 5 },
    },
    defaults: { aspect_ratio: '16:9', duration: 5 },
    extraFields: [
      {
        field: 'fixed_lens',
        type: 'boolean',
        default: false,
        description: 'Lock the camera for a static shot instead of Seedance auto camera movement.',
      },
      {
        field: 'generate_audio',
        type: 'boolean',
        default: false,
        description: 'Generate audio alongside the video. Increases cost.',
      },
      NSFW_CHECKER,
    ],
  },
  {
    id: 'bytedance/v1-pro-text-to-video',
    provider: 'kie',
    label: 'Bytedance V1 Pro - Text to Video',
    type: 'video',
    capabilities: ['text-to-video'],
    docs: 'https://docs.kie.ai/market/bytedance/v1-pro-text-to-video',
    params: {
      prompt: { field: 'prompt', required: true, max: 10000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['480p', '720p', '1080p'], default: '720p' },
      duration: { field: 'duration', encode: 'string', values: ['5', '10'], default: 5 },
      seed: { field: 'seed', encode: 'number', min: -1, max: 2147483647 },
    },
    extraFields: [
      {
        field: 'camera_fixed',
        type: 'boolean',
        description: 'Fix the camera position.',
      },
      NSFW_CHECKER,
    ],
  },
  {
    id: 'bytedance/v1-pro-image-to-video',
    provider: 'kie',
    label: 'Bytedance V1 Pro - Image to Video',
    type: 'video',
    capabilities: ['image-to-video'],
    docs: 'https://docs.kie.ai/market/bytedance/v1-pro-image-to-video',
    notes: 'One input image, jpeg/png/webp up to 10 MB.',
    params: {
      prompt: { field: 'prompt', required: true, max: 10000 },
      images: { field: 'image_url', encode: 'string', required: true, minItems: 1, maxItems: 1 },
      resolution: { field: 'resolution', values: ['480p', '720p', '1080p'], default: '720p' },
      duration: { field: 'duration', encode: 'string', values: ['5', '10'], default: 5 },
      seed: { field: 'seed', encode: 'number', min: -1, max: 2147483647 },
    },
    extraFields: [
      {
        field: 'camera_fixed',
        type: 'boolean',
        description: 'Fix the camera position.',
      },
      NSFW_CHECKER,
    ],
  },

  // ----------------------------------------------------------------- Hailuo --
  {
    id: 'hailuo/2-3-image-to-video-pro',
    provider: 'kie',
    label: 'Hailuo 2.3 Pro - Image to Video',
    type: 'video',
    capabilities: ['image-to-video'],
    docs: 'https://docs.kie.ai/market/hailuo/2-3-image-to-video-pro',
    notes: '10-second clips are not available at 1080P.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_url', encode: 'string', required: true, minItems: 1, maxItems: 1 },
      duration: { field: 'duration', encode: 'string', values: ['6', '10'], default: 6 },
      resolution: {
        field: 'resolution',
        values: ['768P', '1080P'],
        default: '768P',
        note: 'Hailuo 2.3 uses uppercase P.',
      },
    },
    extraFields: [NSFW_CHECKER],
  },
  {
    id: 'hailuo/02-image-to-video-pro',
    provider: 'kie',
    label: 'Hailuo 02 Pro - Image to Video',
    type: 'video',
    capabilities: ['image-to-video'],
    docs: 'https://docs.kie.ai/market/hailuo/02-image-to-video-pro',
    notes:
      'Supports an optional last-frame image via the end_image_url extra field. No duration/resolution/aspect ratio parameters.',
    params: {
      prompt: { field: 'prompt', required: true, max: 1500 },
      images: { field: 'image_url', encode: 'string', required: true, minItems: 1, maxItems: 1 },
    },
    extraFields: [
      {
        field: 'end_image_url',
        type: 'string',
        description: 'URL of the image to use as the last frame (jpeg/png/webp, max 10 MB).',
      },
      {
        field: 'prompt_optimizer',
        type: 'boolean',
        description: "Use Hailuo's prompt optimizer.",
      },
      NSFW_CHECKER,
    ],
  },
  {
    id: 'hailuo/02-text-to-video-pro',
    provider: 'kie',
    label: 'Hailuo 02 Pro - Text to Video',
    type: 'video',
    capabilities: ['text-to-video'],
    docs: 'https://docs.kie.ai/market/hailuo/02-text-to-video-pro',
    notes: 'Prompt only - no aspect ratio, resolution or duration parameters.',
    params: {
      prompt: { field: 'prompt', required: true, max: 1500 },
    },
    extraFields: [
      {
        field: 'prompt_optimizer',
        type: 'boolean',
        description: "Use Hailuo's prompt optimizer.",
      },
      NSFW_CHECKER,
    ],
  },

  // -------------------------------------------------------------------- Wan --
  {
    id: 'wan/2-6-text-to-video',
    provider: 'kie',
    label: 'Wan 2.6 - Text to Video',
    type: 'video',
    capabilities: ['text-to-video'],
    docs: 'https://docs.kie.ai/market/wan/2-6-text-to-video',
    notes: 'Up to 15 seconds and 1080p by default. Chinese and English prompts.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      duration: { field: 'duration', encode: 'string', values: ['5', '10', '15'], default: 5 },
      resolution: { field: 'resolution', values: ['720p', '1080p'], default: '1080p' },
    },
    extraFields: [
      {
        field: 'multi_shots',
        type: 'boolean',
        default: false,
        description: 'Allow multiple shots instead of one continuous take.',
      },
      NSFW_CHECKER,
    ],
  },
  {
    id: 'wan/2-6-image-to-video',
    provider: 'kie',
    label: 'Wan 2.6 - Image to Video',
    type: 'video',
    capabilities: ['image-to-video'],
    docs: 'https://docs.kie.ai/market/wan/2-6-image-to-video',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1 },
      duration: { field: 'duration', encode: 'string', values: ['5', '10', '15'], default: 5 },
      resolution: { field: 'resolution', values: ['720p', '1080p'], default: '1080p' },
    },
    extraFields: [
      {
        field: 'multi_shots',
        type: 'boolean',
        default: false,
        description: 'Allow multiple shots instead of one continuous take.',
      },
      NSFW_CHECKER,
    ],
  },
  {
    id: 'wan/2-6-video-to-video',
    provider: 'kie',
    label: 'Wan 2.6 - Video to Video',
    type: 'video',
    capabilities: ['video-to-video'],
    docs: 'https://docs.kie.ai/market/wan/2-6-video-to-video',
    notes: 'Prompt-driven restyle of an input video. mp4/mov/mkv, max 100 MB.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      video: { field: 'video_urls', encode: 'array', required: true },
      duration: { field: 'duration', encode: 'string', values: ['5', '10'], default: 5 },
      resolution: { field: 'resolution', values: ['720p', '1080p'], default: '1080p' },
    },
    extraFields: [
      {
        field: 'multi_shots',
        type: 'boolean',
        default: false,
        description: 'Allow multiple shots instead of one continuous take.',
      },
      NSFW_CHECKER,
    ],
  },

  // --------------------------------------------------------------- PixVerse --
  {
    id: 'pixverse-v6/text-to-video',
    provider: 'kie',
    label: 'PixVerse V6 - Text to Video',
    type: 'video',
    capabilities: ['text-to-video'],
    docs: 'https://docs.kie.ai/market/pixverse/text-to-video',
    notes: 'Free duration 1-15 s, resolutions down to 360p, optional synchronised audio.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['16:9', '4:3', '1:1', '3:4', '9:16', '2:3', '3:2', '21:9'],
        default: '16:9',
        required: true,
      },
      resolution: {
        field: 'quality',
        values: ['360p', '540p', '720p', '1080p'],
        default: '720p',
        required: true,
        note: 'Sent as `quality`.',
      },
      duration: { field: 'duration', encode: 'number', min: 1, max: 15, default: 5, required: true },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
    defaults: { aspect_ratio: '16:9', quality: '720p', duration: 5 },
    extraFields: [
      {
        field: 'generate_audio_switch',
        type: 'boolean',
        default: false,
        description: 'Generate audio synchronised with the video.',
      },
      {
        field: 'generate_multi_clip_switch',
        type: 'boolean',
        default: false,
        description: 'Generate a multi-clip video.',
      },
    ],
  },
  {
    id: 'pixverse-v6/image-to-video',
    provider: 'kie',
    label: 'PixVerse V6 - Image to Video',
    type: 'video',
    capabilities: ['image-to-video'],
    docs: 'https://docs.kie.ai/market/pixverse/image-to-video',
    notes: 'Up to 2 input images, each at most 20 MB.',
    params: {
      prompt: { field: 'prompt', required: true, max: 5000 },
      images: { field: 'image_urls', encode: 'array', required: true, minItems: 1, maxItems: 2 },
      resolution: {
        field: 'quality',
        values: ['360p', '540p', '720p', '1080p'],
        default: '720p',
        required: true,
        note: 'Sent as `quality`.',
      },
      duration: { field: 'duration', encode: 'number', min: 1, max: 15, default: 5, required: true },
      seed: { field: 'seed', encode: 'number', min: 0, max: 2147483647 },
    },
    defaults: { quality: '720p', duration: 5 },
    extraFields: [
      {
        field: 'generate_audio_switch',
        type: 'boolean',
        default: false,
        description: 'Generate audio synchronised with the video.',
      },
      {
        field: 'generate_multi_clip_switch',
        type: 'boolean',
        default: false,
        description: 'Generate a multi-clip video.',
      },
    ],
  },

  // ----------------------------------------------------------- Grok Imagine --
  {
    id: 'grok-imagine/text-to-video',
    provider: 'kie',
    label: 'Grok Imagine - Text to Video',
    type: 'video',
    capabilities: ['text-to-video'],
    docs: 'https://docs.kie.ai/market/grok-imagine/text-to-video',
    notes: 'Long clips: 6-30 seconds.',
    params: {
      prompt: { field: 'prompt', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['2:3', '3:2', '1:1', '16:9', '9:16'],
        default: '2:3',
      },
      resolution: { field: 'resolution', values: ['480p', '720p', '1080p'], default: '480p' },
      duration: { field: 'duration', encode: 'number', min: 6, max: 30 },
    },
    extraFields: [
      {
        field: 'mode',
        type: 'string',
        values: ['fun', 'normal', 'spicy'],
        default: 'normal',
        description: 'Motion style and intensity.',
      },
      NSFW_CHECKER,
    ],
  },
  {
    id: 'grok-imagine/image-to-video',
    provider: 'kie',
    label: 'Grok Imagine - Image to Video',
    type: 'video',
    capabilities: ['image-to-video'],
    docs: 'https://docs.kie.ai/market/grok-imagine/image-to-video',
    notes:
      'Up to 7 reference images, 6-30 second clips. The aspect ratio only applies in multi-image mode; single-image mode follows the input image.',
    params: {
      prompt: { field: 'prompt' },
      images: { field: 'image_urls', encode: 'array', minItems: 1, maxItems: 7 },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['2:3', '3:2', '1:1', '16:9', '9:16'],
        default: '16:9',
      },
      resolution: { field: 'resolution', values: ['480p', '720p', '1080p'], default: '480p' },
      duration: { field: 'duration', encode: 'string', min: 6, max: 30 },
    },
    extraFields: [
      {
        field: 'mode',
        type: 'string',
        values: ['fun', 'normal', 'spicy'],
        default: 'normal',
        description: 'Motion style and intensity. Spicy is unavailable for external image inputs.',
      },
    ],
  },
  // ------------------------------------------------------- Video to video ---
  {
    id: 'runway/gen4-aleph',
    provider: 'kie',
    label: 'Runway Gen-4 Aleph - Video to Video',
    type: 'video',
    capabilities: ['video-to-video'],
    docs: 'https://docs.kie.ai/runway-api/generate-aleph-video',
    notes: 'Prompt-driven transformation of a source video, optionally guided by a style image.',
    params: {
      prompt: { field: 'prompt', required: true },
      video: { field: 'video_url', encode: 'string', required: true },
      aspect_ratio: {
        field: 'aspect_ratio',
        values: ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
      },
      seed: { field: 'seed', encode: 'number' },
    },
    extraFields: [
      {
        field: 'reference_image',
        type: 'string',
        description: 'Reference image URL that influences the style or content of the output.',
      },
      {
        field: 'watermark',
        type: 'string',
        description: 'Watermark text. Empty string means no watermark.',
      },
    ],
  },
  {
    id: 'volcengine/video-to-video-lip-sync',
    provider: 'kie',
    label: 'Volcengine - Video to Video Lip Sync',
    type: 'video',
    capabilities: ['video-to-video'],
    docs: 'https://docs.kie.ai/market/volcengine/video-to-video-lip-sync',
    notes:
      'Drives the lip movement in a source video from an audio track. Takes no prompt. Video must be 360p-1080p (MOV/MP4 family).',
    params: {
      video: { field: 'video_url', encode: 'string', required: true },
      audio: { field: 'audio_url', encode: 'string', required: true },
    },
    defaults: { mode: 'lite' },
    extraFields: [
      {
        field: 'mode',
        type: 'string',
        values: ['lite', 'basic'],
        required: true,
        default: 'lite',
        description:
          'lite = single-person frontal video, faster. basic = complex scenes, supports scene segmentation.',
      },
      {
        field: 'separate_vocal',
        type: 'boolean',
        default: false,
        description: 'Separate vocals to suppress background noise.',
      },
      {
        field: 'open_scenedet',
        type: 'boolean',
        default: false,
        description: 'Scene segmentation and speaker identification. Basic mode only.',
      },
      {
        field: 'align_audio',
        type: 'boolean',
        default: true,
        description: 'Loop the video when the audio is longer than the video. Lite mode only.',
      },
    ],
  },
];
