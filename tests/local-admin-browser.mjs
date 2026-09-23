import { createRequire } from 'node:module';
import { mkdtemp, cp, copyFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createLocalServer } from '../scripts/local-server.mjs';
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = await mkdtemp(join(tmpdir(), 'poe-admin-browser-'));
let browser; const servers = [];
async function serve(directory, admin) {
  const server = createLocalServer(directory, { admin }); servers.push(server);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}
try {
  for (const folder of ['src', 'data', 'assets']) await cp(folder, join(root, folder), { recursive: true });
  // The fixture must never carry real operator changes into its expectations.
  await rm(join(root, 'data/library-overrides.ko.json'), { force: true });
  for (const file of ['index.html', 'styles.css', '.nojekyll']) await copyFile(file, join(root, file));
  const url = await serve(root, true), key = 'poe2-farming.personal.v1';
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1265, height: 850 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '/?method=azmeri-strongbox');
  await page.getByRole('button', { name: '원본 편집', exact: true }).waitFor();
  await page.getByRole('button', { name: '내 데이터로 복사', exact: false }).click();
  await page.locator('[data-action="finish"]').first().click();
  const personal = await page.evaluate(k => localStorage.getItem(k), key);
  await page.goto(url + '/?method=azmeri-strongbox');
  const title = await page.locator('.detail-hero h2').innerText();
  await page.getByRole('button', { name: '원본 편집', exact: true }).click();
  assert.equal(await page.locator('[data-action="delete"]').count(), 0);
  assert.equal(await page.getByRole('heading', { name: '기본 자료 원본 편집' }).count(), 1);
  await page.locator('[data-path="method.name"]').fill('취소할 변경');
  await page.locator('[data-action="cancel-edit"]').first().click();
  assert.equal(await page.locator('.detail-hero h2').innerText(), title);
  await assert.rejects(access(join(root, 'data/library-overrides.ko.json')));
  // Both tabs load the same version before one commits.
  const stale = await browser.newPage(); await stale.goto(url + '/?method=azmeri-strongbox');
  await stale.getByRole('button', { name: '원본 편집', exact: true }).click();
  await stale.locator('[data-path="method.name"]').fill('오래된 탭');
  await page.getByRole('button', { name: '원본 편집', exact: true }).click();
  await page.locator('[data-path="method.name"]').fill(title + ' 관리 수정');
  await page.locator('[data-action="finish"]').first().click();
  await page.getByRole('button', { name: '원본 편집', exact: true }).waitFor();
  assert.equal(await page.locator('.detail-hero h2').innerText(), title + ' 관리 수정');
  assert.equal(await page.evaluate(k => localStorage.getItem(k), key), personal);
  await stale.locator('[data-action="finish"]').first().click();
  await stale.locator('#form-errors:not([hidden])').waitFor();
  assert.match(await stale.locator('#form-errors').innerText(), /다른 곳에서 변경/);
  assert.equal(await stale.locator('[data-path="method.name"]').inputValue(), '오래된 탭');
  await page.reload();
  await page.getByRole('button', { name: '원본 편집', exact: true }).waitFor();
  assert.equal(await page.locator('.detail-hero h2').innerText(), title + ' 관리 수정');
  // Build from edited fixture; no write API or admin module gets deployed.
  execFileSync(process.execPath, [resolve('scripts/build.mjs')], { cwd: root });
  const builtApp = await readFile(join(root, 'dist/src/app.js'), 'utf8');
  assert.doesNotMatch(builtApp, /libraryAdmin|local-admin|__admin|LOCAL_ADMIN/);
  await assert.rejects(access(join(root, 'dist/src/local-admin.js')));
  await assert.rejects(access(join(root, 'dist/data/library-overrides.ko.json')));
  const publicUrl = await serve(join(root, 'dist'), false);
  await page.goto(publicUrl + '/?method=azmeri-strongbox');
  await page.locator('.detail-hero h2').waitFor();
  assert.equal(await page.locator('.detail-hero h2').innerText(), title + ' 관리 수정');
  assert.equal(await page.getByRole('button', { name: '원본 편집', exact: true }).count(), 0);
  assert.equal((await fetch(publicUrl + '/__admin/session')).status, 404);
  assert.equal((await fetch(publicUrl + '/src/local-admin.js')).status, 404);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url + '/?method=azmeri-strongbox');
  await page.getByRole('button', { name: '원본 편집', exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('[data-action="cancel-edit"]').first().click();
  assert.deepEqual(errors, []);
  console.log('PASS: original edit/save/cancel, reload, personal isolation, stale edit retention, mobile and public build without admin functionality');
} finally {
  await browser?.close();
  for (const server of servers) await new Promise(resolve => server.close(resolve));
  await rm(root, { recursive: true, force: true });
}
