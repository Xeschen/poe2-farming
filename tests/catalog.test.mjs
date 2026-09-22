import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copyMethod, clone } from '../src/model.js';
import { baseKey, filterEntries, facetValues, tabletSummary, comparisonRows, toggleComparison, publicUrl, parseRoute, UNKNOWN, NOT_APPLICABLE } from '../src/catalog.js';
const seed = JSON.parse(readFileSync(new URL('../data/library.ko.json', import.meta.url)));
const entries = seed.strategies.map(m => ({ id: baseKey(m.id), method: copyMethod(seed, m).method, personal: false }));
const find = id => entries.find(e => e.method.id === id);
test('combined content, investment and unknown patch filters select the correct expedition', () => {
  assert.deepEqual(filterEntries(entries, { content: '대탐험', investment: 'low', patch: UNKNOWN }).map(e => e.method.id), ['grand-expedition-chests']);
  assert.equal(filterEntries(entries, { content: '대탐험', investment: 'low', master: '힐다' }).length, 0);
  assert.equal(filterEntries(entries, { tablet: '방사능 노출 서판', patch: '0.5.5' }).length, 1);
});
test('search supports words in any order and filters personal records separately', () => {
  const own = { ...clone(find('tablet-drop')), id: 'personal-test', personal: true };
  assert.equal(filterEntries([...entries, own], { query: '서판 자도', scope: 'personal' }).length, 1);
  assert.equal(filterEntries(entries, { query: '서판 자도', review: 'personal' }).length, 0);
  assert.equal(filterEntries(entries, { query: '없는 파밍법' }).length, 0);
});
test('unused tablets and unknown setups remain distinct', () => {
  assert.deepEqual(facetValues(find('grand-expedition-chests').method, 'tablet'), [NOT_APPLICABLE]);
  assert.match(tabletSummary(find('ritual-nameless-cycle').method), /2개/);
});
test('comparison selection has a hard limit and supports removal without mutation', () => {
  const ids = ['a', 'b', 'c']; assert.throws(() => toggleComparison(ids, 'd'), /최대 3개/);
  assert.deepEqual(toggleComparison(ids, 'b'), ['a', 'c']); assert.deepEqual(ids, ['a', 'b', 'c']);
});
test('comparison distinguishes four metrics without obsolete category rows', () => {
  const rows = comparisonRows([find('tablet-drop'), find('cleansed-fracturing'), find('grand-expedition-chests')]);
  const row = key => rows.find(r => r.id === key);
  assert.match(row('monsterRarity').values[0][0], /미확인/);
  assert.match(row('monsterRarity').values[1][0], /100/);
  assert.match(row('monsterRarity').values[2][0], /미확인/);
  assert.equal(row('kind'), undefined);
  assert.match(row('waystoneQuantity').values[0][0], /35/);
  assert.match(row('waystoneDropChance').values[0][0], /100/);
  assert.equal(row('itemRarity').values[0][0], '미확인');
  assert.match(row('waystone').values[2][0], /15/);
});
test('identical setups have no false differences caused by generated HTML IDs', () => {
  const e = find('tablet-drop'); assert.equal(comparisonRows([e, clone(e)]).some(r => r.different), false);
});
test('share URLs preserve deployment path, remove unrelated query data, and round trip', () => {
  const root = 'https://example.github.io/poe2-farming/?private=note#sources';
  const detail = publicUrl(root, [find('ritual-nameless-cycle')]);
  assert.equal(new URL(detail).pathname, '/poe2-farming/'); assert.equal(new URL(detail).searchParams.has('private'), false);
  assert.deepEqual(parseRoute(detail, entries), { mode: 'detail', selected: baseKey('ritual-nameless-cycle') });
  const compare = publicUrl(root, [find('tablet-drop'), find('grand-expedition-chests')]);
  assert.deepEqual(parseRoute(compare, entries), { mode: 'compare', compareIds: ['base', baseKey('grand-expedition-chests')] });
});
test('private entries cannot be encoded in public URLs', () => {
  const own = { ...find('tablet-drop'), personal: true };
  assert.throws(() => publicUrl('https://example.com/', [own]), /개인 자료/);
  assert.throws(() => publicUrl('https://example.com/', [entries[0], own]), /개인 자료/);
});
test('missing, duplicate, oversized and ambiguous routes return an explicit error', () => {
  for (const query of ['method=missing', 'method=', 'method=tablet-drop&method=tablet-drop', 'compare=tablet-drop', 'compare=tablet-drop&compare=tablet-drop', 'compare=tablet-drop&compare=missing', 'method=tablet-drop&compare=tablet-drop&compare=tablet-crafting-sale']) {
    assert.ok(parseRoute(`https://example.com/?${query}`, entries).error, query);
  }
});

test('home and category URLs resolve under a deployment subpath', () => {
  const root = 'https://example.com/poe2-farming/';
  assert.deepEqual(parseRoute(root, entries), { mode: 'home' });
  assert.deepEqual(parseRoute(root + '?view=library', entries), { mode: 'library', filters: {}, scope: 'all' });
  assert.deepEqual(parseRoute(root + '?view=library&kind=map', entries), { mode: 'library', filters: {}, scope: 'all' });
  assert.deepEqual(parseRoute(root + '?view=library&scope=personal', entries), { mode: 'library', filters: {}, scope: 'personal' });
  for (const query of ['view=unknown', 'view=library&kind=unknown', 'kind=map', 'view=library&scope=unknown', 'view=library&view=library', 'view=library&method=tablet-drop']) assert.ok(parseRoute(root + '?' + query, entries).error);
});
