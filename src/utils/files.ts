import { createWriteStream } from 'node:fs';
import { mkdir, stat, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, extname, isAbsolute, resolve, basename } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { McpError } from './errors.js';

/** KIE documents a 10 MB ceiling on most image inputs; uploads cap at 100 MB. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export const VIDEO_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
};

export const AUDIO_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
};

const ALL_MIME = { ...IMAGE_MIME, ...VIDEO_MIME, ...AUDIO_MIME };

export function mimeForPath(path: string): string | undefined {
  return ALL_MIME[extname(path).toLowerCase()];
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Resolve a user-supplied path to an absolute path under `root`.
 *
 * Rejects anything that escapes `root` after normalisation, which blocks
 * `../../etc/passwd`-style traversal in download_result output paths.
 */
export function resolveWithinRoot(inputPath: string, root: string): string {
  const absRoot = resolve(root);
  const absolutePath = isAbsolute(inputPath) ? resolve(inputPath) : resolve(absRoot, inputPath);
  if (absolutePath !== absRoot && !absolutePath.startsWith(absRoot + '/')) {
    throw new McpError(
      'INVALID_PATH',
      `Refusing to write outside the allowed directory: "${inputPath}" resolves to ${absolutePath}.`,
      { details: { root: absRoot, resolved: absolutePath }, hint: `Paths must stay under ${absRoot}.` },
    );
  }
  return absolutePath;
}

export async function assertReadableFile(path: string): Promise<{ size: number; mime: string }> {
  let info;
  try {
    info = await stat(path);
  } catch {
    throw new McpError('FILE_NOT_FOUND', `No such file: ${path}`, {
      hint: 'Pass an absolute path, or a path relative to the directory the MCP server runs in.',
    });
  }
  if (!info.isFile()) {
    throw new McpError('FILE_NOT_FOUND', `Not a regular file: ${path}`);
  }
  if (info.size > MAX_UPLOAD_BYTES) {
    throw new McpError(
      'FILE_TOO_LARGE',
      `${basename(path)} is ${(info.size / 1024 / 1024).toFixed(1)} MB; KIE uploads are limited to 100 MB.`,
      { details: { size_bytes: info.size, max_bytes: MAX_UPLOAD_BYTES } },
    );
  }
  const mime = mimeForPath(path);
  if (!mime) {
    throw new McpError(
      'UNSUPPORTED_FILE_TYPE',
      `Unsupported file type for ${basename(path)}.`,
      {
        details: { supported: Object.keys(ALL_MIME) },
        hint: `Supported extensions: ${Object.keys(ALL_MIME).join(', ')}.`,
      },
    );
  }
  return { size: info.size, mime };
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Streams a URL to disk, creating parent directories as needed. */
export async function downloadToFile(
  url: string,
  destination: string,
  options: { overwrite: boolean; fetchImpl?: typeof fetch },
): Promise<{ path: string; size_bytes: number; mime_type: string | null }> {
  if (!options.overwrite && (await fileExists(destination))) {
    throw new McpError('FILE_EXISTS', `${destination} already exists.`, {
      hint: 'Pass overwrite=true, or choose a different output_path.',
    });
  }
  await mkdir(dirname(destination), { recursive: true });

  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(url);
  } catch (err) {
    throw new McpError('DOWNLOAD_FAILED', `Could not fetch ${url}: ${(err as Error).message}`, {
      cause: err,
    });
  }
  if (!response.ok || !response.body) {
    throw new McpError(
      'DOWNLOAD_FAILED',
      `Download failed with HTTP ${response.status} ${response.statusText}.`,
      {
        details: { url, status: response.status },
        hint: 'KIE result URLs expire. Re-query the task with get_task to obtain a fresh URL.',
      },
    );
  }

  await pipeline(
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(destination),
  );

  const info = await stat(destination);
  return {
    path: destination,
    size_bytes: info.size,
    mime_type: response.headers.get('content-type'),
  };
}

/** Build a default file name for a result URL. */
export function suggestFileName(url: string, fallbackExt = '.bin'): string {
  const clean = (url.split('?')[0] ?? url).split('/').pop() ?? '';
  if (clean && extname(clean)) return clean;
  return `kie-result-${Date.now()}${fallbackExt}`;
}
