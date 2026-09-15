import type { KieClient } from './client.js';
import { submitTask, requireModel } from './images.js';
import type { NormalizedValues } from './payload.js';
import { resolveAllToRemoteUrls, resolveToRemoteUrl } from './files.js';
import type {
  ImageToVideoInput,
  Task,
  VideoGenerationInput,
  VideoToVideoInput,
} from '../provider.js';

function applyCommon(values: NormalizedValues, input: VideoGenerationInput | ImageToVideoInput) {
  if (input.aspect_ratio) values.aspect_ratio = input.aspect_ratio;
  if (input.resolution) values.resolution = input.resolution;
  if (input.negative_prompt) values.negative_prompt = input.negative_prompt;
  if (input.seed !== undefined) values.seed = input.seed;
  if (input.duration !== undefined) values.duration = input.duration;
}

export async function generateVideo(
  client: KieClient,
  input: VideoGenerationInput,
): Promise<Task> {
  const model = requireModel(input.model, 'text-to-video');
  const values: NormalizedValues = { prompt: input.prompt };
  applyCommon(values, input);
  return submitTask(client, model, values, input.options, input.callback_url);
}

export async function imageToVideo(client: KieClient, input: ImageToVideoInput): Promise<Task> {
  const model = requireModel(input.model, 'image-to-video');
  const values: NormalizedValues = {
    images: await resolveAllToRemoteUrls(client, input.images),
  };
  if (input.prompt) values.prompt = input.prompt;
  applyCommon(values, input);
  return submitTask(client, model, values, input.options, input.callback_url);
}

export async function videoToVideo(client: KieClient, input: VideoToVideoInput): Promise<Task> {
  const model = requireModel(input.model, 'video-to-video');
  const values: NormalizedValues = {};
  if (input.video) values.video = [await resolveToRemoteUrl(client, input.video)];
  if (input.audio) values.audio = [await resolveToRemoteUrl(client, input.audio)];
  if (input.prompt) values.prompt = input.prompt;
  if (input.aspect_ratio) values.aspect_ratio = input.aspect_ratio;
  if (input.resolution) values.resolution = input.resolution;
  if (input.duration !== undefined) values.duration = input.duration;
  if (input.seed !== undefined) values.seed = input.seed;
  return submitTask(client, model, values, input.options, input.callback_url);
}
