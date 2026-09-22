import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { curateLibrary } from '../scripts/refresh-library.mjs';
import { editorData } from '../src/editor-data.js';
import { copyMethod, envelope, parseBackup, validateData, versionOf, createStore, STORAGE_KEY } from '../src/model.js';
import { tradePlan, tradeQuery } from '../src/trade.js';
import { comparisonRows } from '../src/catalog.js';
import { readLibrary, readOverrides, applyOverrides } from '../scripts/library-overrides.mjs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const source = read('../data/farming-methods.ko.json'), terms = read('../data/glossary.ko.json').terms;
const additions = read('../data/library-additions.ko.json');
const review = read('../data/library-review.ko.json');
const library = curateLibrary(source, additions, review);
const method = id => library.strategies.find(m => m.id === id);
const provenance = m => [m.sourceVideoId, m.patch, m.party, m.investment, m.reportedResults, m.executionEvidence, m.constraints, ...['tablets', 'waystone', 'map', 'atlas', 'masters'].map(k => m[k]?.evidence)];

test('served library matches research regeneration followed by operator overrides', async () => {
  const effective = await readLibrary('.');
  assert.deepEqual(effective, applyOverrides(library, await readOverrides('.')));
  assert.deepEqual(validateData(envelope(effective.strategies.map(m => copyMethod(effective, m))), terms), []);
});

test('curation is reproducible and preserves source evidence, uncertainty and stable strategy IDs', () => {
  const before = structuredClone(source);
  const baseline = curateLibrary(source, additions);
  assert.deepEqual(curateLibrary(source, additions, review), library);
  assert.deepEqual(source, before);
  assert.deepEqual(baseline.sources.slice(0, source.sources.length), source.sources);
  const active = source.strategies;
  assert.deepEqual(library.strategies.slice(0, active.length).map(m => m.id), active.map(m => m.id));
  assert.equal(library.strategies.length, 11);
  assert.ok(library.strategies.every(m => !('kind' in m)));
  for (const original of active) {
    const m = method(original.id);
    assert.deepEqual(provenance(baseline.strategies.find(m => m.id === original.id)), provenance(original));
    for (const key of ['sourceVideoId', 'patch', 'party', 'investment', 'reportedResults']) assert.deepEqual(m[key], original[key]);
    assert.equal(m.budget.amount, null);
    assert.equal(m.atlas?.fullTreeVerified, original.atlas?.fullTreeVerified);
    assert.equal(m.masters?.fullSetupVerified, m.id === 'azmeri-strongbox' ? true : original.masters?.fullSetupVerified);
    assert.ok(m.evidenceReview.note && m.evidenceReview.checkedAt === review.checkedAt);
  }
});

test('all library selections use registered options; every record validates and backs up', () => {
  const records = library.strategies.map(m => copyMethod(library, m));
  assert.deepEqual(validateData(envelope(records), terms), []);
  assert.deepEqual(parseBackup(JSON.stringify(envelope(records)), terms).data.records, records);
  assert.equal(parseBackup(JSON.stringify(library), terms).data.records.length, library.strategies.length);
  for (const m of library.strategies) {
    assert.ok(m.content.every(c => editorData.contents.includes(c)));
    assert.ok((m.map?.regions || []).every(r => editorData.regions.includes(r)));
    assert.ok((m.map?.biomes || []).every(b => editorData.biomes.includes(b)));
    assert.deepEqual(m.waystone?.options || [], []);
    for (const t of m.tablets.items) for (const o of t.options) assert.ok(editorData.modifiers.some(c => c.id === o.modifierId && c.tablets.includes(t.name)));
    for (const n of m.atlas?.nodes || []) assert.ok(editorData.atlas.some(c => c.name === n.name && c.choices.includes(n.choice) && c.url === n.poedbUrl));
    for (const c of m.masters?.choices || []) { assert.ok(c.nodes.length <= 4); assert.ok(c.nodes.every(n => editorData.masters.some(a => a.name === n.name && a.master === c.name))); }
  }
});

test('five additions preserve selection evidence and distinguish caption review from complete setup verification', () => {
  assert.equal(additions.strategies.length, 5);
  assert.equal(new Set(library.strategies.map(m => m.id)).size, library.strategies.length);
  for (const s of additions.sources) {
    assert.ok(['en', 'ko'].includes(s.language));
    assert.ok(s.audience.views >= additions.selectionPolicy.minimumViews);
    assert.match(s.audience.checkedAt, /^\d{4}-\d\d-\d\d$/);
    assert.ok(s.titleOriginal && s.reviewNote);
  }
  for (const m of additions.strategies) {
    assert.ok(m.creatorGuide.url.startsWith('https://'));
    assert.ok(m.creatorGuide.section && m.creatorGuide.note);
    assert.ok(m.steps.length >= 3);
    assert.equal(m.reportedResults.netProfitPerHour, null);
    assert.equal(m.budget.amount, null);
    assert.equal(m.atlas.fullTreeVerified, false);
    assert.equal(m.masters.fullSetupVerified, false);
  }
  const breach = method('breach-rare-equipment');
  assert.equal(breach.tablets.items.reduce((n, t) => n + t.count, 0), 4);
  assert.equal(breach.tablets.items[0].options[0].min, 2, '0.5.5 video confirms reduction from three to two');
  assert.ok(tradePlan(breach, 'tablet', 0).conditions.some(c => c.value?.min === 2));
  assert.equal(tradeQuery(tradePlan(breach, 'tablet', 1)).name, '포위당한 레이클라스트');
  const lineage = method('lineage-boss-rush');
  assert.equal(lineage.tablets.items.length, 1, 'register only the identified environment tablet, not an invented complete set');
  assert.equal(lineage.tablets.items[0].name, '통달한 영토');
  assert.equal(tradeQuery(tradePlan(lineage, 'tablet', 0)).name, '통달한 영토');
  assert.equal(lineage.atlas.nodes[0].choice, '혈통 보조 발견 확률 50% 증가');
  assert.ok(lineage.unresolved.some(s => s.includes('구성')));
});

test('caption review covers all ten sources and corrects chapter, count and variant errors', () => {
  assert.equal(review.captionAudit.length, 10);
  assert.deepEqual(new Set(review.captionAudit.map(a => a.videoId)), new Set(library.sources.map(s => s.id)));
  for (const audit of review.captionAudit) {
    assert.equal(audit.status, 'reviewed');
    assert.ok(audit.segments > 0);
    assert.match(audit.sha256, /^[a-f0-9]{64}$/);
  }
  for (const m of library.strategies) assert.equal(m.evidenceReview.checkedAt, review.checkedAt);
  assert.equal(method('ritual-nameless-cycle').tablets.items[0].count, 2);
  assert.ok(method('abyss-currency').executionEvidence.some(e => e.videoId === '2IvZ4D9b5bs' && e.startSeconds === 351));
  assert.ok(method('abyss-rare-equipment').goals.includes('빛의 징조'));
  assert.ok(method('abyss-rare-equipment').executionEvidence.some(e => e.videoId === '2IvZ4D9b5bs' && e.startSeconds === 186));
  assert.equal(method('azmeri-strongbox').masters.choices[0].nodes.length, 4);
  const strongbox = method('azmeri-strongbox');
  assert.deepEqual(strongbox.masters.choices.find(c => c.name === '힐다').nodes.map(n => n.name), ['교배철', '혼백의 부름', '치명적인 적응', '점령한 영역']);
  assert.ok(strongbox.masters.evidence.some(e => e.startSeconds === 852 && e.videoId === 'Mi3d9GtgwkI'));
  assert.equal(strongbox.masters.fullSetupVerified, true);
  assert.equal(strongbox.atlas.fullTreeVerified, false);
  assert.ok(!strongbox.unresolved.some(s => s.includes('힐다의 완전한 선택')));
  assert.throws(() => curateLibrary(source, additions, {...review, strategies: [{id:'unknown'}]}), /재검토 대상/);
  assert.throws(() => curateLibrary(source, additions, {...review, strategies: [review.strategies[0], review.strategies[0]]}), /재검토 대상/);
});

test('supporting sources and review scope survive backup; missing supporting sources are rejected', () => {
  const r = copyMethod(library, method('abyss-rare-equipment'));
  assert.equal(r.sources.length, 3);
  const restored = parseBackup(JSON.stringify(envelope([r])), terms).data.records[0];
  assert.deepEqual(restored.sources, r.sources);
  assert.deepEqual(restored.method.evidenceReview, r.method.evidenceReview);
  assert.deepEqual(restored.method.supportingVideoIds, r.method.supportingVideoIds);
  r.sources = r.sources.filter(s => s.id === r.method.sourceVideoId);
  assert.ok(validateData(envelope([r]), terms).some(s => s.includes('보조 영상')));
});

test('new provenance survives backup; malformed audience metadata and duplicate additions are rejected', () => {
  const r = copyMethod(library, method('delirium-rush'));
  const roundtrip = parseBackup(JSON.stringify(envelope([r])), terms).data.records[0];
  assert.deepEqual(roundtrip.sources, r.sources);
  assert.deepEqual(roundtrip.method.creatorGuide, r.method.creatorGuide);
  r.sources[0].audience.views = -1;
  assert.ok(validateData(envelope([r]), terms).some(s => s.includes('views')));
  assert.throws(() => curateLibrary(source, {sources: [], strategies: [source.strategies[0]]}), /중복/);
});

test('normalized library conditions reach trade queries and comparison without inventing thresholds', () => {
  for (const m of library.strategies) for (const [i] of m.tablets.items.entries()) assert.ok(tradePlan(m, 'tablet', i).conditions.every(c => c.mapping));
  const tablet = tradePlan(method('tablet-drop'), 'tablet');
  assert.equal(tablet.conditions[0].value.min, 35);
  assert.ok(tablet.conditions.slice(1).every(c => c.value === undefined && !c.checked));
  assert.equal(tradeQuery(tradePlan(method('tablet-drop'), 'waystone')).filters.map_filters.filters.map_bonus.min, 100);
  assert.equal(tradeQuery(tradePlan(method('azmeri-strongbox'), 'waystone')).filters.map_filters.filters.map_rare_monsters.min, 100);
  assert.equal(tradeQuery(tradePlan(method('cleansed-fracturing'), 'waystone')).filters.map_filters.filters.map_packsize, undefined);
  const rows = comparisonRows([method('tablet-drop'), method('azmeri-strongbox')].map(method => ({ method })));
  assert.match(rows.find(r => r.id === 'waystoneDropChance').values[0].join(), /100/);
  assert.match(rows.find(r => r.id === 'monsterRarity').values[1].join(), /100/);
});

test('complete master alternatives replace exactly one confirmed ability, never combine all variants', () => {
  const [base, unusual, expedition] = method('tablet-drop').masters.choices;
  for (const [alternative, excluded, included] of [[unusual, '기나긴 나날', '전해지지 않은 역사'], [expedition, '예기치 못한 위협', '동방의 지식']]) {
    assert.equal(alternative.nodes.length, 4);
    assert.ok(!alternative.nodes.some(n => n.name === excluded));
    assert.ok(alternative.nodes.some(n => n.name === included));
    assert.equal(alternative.nodes.filter(n => base.nodes.some(b => b.name === n.name)).length, 3);
  }
});

test('old personal copies retain their bytes and provenance while detecting the library update', () => {
  const m = source.strategies.find(m => m.id === 'tablet-drop'), record = copyMethod(source, m);
  record.method.notes = '개인 메모 보존';
  const original = JSON.stringify(envelope([record]));
  const storage = { getItem: key => key === STORAGE_KEY ? original : null, setItem: () => assert.fail('read must not write') };
  const result = createStore(storage, terms).read();
  assert.deepEqual(result.records, [record]);
  assert.notEqual(record.originVersion, versionOf(library, method(m.id)));
});
