import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import http from 'node:http';
import { createLocalServer } from '../scripts/local-server.mjs';
import { readLibrary, readOverrides, applyOverrides } from '../scripts/library-overrides.mjs';

async function fixture(t, admin = true) {
  const root = await mkdtemp(join(tmpdir(), 'poe-admin-test-'));
  await mkdir(join(root, 'data'));
  for (const file of ['library.ko.json', 'glossary.ko.json']) await copyFile(`data/${file}`, join(root, 'data', file));
  await writeFile(join(root, 'index.html'), '<head></head>');
  const server = createLocalServer(root, { admin });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); });
  const dataResponse = await fetch(url + '/data/library.ko.json');
  return { root, url, library: await dataResponse.json(), revision: dataResponse.headers.get('X-Library-Revision') };
}
async function request(f, body, headers = {}) {
  const { token } = await (await fetch(f.url + '/__admin/session')).json();
  return fetch(f.url + '/__admin/library', { method: 'PUT', headers: { Origin: f.url, 'Content-Type': 'application/json', 'X-Admin-Token': token, ...headers }, body: JSON.stringify(body) });
}
test('ordinary server has no administration endpoints or injected mode', async t => {
  const f = await fixture(t, false);
  assert.equal((await fetch(f.url + '/__admin/session')).status, 404);
  assert.equal((await fetch(f.url + '/__admin/library', { method: 'PUT' })).status, 404);
  assert.doesNotMatch(await (await fetch(f.url)).text(), /local-library-admin/);
});
test('admin save persists across server reads and research regeneration without changing source evidence', async t => {
  const f = await fixture(t), method = structuredClone(f.library.strategies[0]);
  method.name += ' 관리 수정'; method.sourceVideoId = 'tampered-source';
  method.tablets.evidence = []; method.atlas.fullTreeVerified = true;
  assert.match(await (await fetch(f.url)).text(), /local-library-admin/);
  const response = await request(f, { revision: f.revision, method });
  assert.equal(response.status, 200);
  const result = await response.json(), updated = result.library.strategies[0];
  assert.equal(updated.name, method.name);
  assert.equal(updated.sourceVideoId, f.library.strategies[0].sourceVideoId);
  assert.deepEqual(updated.tablets.evidence, f.library.strategies[0].tablets.evidence);
  assert.equal(updated.atlas.fullTreeVerified, false);
  assert.deepEqual(await readLibrary(f.root), result.library);
  assert.deepEqual(applyOverrides(f.library, await readOverrides(f.root)), result.library);
  assert.deepEqual(JSON.parse(await readFile(join(f.root, 'data/library.ko.json'))), f.library);
  assert.equal((await fetch(f.url + '/data/library-overrides.ko.json')).status, 404);
});
test('invalid and stale writes leave saved bytes unchanged', async t => {
  const f = await fixture(t), method = structuredClone(f.library.strategies[0]);
  method.name = '첫 수정';
  assert.equal((await request(f, { revision: f.revision, method })).status, 200);
  const path = join(f.root, 'data/library-overrides.ko.json'), before = await readFile(path, 'utf8');
  method.name = '다른 탭의 수정';
  assert.equal((await request(f, { revision: f.revision, method })).status, 409);
  const response = await fetch(f.url + '/data/library.ko.json');
  method.waystone.tier = 17;
  assert.equal((await request(f, { revision: response.headers.get('X-Library-Revision'), method })).status, 422);
  assert.equal(await readFile(path, 'utf8'), before);
});
test('write requests require matching host, origin and session token', async t => {
  const f = await fixture(t), body = { revision: f.revision, method: f.library.strategies[0] };
  for (const headers of [{ Origin: 'https://other.example' }, { 'X-Admin-Token': 'wrong' }, { Origin: '' }]) assert.equal((await request(f, body, headers)).status, 403, JSON.stringify(headers));
  const hostStatus = await new Promise((resolve, reject) => { http.get(f.url + '/__admin/session', { headers: { Host: 'other.example' } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject); });
  assert.equal(hostStatus, 403);
  assert.equal((await fetch(f.url + '/__admin/session', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await request(f, null)).status, 400);
  assert.deepEqual(await readOverrides(f.root), { version: 1, methods: [] });
});
