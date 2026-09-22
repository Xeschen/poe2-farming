import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { copyMethod } from '../src/model.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
const root = process.env.APP_URL || 'http://127.0.0.1:4173/';
const seed = JSON.parse(readFileSync(new URL('../data/library.ko.json', import.meta.url)));
const original = copyMethod(seed, seed.strategies.find(m => m.id === 'tablet-drop'));
const provenance = r => [r.sources, ...['tablets', 'waystone', 'map', 'atlas', 'masters', 'reportedResults'].map(k => r.method[k]?.evidence), r.method.executionEvidence, r.method.constraints];
const key = 'poe2-farming.personal.v1', errors = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message));
    const raw = () => page.evaluate(k => localStorage.getItem(k), key);
    await page.goto(new URL('?method=tablet-drop', root).href);
    await page.getByRole('button', { name: '내 데이터로 복사' }).click();
    const toc = page.getByRole('navigation', { name: '세팅 편집 목차' });
    assert.equal(await toc.getByRole('link').count(), 9);
    assert.equal(await page.locator('#edit-sources, [data-op="add-source"], [data-op="add-evidence"], [data-path^="sources."]').count(), 0);
    assert.doesNotMatch(await page.locator('#editor').innerText(), /타임스탬프 편집|시작 시간 \(초\)|영상 출처 추가/);
    await toc.getByRole('link', { name: '지도 · 환경', exact: true }).click();
    assert.equal(await page.locator('[data-check-path="method.map.biomes"]').count(), 12);
    for (const name of ['에조미어 도시', '바알 도시', '파리둔 도시']) await page.locator(`[data-check-path="method.map.biomes"][value="${name}"]`).check();
    const info = page.locator('.biome-rules'); await info.locator('summary').click();
    assert.equal(await info.getByRole('link').count(), 4);
    assert.match(await info.innerText(), /에조미어 도시 → 풀 \/ 늪/);
    assert.match(await info.innerText(), /바알 도시 → 숲 \/ 물/);
    assert.match(await info.innerText(), /파리둔 도시 → 사막 \/ 산/);
    assert.equal(await raw(), null);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (mobile) {
      await toc.locator('.editor-toc-links').evaluate(el => el.scrollLeft = el.scrollWidth);
      for (const action of ['저장', '취소']) {
        const box = await toc.getByRole('button', { name: action, exact: true }).boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height < 844);
      }
    }
    await page.screenshot({ path: `test-results/editor-environments-${mobile ? 'mobile' : 'desktop'}.png` });
    const footer = page.locator('.editor-save-actions'); await footer.scrollIntoViewIfNeeded();
    const f = await page.locator('#editor').boundingBox(), buttons = await footer.locator('button').all();
    const first = await buttons[0].boundingBox(), last = await buttons[1].boundingBox();
    assert.ok(Math.abs((first.x + last.x + last.width) / 2 - (f.x + f.width / 2)) < 2, 'footer actions centered');
    await page.screenshot({ path: `test-results/editor-footer-${mobile ? 'mobile' : 'desktop'}.png` });
    await toc.getByRole('button', { name: '저장', exact: true }).focus();
    await toc.getByRole('button', { name: '저장', exact: true }).press('Enter');
    assert.equal(await page.locator('#editor').count(), 0);
    const saved = await raw(), record = JSON.parse(saved).records[0];
    assert.deepEqual(provenance(record), provenance(original));
    assert.deepEqual(record.method.atlas, original.method.atlas, 'environment checks must not apply node choices automatically');
    await page.reload(); await page.getByRole('button', { name: '세팅 편집' }).click();
    for (const name of ['에조미어 도시', '바알 도시', '파리둔 도시']) assert.equal(await page.locator(`[data-check-path="method.map.biomes"][value="${name}"]`).isChecked(), true);
    await page.locator('[data-check-path="method.map.biomes"][value="바알 도시"]').uncheck();
    await page.getByLabel('파밍법 이름 (필수)').fill('');
    await toc.getByRole('button', { name: '저장', exact: true }).click();
    assert.equal(await page.locator('#editor').count(), 1); assert.equal(await raw(), saved);
    await toc.getByRole('button', { name: '취소', exact: true }).click();
    assert.equal(await page.locator('#editor').count(), 0); assert.equal(await raw(), saved);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: 12 environments, conversion guidance, no evidence editors, provenance preserved, centered footer and working sticky TOC save/cancel on desktop/mobile');
} finally { await browser.close(); }
