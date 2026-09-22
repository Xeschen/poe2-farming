import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, readdir, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { publicFiles, stripLocalAdmin } from '../scripts/release-files.mjs';

test('public build rejects incomplete admin boundaries and leftover admin code', () => {
  const block = '// LOCAL_ADMIN_START\nprivateCode();\n// LOCAL_ADMIN_END';
  assert.equal(stripLocalAdmin(`before();\n${block}\nafter();`), 'before();\nafter();');
  for (const source of ['no markers', '// LOCAL_ADMIN_START', '// LOCAL_ADMIN_END',
    '// LOCAL_ADMIN_START\n// LOCAL_ADMIN_START\n// LOCAL_ADMIN_END', `${block}\nlibraryAdmin.save()`]) {
    assert.throws(() => stripLocalAdmin(source));
  }
});

test('rebuilding removes stale files and emits only the public allowlist', async t => {
  const parent = await realpath(tmpdir());
  const root = await mkdtemp(join(parent, 'poe-release-test-'));
  t.after(async () => {
    const actual = await realpath(root);
    assert.ok(actual.startsWith(parent + sep + 'poe-release-test-'));
    await rm(actual, { recursive: true, force: true });
  });
  for (const file of publicFiles) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await copyFile(file, join(root, file));
  }
  await mkdir(join(root, 'dist', 'private'), { recursive: true });
  await writeFile(join(root, 'dist', 'private', 'stale.json'), '{}');
  await writeFile(join(root, 'src', 'unlisted.js'), 'privateCode();');
  execFileSync(process.execPath, [resolve('scripts/build.mjs')], { cwd: root });
  const files = (await readdir(join(root, 'dist'), { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile()).map(entry => join(entry.parentPath, entry.name).slice(join(root, 'dist').length + 1).split(sep).join('/'));
  assert.deepEqual(files.sort(), [...publicFiles].sort());
  assert.doesNotMatch(await readFile(join(root, 'dist', 'src', 'app.js'), 'utf8'), /libraryAdmin|LOCAL_ADMIN|local-admin/);
});
