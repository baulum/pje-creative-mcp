import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertReadableFile,
  downloadToFile,
  isHttpUrl,
  mimeForPath,
  resolveWithinRoot,
  suggestFileName,
} from '../src/utils/files.js';
import { McpError } from '../src/utils/errors.js';

let root: string;

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'pje-mcp-'));
});

after(async () => {
  await rm(root, { recursive: true, force: true });
});

function expectError(fn: () => unknown): McpError {
  try {
    fn();
  } catch (err) {
    assert.ok(err instanceof McpError);
    return err;
  }
  throw new assert.AssertionError({ message: 'expected the call to throw' });
}

test('http and https inputs are recognised as URLs', () => {
  assert.equal(isHttpUrl('https://cdn.kie.ai/a.png'), true);
  assert.equal(isHttpUrl('/Users/me/a.png'), false);
});

test('mime types are derived from the extension', () => {
  assert.equal(mimeForPath('/a/b.PNG'), 'image/png');
  assert.equal(mimeForPath('/a/b.mp4'), 'video/mp4');
  assert.equal(mimeForPath('/a/b.exe'), undefined);
});

test('relative paths resolve inside the output root', () => {
  const resolved = resolveWithinRoot('shots/hero.png', root);
  assert.ok(resolved.startsWith(root));
  assert.ok(resolved.endsWith('/shots/hero.png'));
});

test('path traversal out of the output root is refused', () => {
  const err = expectError(() => resolveWithinRoot('../../etc/passwd', root));
  assert.equal(err.code, 'INVALID_PATH');
});

test('absolute paths outside the output root are refused', () => {
  const err = expectError(() => resolveWithinRoot('/etc/passwd', root));
  assert.equal(err.code, 'INVALID_PATH');
});

test('a directory prefix that merely shares a name does not count as inside', () => {
  const err = expectError(() => resolveWithinRoot(`${root}-sibling/x.png`, root));
  assert.equal(err.code, 'INVALID_PATH');
});

test('missing files, directories and unsupported types are reported distinctly', async () => {
  await assert.rejects(assertReadableFile(join(root, 'nope.png')), (err: unknown) => {
    assert.ok(err instanceof McpError);
    assert.equal(err.code, 'FILE_NOT_FOUND');
    return true;
  });

  await mkdir(join(root, 'adir'), { recursive: true });
  await assert.rejects(assertReadableFile(join(root, 'adir')), McpError);

  const badType = join(root, 'script.exe');
  await writeFile(badType, 'x');
  await assert.rejects(assertReadableFile(badType), (err: unknown) => {
    assert.ok(err instanceof McpError);
    assert.equal(err.code, 'UNSUPPORTED_FILE_TYPE');
    return true;
  });
});

test('a readable image reports its size and mime type', async () => {
  const path = join(root, 'ok.png');
  await writeFile(path, Buffer.alloc(32));
  assert.deepEqual(await assertReadableFile(path), { size: 32, mime: 'image/png' });
});

test('download writes the body and creates missing directories', async () => {
  const fetchImpl = (async () =>
    new Response('binary-payload', {
      status: 200,
      headers: { 'content-type': 'image/png' },
    })) as unknown as typeof fetch;

  const destination = join(root, 'nested/deeper/out.png');
  const result = await downloadToFile('https://cdn.kie.ai/a.png', destination, {
    overwrite: false,
    fetchImpl,
  });

  assert.equal(result.path, destination);
  assert.equal(result.mime_type, 'image/png');
  assert.equal(await readFile(destination, 'utf8'), 'binary-payload');
});

test('an existing file is not overwritten unless asked', async () => {
  const destination = join(root, 'existing.png');
  await writeFile(destination, 'original');
  const fetchImpl = (async () => new Response('new')) as unknown as typeof fetch;

  await assert.rejects(
    downloadToFile('https://cdn.kie.ai/a.png', destination, { overwrite: false, fetchImpl }),
    (err: unknown) => {
      assert.ok(err instanceof McpError);
      assert.equal(err.code, 'FILE_EXISTS');
      return true;
    },
  );
  assert.equal(await readFile(destination, 'utf8'), 'original');

  await downloadToFile('https://cdn.kie.ai/a.png', destination, { overwrite: true, fetchImpl });
  assert.equal(await readFile(destination, 'utf8'), 'new');
});

test('an expired result URL produces a DOWNLOAD_FAILED with a recovery hint', async () => {
  const fetchImpl = (async () =>
    new Response('gone', { status: 403, statusText: 'Forbidden' })) as unknown as typeof fetch;
  await assert.rejects(
    downloadToFile('https://cdn.kie.ai/a.png', join(root, 'x.png'), {
      overwrite: true,
      fetchImpl,
    }),
    (err: unknown) => {
      assert.ok(err instanceof McpError);
      assert.equal(err.code, 'DOWNLOAD_FAILED');
      assert.match(err.hint ?? '', /get_task/);
      return true;
    },
  );
});

test('file names are derived from the URL, with a fallback', () => {
  assert.equal(suggestFileName('https://cdn.kie.ai/x/hero.png?sig=1'), 'hero.png');
  assert.match(suggestFileName('https://cdn.kie.ai/x/noext', '.mp4'), /^kie-result-\d+\.mp4$/);
});
