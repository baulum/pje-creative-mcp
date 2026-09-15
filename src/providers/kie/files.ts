import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { KieClient, KieUploadResult } from './client.js';
import type { UploadedFile } from '../provider.js';
import { McpError } from '../../utils/errors.js';
import { assertReadableFile, isHttpUrl } from '../../utils/files.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('KIE');

function normalizeUpload(result: KieUploadResult, fallbackName: string): UploadedFile {
  const url = result.downloadUrl ?? result.fileUrl;
  if (!url) {
    throw new McpError('UPLOAD_FAILED', 'KIE accepted the upload but returned no file URL.', {
      details: { response: result as unknown as Record<string, unknown> },
    });
  }
  return {
    url,
    file_name: result.fileName ?? fallbackName,
    mime_type: result.mimeType ?? null,
    size_bytes: result.fileSize ?? null,
    expires_at: result.expiresAt ?? null,
  };
}

/**
 * Uploads a local file into KIE temporary storage and returns a public URL.
 * Uploaded files are deleted automatically after 3 days.
 * @see https://docs.kie.ai/file-upload-api/quickstart
 */
export async function uploadLocalFile(
  client: KieClient,
  path: string,
  uploadPath = 'pje-creative-mcp',
): Promise<UploadedFile> {
  const { size, mime } = await assertReadableFile(path);
  const bytes = await readFile(path);
  const fileName = basename(path);
  log.debug('uploading local file', { fileName, size, mime });
  const result = await client.uploadStream({
    bytes: new Uint8Array(bytes),
    fileName,
    mimeType: mime,
    uploadPath,
  });
  return normalizeUpload(result, fileName);
}

export async function uploadRemoteFile(
  client: KieClient,
  url: string,
  uploadPath = 'pje-creative-mcp',
): Promise<UploadedFile> {
  const result = await client.uploadFromUrl({ fileUrl: url, uploadPath });
  return normalizeUpload(result, basename(url.split('?')[0] ?? 'remote-file'));
}

/**
 * Turns whatever the caller passed (local path or URL) into a URL KIE can read.
 *
 * Public http(s) URLs are passed through unchanged - KIE fetches them itself.
 * Local paths are uploaded first. This is what lets tool callers hand in
 * `/Users/me/shot.png` without knowing anything about KIE file handling.
 */
export async function resolveToRemoteUrl(
  client: KieClient,
  reference: string,
  uploadPath?: string,
): Promise<string> {
  if (isHttpUrl(reference)) return reference;
  const uploaded = await uploadLocalFile(client, reference, uploadPath);
  log.info(`Uploaded ${basename(reference)} -> ${uploaded.url}`);
  return uploaded.url;
}

export async function resolveAllToRemoteUrls(
  client: KieClient,
  references: string[],
  uploadPath?: string,
): Promise<string[]> {
  const out: string[] = [];
  for (const ref of references) {
    out.push(await resolveToRemoteUrl(client, ref, uploadPath));
  }
  return out;
}
