import { saveAndResume } from './editor-checkpoint.mjs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { waystoneEffects, waystoneProperties } from '../src/waystones.js';
import { makeModifier } from '../src/model.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
const root = process.env.APP_URL || 'http://127.0.0.1:4173/';
const key = 'poe2-farming.personal.v1', errors = [];
const decode = url => JSON.parse(gunzipSync(Buffer.from(new URL(url).pathname.split('/').at(-1), 'base64url')));
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message));
    const stored = async () => { await saveAndResume(page); return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key); };
    await page.goto(new URL('?view=library', root).href);
    await page.getByRole('button', { name: '새 파밍법' }).click();
    const toc = page.getByRole('navigation', { name: '세팅 편집 목차' });
    assert.equal(await toc.locator('a').count(), 9);
    const baseline = await stored(), initialUrl = page.url();
    for (const name of ['대가 구성', '경로석', '기본 정보']) {
      const link = toc.getByRole('link', { name, exact: true });
      await link.focus(); await link.press('Enter');
      const id = (await link.getAttribute('href')).slice(1);
      assert.equal(await page.evaluate(() => document.activeElement.id), id);
      assert.ok(await page.locator(`#${id}`).evaluate(el => { const y = el.getBoundingClientRect().top; return y >= 0 && y < 100; }));
      assert.equal(page.url(), initialUrl);
    }
    assert.deepEqual(await stored(), baseline);
    if (!mobile) {
      const a = await toc.boundingBox(), b = await page.locator('#editor').boundingBox();
      assert.ok(a.x >= b.x + b.width, 'toc must be right of editor');
    }
    await toc.getByRole('link', { name: '경로석', exact: true }).click();
    const selector = page.getByLabel('경로석 속성 추가', { exact: true });
    assert.equal(await selector.locator('option').count(), 36);
    assert.equal((await selector.locator('option').allTextContents()).filter(t => /추가 화염 피해/.test(t)).length, 1);
    const effect = waystoneEffects.find(m => m.family === 'MapMonsterFireDamage');
    await selector.selectOption(effect.id);
    await page.locator('[data-path="method.waystone.options.0.priority"]').selectOption('required');
    await page.locator('.waystone-properties > summary').click();
    for (const [i,p] of waystoneProperties.entries()) await page.getByLabel(`${p.label} 최소`, { exact: true }).fill(String(i + 1));
    await page.getByLabel('아이템 희귀도 최대', { exact: true }).fill('100');
    const valid = await stored();
    await page.getByLabel('아이템 희귀도 최대', { exact: true }).fill('0');
    assert.equal(await page.locator('#form-errors').isVisible(), true);
    assert.deepEqual(await stored(), valid);
    await toc.getByRole('link', { name: '기본 정보', exact: true }).click();
    assert.equal(await page.locator('#editor').count(), 1, 'toc works with invalid draft');
    await toc.getByRole('link', { name: '경로석', exact: true }).click();
    await page.getByLabel('아이템 희귀도 최대', { exact: true }).fill('100');
    assert.equal(await page.locator('#form-errors').isVisible(), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await toc.getByRole('link', { name: '경로석', exact: true }).click();
    await page.screenshot({ path: `test-results/editor-toc-${mobile ? 'mobile' : 'desktop'}.png` });
    await page.getByRole('button', { name: '저장', exact: true }).first().click();
    assert.match(await page.locator('#content').innerText(), /아이템 희귀도: 1~100/);
    await page.reload();
    await page.locator('[data-trade="waystone"]').click();
    const output = page.locator('#trade-open'); await output.waitFor({ state: 'visible' });
    let url = await output.getAttribute('href'), q = decode(url);
    assert.equal(new URL(url).origin, 'https://poe.kakaogames.com');
    for (const [i,p] of waystoneProperties.entries()) assert.equal(q.filters.map_filters.filters[p.filter].min, i + 1);
    assert.equal(q.stats[0].filters[0].value, undefined, 'unified effect must not constrain tiers');
    const saved = await stored(), dialog = page.locator('#trade-dialog');
    await dialog.getByLabel('아이템 희귀도 최소', { exact: true }).fill('101');
    await page.locator('#trade-error').waitFor({ state: 'visible' });
    assert.equal(await output.isVisible(), false);
    assert.equal(await page.locator('#trade-copy').isDisabled(), true);
    await dialog.getByLabel('아이템 희귀도 최소', { exact: true }).fill('50');
    await output.waitFor({ state: 'visible' });
    assert.equal(decode(await output.getAttribute('href')).filters.map_filters.filters.map_iir.min, 50);
    assert.deepEqual(await stored(), saved);
    assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), true);
    await dialog.screenshot({ path: `test-results/trade-properties-${mobile ? 'mobile' : 'desktop'}.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '세팅 편집' }).click();
    assert.equal(await page.locator('#editor').getByLabel('아이템 희귀도 최소', { exact: true }).inputValue(), '1');
    assert.equal(await page.getByLabel('경로석 속성', { exact: true }).inputValue(), effect.id);
    // A pre-unification personal record opens without rewriting its roll, then converts explicitly.
    const legacy = await stored();
    legacy.records[0].method.waystone.options[0] = makeModifier(effect.variantIds[0], 'required');
    await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key, data: legacy });
    await page.reload(); await page.getByRole('button', { name: '세팅 편집' }).click();
    assert.deepEqual(await stored(), legacy);
    assert.equal(await page.getByLabel('경로석 속성', { exact: true }).locator('option').count(), 35);
    await page.getByRole('button', { name: '옵션 수치 제한 해제' }).click();
    assert.equal((await stored()).records[0].method.waystone.options[0].modifierId, effect.id);
    assert.deepEqual((await stored()).records[0].method.waystone.properties, legacy.records[0].method.waystone.properties);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: right/sticky toc, keyboard/mobile section navigation without route or save changes, 35 effects, eight persistent ranges, validation, Kakao query, dialog edits isolated from saved data');
} finally { await browser.close(); }
