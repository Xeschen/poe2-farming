import { saveAndResume } from './editor-checkpoint.mjs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { waystoneEffects } from '../src/waystones.js';
import { editorData } from '../src/editor-data.js';
import { atlasGroups } from '../src/editor.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
const root = process.env.APP_URL || 'http://127.0.0.1:4173/';
const key = 'poe2-farming.personal.v1', errors = [];
const mod = waystoneEffects.find(m => m.family === 'MapMonsterFireDamage');
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message));
    const method = async () => { await saveAndResume(page); return (await page.evaluate(k => JSON.parse(localStorage.getItem(k)), key)).records.at(-1).method; };
    const steady = async (locator, run = () => mobile ? locator.tap() : locator.click()) => {
      await locator.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const y = await page.evaluate(() => { window.clickY = null; document.addEventListener('click', () => { window.clickY = scrollY; }, { once: true, capture: true }); return scrollY; });
      await run(); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      // Mobile taps may round the viewport by a pixel before dispatching click. Measure the app's mutation from dispatch.
      const after = await page.evaluate(() => scrollY), atDispatch = await page.evaluate(() => window.clickY);
      assert.ok(Math.abs(after - (atDispatch ?? y)) <= 1, `scroll moved: ${mobile ? 'mobile' : 'desktop'} ${await locator.count() ? await locator.first().getAttribute('data-op') : 'rerendered control'}`);
    };
    await page.goto(new URL('?view=library', root).href);
    await page.getByRole('button', { name: '새 파밍법' }).click();
    for (const op of ['add-master', 'add-master', 'add-node', 'add-tablet', 'add-constraint']) await steady(page.locator(`[data-op="${op}"]`));
    assert.equal((await method()).masters.choices.length, 2);
    const input = page.getByLabel('준비물 추가', { exact: true }); await input.fill('준비물');
    await steady(input, () => input.press('Enter'));
    assert.deepEqual((await method()).supplies, ['준비물']);
    const atlas = page.getByLabel('아틀라스 노드', { exact: true });
    assert.deepEqual(await atlas.locator('optgroup').evaluateAll(els => els.map(e => e.label)), atlasGroups.map(g => g.label));
    await steady(atlas, () => atlas.selectOption('산 숙련'));
    assert.match(await page.locator('.atlas-category').innerText(), /75레벨 이상/);
    await steady(atlas, () => atlas.selectOption('고무된 제물'));
    assert.equal(await page.locator('.atlas-category').innerText(), '의식');
    await page.getByLabel('선택 효과', { exact: true }).selectOption(editorData.atlas.find(n => n.name === '고무된 제물').choices[0]);
    await page.getByLabel('공식 서판 명칭', { exact: true }).selectOption('의식 서판');
    const tablet = page.getByLabel('서판 속성 추가', { exact: true });
    const sections = await tablet.locator('optgroup').evaluateAll(els => els.map(e => ({ label: e.label, ids: [...e.children].map(o => o.value) })));
    assert.deepEqual(sections.map(g => g.label), ['접두', '접미']);
    for (const group of sections) {
      const items = group.ids.map(id => editorData.modifiers.find(m => m.id === id));
      assert.deepEqual(items, [...items].sort((a, b) => Number(b.tablets.length === 8) - Number(a.tablets.length === 8) || a.text.localeCompare(b.text, 'ko')));
      assert.ok(items.every(m => m.affix === (group.label === '접두' ? 'prefix' : 'suffix')));
    }
    const waystone = page.getByLabel('경로석 속성 추가', { exact: true });
    assert.equal(await waystone.locator('option').count(), 36);
    assert.doesNotMatch(await waystone.innerText(), /저등급|중등급|고등급|1~5|6~10|11~16/);
    await steady(waystone, () => waystone.selectOption(mod.id));
    assert.equal(await page.locator('[data-path^="method.waystone.options"][data-path$="text"]').count(), 0);
    assert.equal((await method()).waystone.options[0].text, mod.text);
    assert.equal(await page.locator('.waystone-options .option-summary').innerText(), mod.text);
    assert.equal(await waystone.locator(`option[value="${mod.id}"]`).count(), 0);
    const otherEffect = waystoneEffects.find(m => m.family === 'MapMonsterColdDamage');
    await page.getByLabel('경로석 속성', { exact: true }).selectOption(otherEffect.id);
    await page.locator('[data-path="method.waystone.options.0.priority"]').selectOption('avoid');
    assert.equal((await method()).waystone.options[0].priority, 'avoid');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('.waystone-options').screenshot({ path: `test-results/waystone-${mobile ? 'mobile' : 'desktop'}.png` });
    await page.locator('.node-editor').screenshot({ path: `test-results/atlas-group-${mobile ? 'mobile' : 'desktop'}.png` });
    await steady(page.locator('[data-op="remove"][data-path="method.waystone.options.0"]'));
    assert.deepEqual((await method()).waystone.options, []);
    await waystone.selectOption(mod.id);
    const saved = await method();
    await page.getByRole('button', { name: '저장', exact: true }).first().click();
    await page.reload(); await page.getByRole('button', { name: '세팅 편집' }).click();
    assert.deepEqual(await method(), saved);
    assert.equal(await page.getByLabel('경로석 속성', { exact: true }).inputValue(), mod.id);
    await page.goto(new URL('?method=tablet-drop', root).href);
    await page.getByRole('button', { name: '내 데이터로 복사' }).click();
    const old = (await method()).waystone.properties;
    assert.equal(old.waystoneDropChance.min, 100);
    await page.getByLabel('설명', { exact: true }).fill('정비된 경로석 기록 유지');
    assert.deepEqual((await method()).waystone.properties, old);
    const ranges = page.locator('.waystone-properties');
    await ranges.locator('summary').click();
    await steady(page.locator('[data-op="add-constraint"]'));
    assert.equal(await ranges.getAttribute('open'), '');
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: grouped tablet/atlas selectors, 35 unified waystone effects and legacy preservation, persistence, no scroll jump on row/select mutations, desktop/mobile');
} finally { await browser.close(); }
