import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blankRecord, makeModifier, envelope, validateData, parseBackup } from '../src/model.js';
import { editorData } from '../src/editor-data.js';
import { waystoneEffects, waystoneProperties, propertyLines } from '../src/waystones.js';
import { tradePlan, tradeQuery } from '../src/trade.js';
const terms = JSON.parse(readFileSync(new URL('../data/glossary.ko.json', import.meta.url))).terms;

test('numeric tiers become 35 distinct effects, while ground effects and legacy values remain distinct', () => {
  assert.equal(waystoneEffects.length, 35);
  assert.equal(new Set(waystoneEffects.map(m => m.id)).size, 35);
  assert.equal(waystoneEffects.filter(m => m.family === 'MapSpreadGroundEffect').length, 3);
  assert.equal(waystoneEffects.flatMap(m => m.variantIds).length, 80);
  assert.equal(waystoneEffects.filter(m => m.family === 'MapMonsterFireDamage').length, 1);
  for (const mod of waystoneEffects) {
    const r = blankRecord(); r.method.waystone.options = [makeModifier(mod.id, 'required')];
    assert.deepEqual(validateData(envelope([r]), terms), []);
    const plan = tradePlan(r.method, 'waystone');
    assert.ok(plan.conditions[0].mapping, mod.text);
    assert.equal(plan.conditions[0].value, undefined);
    assert.deepEqual(parseBackup(JSON.stringify(envelope([r])), terms).data.records[0], r);
    r.method.waystone.options.push(makeModifier(mod.variantIds[0]));
    assert.ok(validateData(envelope([r]), terms).some(e => e.includes('중복')));
  }
  const old = blankRecord(); old.method.waystone.options = [makeModifier(editorData.waystoneModifiers[0].id)];
  assert.deepEqual(parseBackup(JSON.stringify(envelope([old])), terms).data.records[0], old);
});

test('eight saved property ranges round trip independently and generate current map filter keys', () => {
  const r = blankRecord(); r.method.waystone.tier = 16;
  r.method.waystone.properties = Object.fromEntries(waystoneProperties.map((p, i) => [p.key, { min: i, max: 100 + i }]));
  const before = structuredClone(r);
  assert.deepEqual(validateData(envelope([r]), terms), []);
  assert.deepEqual(parseBackup(JSON.stringify(envelope([r])), terms).data.records[0], r);
  const q = tradeQuery(tradePlan(r.method, 'waystone'));
  for (const p of waystoneProperties) assert.deepEqual(q.filters.map_filters.filters[p.filter], r.method.waystone.properties[p.key]);
  assert.deepEqual(q.filters.map_filters.filters.map_iir, { min: 0, max: 100 });
  assert.deepEqual(q.filters.map_filters.filters.map_rare_monsters, { min: 1, max: 101 });
  assert.deepEqual(q.filters.map_filters.filters.map_magic_monsters, { min: 3, max: 103 });
  assert.deepEqual(r, before);
  assert.equal(propertyLines(r.method.waystone).length, 8);
});

test('empty, zero and one-sided bounds differ; invalid ranges fail both backup and URL generation', () => {
  const r = blankRecord(); r.method.waystone.properties = { itemRarity: { min: 0, max: null }, monsterRarity: { min: null, max: 80 }, packSize: { min: null, max: null } };
  const filters = tradeQuery(tradePlan(r.method, 'waystone')).filters.map_filters.filters;
  assert.deepEqual(filters, { map_iir: { min: 0 }, map_rare_monsters: { max: 80 } });
  for (const range of [{ min: 20, max: 10 }, { min: -1, max: null }, { min: 100001, max: null }]) {
    r.method.waystone.properties.itemRarity = range;
    assert.throws(() => parseBackup(JSON.stringify(envelope([r])), terms));
    assert.throws(() => tradeQuery(tradePlan(r.method, 'waystone')));
  }
  r.method.waystone.properties = { revives: { min: 1.5, max: null } };
  assert.throws(() => parseBackup(JSON.stringify(envelope([r])), terms));
  assert.throws(() => tradeQuery(tradePlan(r.method, 'waystone')));
});

test('editing a search plan does not mutate stored values and tablet queries omit waystone properties', () => {
  const r = blankRecord(); r.method.waystone.properties = { packSize: { min: 30, max: null } };
  const plan = tradePlan(r.method, 'waystone'); plan.properties.packSize.min = 70;
  assert.equal(r.method.waystone.properties.packSize.min, 30);
  r.method.tablets.items = [{ name: '의식 서판', options: [] }];
  const q = tradeQuery(tradePlan(r.method, 'tablet'));
  assert.equal(q.filters.map_filters, undefined); assert.equal(q.type, '의식 서판');
});
