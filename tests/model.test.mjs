import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copyMethod, blankRecord, envelope, clone, parseBackup, validateData, mergeRecords, createStore, versionOf, STORAGE_KEY } from '../src/model.js';
const seed = JSON.parse(readFileSync(new URL('../data/farming-methods.ko.json', import.meta.url)));
const terms = JSON.parse(readFileSync(new URL('../data/glossary.ko.json', import.meta.url))).terms;
const method = seed.strategies.find(m => m.id === 'tablet-drop');
const record = () => copyMethod(seed, method);
const memory = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }; };

test('seed copy validates and preserves source, timestamps and uncertainty', () => {
  const r = record(); assert.deepEqual(validateData(envelope([r]), terms), []);
  assert.deepEqual(r.method.executionEvidence, method.executionEvidence);
  assert.equal(r.method.atlas.fullTreeVerified, false);
  assert.equal(r.method.reportedResults.netProfitPerHour, null);
  assert.equal(r.sources[0].id, method.sourceVideoId);
  r.method.tablets.items[0].count = 1;
  assert.equal(method.tablets.items[0].count, 3);
});
test('new personal method has no tablets and keeps unspecified values unknown', () => {
  const r = blankRecord(); assert.deepEqual(validateData(envelope([r]), terms), []);
  assert.equal(r.originId, null); assert.equal(r.method.waystone.tier, null);
  assert.equal(r.method.tablets.usage, 'not_used'); assert.deepEqual(r.method.tablets.items, []);
});
test('exact backup round trip and browser store reload', () => {
  const r = record(); r.method.notes = '내 세팅\n보관'; r.method.tablets.items[0].count = 2;
  const data = envelope([r]); assert.deepEqual(parseBackup(JSON.stringify(data), terms).data, data);
  const storage = memory(), store = createStore(storage, terms); store.read(); store.write(data);
  assert.deepEqual(createStore(storage, terms).read(), data);
});
test('base update detection does not modify the saved personal method', () => {
  const r = record(), before = clone(r), updated = clone(method); updated.tablets.items[0].count = 4;
  assert.notEqual(r.originVersion, versionOf(seed, updated)); assert.deepEqual(r, before);
});
test('null, zero, false and not applicable remain distinct', () => {
  const r = record(); r.method.waystone.affixCount = 0; r.method.waystone.corrupted = false;
  r.method.tablets.items[0].count = null; r.method.tablets.items[0].status = 'not_applicable';
  const result = parseBackup(JSON.stringify(envelope([r])), terms).data.records[0].method;
  assert.equal(result.waystone.affixCount, 0); assert.equal(result.waystone.corrupted, false);
  assert.equal(result.tablets.items[0].count, null); assert.equal(result.tablets.items[0].status, 'not_applicable');
});
test('numeric metrics remain independent', () => {
  const r = record(); r.method.waystone.options = ['monsterRarity', 'itemRarity', 'waystoneQuantity', 'waystoneDropChance'].map((metric, i) => ({ text: metric, priority: 'recommended', metric, min: i, unit: '%' }));
  assert.deepEqual(parseBackup(JSON.stringify(envelope([r])), terms).data.records[0].method.waystone.options, r.method.waystone.options);
});
test('bad numbers, unknown names and missing nested fields fail validation', () => {
  for (const value of [-1, 1.5, 101, '3', NaN, Infinity]) {
    const r = record(); r.method.tablets.items[0].count = value; assert.ok(validateData(envelope([r]), terms).length);
  }
  const r = record(); r.method.tablets.items[0].name = '임의 번역'; assert.ok(validateData(envelope([r]), terms).length);
  const missing = record(); delete missing.method.atlas; assert.ok(validateData(envelope([missing]), terms).length);
  const wrongKind = record(); wrongKind.method.masters.choices[0].name = '의식 서판'; assert.ok(validateData(envelope([wrongKind]), terms).length);
  const wrongNode = record(); wrongNode.method.atlas.nodes[0].name = '자도'; assert.ok(validateData(envelope([wrongNode]), terms).length);
});
test('glossary IDs, official names and per-term verification remain complete', () => {
  assert.equal(new Set(terms.map(t => t.id)).size, terms.length);
  assert.equal(new Set(terms.map(t => t.nameKo)).size, terms.length);
  for (const t of terms) {
    assert.ok(t.id && t.nameKo && t.description && t.kind);
    assert.ok(t.url.startsWith('https://poe2db.tw/kr/'));
    assert.ok(t.verification.checkedAt && t.verification.sourceUrl);
    assert.equal(t.verification.patch, null);
  }
});
test('malformed, oversized, future and duplicate-ID backups are rejected', () => {
  assert.throws(() => parseBackup('{', terms), /JSON/);
  assert.throws(() => parseBackup(' '.repeat(2_000_001), terms), /2 MB/);
  assert.throws(() => parseBackup(JSON.stringify({ ...envelope([]), schemaVersion: 9 }), terms), /버전/);
  const r = record(); assert.throws(() => parseBackup(JSON.stringify(envelope([r, r])), terms), /중복/);
});
test('unsafe links and mismatched source timestamps are rejected', () => {
  const r = record(); r.sources[0].url = 'javascript:alert(1)'; assert.ok(validateData(envelope([r]), terms).length);
  const r2 = record(); r2.method.tablets.evidence[0].startSeconds = 1; assert.ok(validateData(envelope([r2]), terms).length);
  const r3 = record(); r3.method.atlas.nodes[0].poedbUrl = 'https://example.com'; assert.ok(validateData(envelope([r3]), terms).length);
});
test('unexpected fields and prototype pollution payload are rejected', () => {
  const data = JSON.stringify(envelope([record()])).replace('"records":', '"__proto__":{"polluted":true},"records":');
  assert.throws(() => parseBackup(data, terms), /알 수 없는 필드/); assert.equal({}.polluted, undefined);
});
test('legacy 0.1.0 extraction migration preserves all six strategies and their sources', () => {
  const result = parseBackup(JSON.stringify(seed), terms); assert.equal(result.data.records.length, 6);
  assert.match(result.note, /전략 6개/);
  for (const original of seed.strategies) {
    const restored = result.data.records.find(r => r.originId === original.id);
    assert.deepEqual(restored.method.steps, original.steps);
    assert.deepEqual(restored.method.constraints, original.constraints);
    assert.deepEqual(restored.method.reportedResults, original.reportedResults);
    assert.deepEqual(restored.method.atlas, original.atlas);
  }
});
test('version 1 personal backup migrates without losing edits or provenance', () => {
  const r = record(); r.method.name = '이전 시제품 개인 세팅'; r.method.tablets.items[0].count = null;
  delete r.method.content; delete r.method.tablets.usage;
  const legacy = { format: 'poe2-farming-personal', schemaVersion: 1, records: [r] };
  const raw = JSON.stringify(legacy), upgraded = parseBackup(raw, terms).data;
  assert.equal(upgraded.schemaVersion, 6);
  assert.equal(upgraded.records[0].method.name, r.method.name);
  assert.equal(upgraded.records[0].method.tablets.items[0].count, null);
  assert.equal(upgraded.records[0].originVersion, r.originVersion);
  assert.equal(upgraded.records[0].id, r.id);
  assert.equal(upgraded.records[0].createdAt, r.createdAt);
  const storage = memory(); storage.setItem(STORAGE_KEY, raw);
  const store = createStore(storage, terms); assert.deepEqual(store.read(), upgraded);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), upgraded, 'successful migration persists the clean current format');
  store.write(upgraded); assert.deepEqual(createStore(storage, terms).read(), upgraded);
});
test('malformed legacy backups are not silently repaired', () => {
  const r = record(); delete r.method.content; delete r.method.tablets.usage; delete r.method.tablets.items[0].remainingUses;
  assert.throws(() => parseBackup(JSON.stringify({ format: 'poe2-farming-personal', schemaVersion: 1, records: [r] }), terms));
});
test('unused tablets remain distinct from unknown values', () => {
  const empty = copyMethod(seed, seed.strategies.find(m => m.id === 'grand-expedition-chests'));
  assert.equal(empty.method.tablets.usage, 'not_used');
  assert.equal(empty.method.waystone.affixCount, null);
  const invalid = record(); invalid.method.atlas = null; assert.ok(validateData(envelope([invalid]), terms).length);
});
test('import merge skips identical records and preserves both conflicting versions', () => {
  const r = record(), changed = clone(r); changed.method.notes = '다른 기기';
  const same = mergeRecords([r], [r]); assert.equal(same.duplicates, 1); assert.equal(same.added, 0);
  const merged = mergeRecords([r], [changed], () => 'personal-restored');
  assert.equal(merged.conflicts, 1); assert.equal(merged.records.length, 2);
  assert.deepEqual(merged.records[0], r); assert.equal(merged.records[1].method.notes, '다른 기기');
});
test('invalid write leaves last good storage untouched', () => {
  const storage = memory(), store = createStore(storage, terms); store.read(); const data = envelope([record()]); store.write(data);
  const before = storage.getItem(STORAGE_KEY); data.records[0].method.name = '';
  assert.throws(() => store.write(data)); assert.equal(storage.getItem(STORAGE_KEY), before);
});
test('corrupt storage is not reset; explicit validated recovery is possible', () => {
  const storage = memory(); storage.setItem(STORAGE_KEY, '{broken'); const store = createStore(storage, terms);
  assert.throws(() => store.read()); assert.equal(store.raw(), '{broken'); assert.throws(() => store.write(envelope([])));
  assert.equal(storage.getItem(STORAGE_KEY), '{broken'); store.write(envelope([record()]), true);
  assert.equal(createStore(storage, terms).read().records.length, 1);
});
test('storage quota failures and cross-tab races cannot silently overwrite data', () => {
  const storage = memory(), first = createStore(storage, terms), second = createStore(storage, terms);
  first.read(); second.read(); first.write(envelope([record()])); const expected = storage.getItem(STORAGE_KEY);
  assert.throws(() => second.write(envelope([])), /다른 탭/); assert.equal(storage.getItem(STORAGE_KEY), expected);
  const failing = createStore({ getItem: () => null, setItem: () => { throw Error('quota'); } }, terms);
  failing.read(); assert.throws(() => failing.write(envelope([])), /quota/);
});
