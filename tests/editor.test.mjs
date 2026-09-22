import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blankRecord, envelope, validateData, parseBackup, makeModifier, investmentText, copyMethod } from '../src/model.js';
import { editorData } from '../src/editor-data.js';
import { selectableAtlas, modifierLabel, atlasGroups, atlasGroupLabel } from '../src/editor.js';
const terms = JSON.parse(readFileSync(new URL('../data/glossary.ko.json', import.meta.url))).terms;
const seed = JSON.parse(readFileSync(new URL('../data/farming-methods.ko.json', import.meta.url)));

test('environment conversion rules retain source node choices and classifications survive backups', () => {
  assert.equal(editorData.biomes.length, 12);
  const conversions = editorData.atlas.filter(n => n.choices.length && n.description.includes('다른 환경으로도 간주됨'));
  assert.equal(editorData.biomeRules.length, conversions.length);
  for (const rule of editorData.biomeRules) {
    const node = conversions.find(n => n.id === rule.nodeId);
    assert.deepEqual(rule.choices, node.choices);
    assert.equal(rule.url, node.url);
    assert.ok(rule.biomes.every(b => editorData.biomes.includes(b)));
    assert.ok(rule.choices.every(b => editorData.biomes.includes(b)));
  }
  const r = blankRecord(); r.method.map.biomes = [...editorData.biomes];
  assert.deepEqual(parseBackup(JSON.stringify(envelope([r])), terms).data.records[0].method.map.biomes, editorData.biomes);
});

test('tablet counts allow unknown or 1–4 and reject out of range backups', () => {
  const r = copyMethod(seed, seed.strategies[0]);
  for (const count of [null, 1, 4]) {
    r.method.tablets.items[0].count = count;
    assert.deepEqual(validateData(envelope([r]), terms), []);
  }
  for (const count of [0, 5, 1.5]) {
    r.method.tablets.items[0].count = count;
    assert.throws(() => parseBackup(JSON.stringify(envelope([r])), terms));
  }
});

test('five master abilities fail validation and import without changing the source', () => {
  const r = blankRecord(), nodes = editorData.masters.filter(a => a.master === '자도').slice(0, 5).map(a => ({ name: a.name, choice: null, basis: 'personal', poedbUrl: 'https://poe2db.tw/kr/Masters_of_the_Atlas' }));
  r.method.masters.choices.push({ name: '자도', role: '', nodes: nodes.slice(0, 4) });
  assert.deepEqual(validateData(envelope([r]), terms), []);
  r.method.masters.choices[0].nodes = nodes;
  assert.throws(() => parseBackup(JSON.stringify(envelope([r])), terms), /최대 4개/);
  assert.equal(r.method.masters.choices[0].nodes.length, 5);
});

test('region snapshot covers every DB entry and choice nodes use Korean alphabetical order', () => {
  assert.equal(editorData.regionEntries.length, 173);
  assert.equal(editorData.regions.length, 159);
  assert.deepEqual(editorData.regions, [...new Set(editorData.regionEntries.map(r => r.name))].sort((a, b) => a.localeCompare(b, 'ko')));
  assert.ok(editorData.regionEntries.every(r => r.url.startsWith('https://poe2db.tw/kr/')));
  const allMaps = blankRecord(); allMaps.method.map.regions = [...editorData.regions];
  assert.deepEqual(validateData(envelope([allMaps]), terms), []);
  assert.deepEqual(parseBackup(JSON.stringify(envelope([allMaps])), terms).data.records[0].method.map.regions, editorData.regions);
  assert.equal(selectableAtlas.length, 44);
  assert.ok(selectableAtlas.every(n => n.choices.length > 1));
  assert.deepEqual(selectableAtlas.map(n => n.name), selectableAtlas.map(n => n.name).sort((a, b) => a.localeCompare(b, 'ko')));
  assert.ok(!selectableAtlas.some(n => n.name === '산업의 진보'));
  for (const mod of editorData.modifiers) {
    assert.ok(['prefix', 'suffix'].includes(mod.affix));
    assert.match(modifierLabel(mod), mod.affix === 'prefix' ? /접두/ : /접미/);
    assert.ok(modifierLabel(mod).includes(mod.tablets.length === 8 ? '공통' : mod.tablets.join(' / ') + ' 전용'));
  }
});
test('waystone limits apply to storage and imports, without clamping values', () => {
  const r = blankRecord(); r.method.waystone.tier = 16; r.method.waystone.affixCount = 8;
  assert.deepEqual(validateData(envelope([r]), terms), []);
  r.method.waystone.tier = 17; assert.ok(validateData(envelope([r]), terms).length);
  r.method.waystone.tier = 16; r.method.waystone.affixCount = 9;
  assert.throws(() => parseBackup(JSON.stringify(envelope([r])), terms), /0~8/);
  assert.equal(r.method.waystone.affixCount, 9);
});

test('waystone catalogue selections round trip and reject text tampering, wrong domain and duplicate families', () => {
  assert.equal(editorData.waystoneModifiers.length, 80);
  assert.equal(new Set(editorData.waystoneModifiers.map(m => m.id)).size, 80);
  for (const mod of editorData.waystoneModifiers) {
    const r = blankRecord(); r.method.waystone.options = [makeModifier(mod.id, 'avoid')];
    assert.deepEqual(validateData(envelope([r]), terms), [], mod.id);
    assert.deepEqual(parseBackup(JSON.stringify(envelope([r])), terms).data.records[0].method.waystone.options, r.method.waystone.options);
    assert.ok(mod.sourceUrls.every(u => u.startsWith('https://poe2db.tw/kr/Waystones_')));
    r.method.waystone.options[0].text = '다른 설명';
    assert.throws(() => parseBackup(JSON.stringify(envelope([r])), terms), /ID·설명/);
  }
  const r = blankRecord(); r.method.waystone.options = [makeModifier(editorData.modifiers[0].id)];
  assert.ok(validateData(envelope([r]), terms).length);
  const sameFamily = editorData.waystoneModifiers.filter(m => m.family === 'MapMonsterFireDamage');
  r.method.waystone.options = sameFamily.slice(0, 2).map(m => makeModifier(m.id));
  assert.throws(() => parseBackup(JSON.stringify(envelope([r])), terms), /같은 계열/);
  r.method.waystone.options = [];
  r.method.tablets.usage = 'use'; r.method.tablets.items = [{ name: '의식 서판', count: 1, remainingUses: null, status: 'required', options: [makeModifier(sameFamily[0].id)] }];
  assert.ok(validateData(envelope([r]), terms).length);
});

test('atlas groups use source subtree and map level, preserving unknown conditions', () => {
  assert.equal(atlasGroupLabel(selectableAtlas.find(n => n.name === '산 숙련')), '아틀라스 · 지도 75레벨 이상');
  assert.equal(atlasGroupLabel(selectableAtlas.find(n => n.name === '선택받은 길')), '아틀라스 · 지도 70레벨 이상');
  assert.equal(atlasGroupLabel(selectableAtlas.find(n => n.name === '에센스 탐지')), '아틀라스 · 지도 레벨 조건 표기 없음');
  assert.equal(atlasGroupLabel(selectableAtlas.find(n => n.name === '고무된 제물')), '의식');
  assert.equal(atlasGroups.flatMap(g => g.nodes).length, 44);
  for (const group of atlasGroups) assert.deepEqual(group.nodes.map(n => n.name), group.nodes.map(n => n.name).sort((a, b) => a.localeCompare(b, 'ko')));
});
test('numeric budgets distinguish zero and unknown and preserve currency and basis', () => {
  const r = blankRecord(); assert.match(investmentText(r.method), /미확인/);
  r.method.budget = { amount: 0, currency: '신성한 오브' };
  assert.match(investmentText(r.method), /^0 신성한 오브/);
  r.method.budget.amount = 2.5; assert.deepEqual(validateData(envelope([r]), terms), []);
  const restored = parseBackup(JSON.stringify(envelope([r])), terms).data.records[0];
  assert.deepEqual(restored.method.budget, r.method.budget);
  r.method.budget.amount = -1; assert.ok(validateData(envelope([r]), terms).length);
});
test('structured modifiers reject unknown IDs, mismatched text, duplicate IDs and wrong tablet type', () => {
  const r = blankRecord(); r.method.tablets.usage = 'use';
  const mod = editorData.modifiers.find(m => m.tablets.length === 1 && m.tablets[0] === '의식 서판');
  r.method.tablets.items.push({ name: '의식 서판', count: null, remainingUses: null, status: 'required', options: [makeModifier(mod.id)] });
  assert.deepEqual(validateData(envelope([r]), terms), []);
  r.method.tablets.items[0].name = '방사능 노출 서판'; assert.ok(validateData(envelope([r]), terms).length);
  r.method.tablets.items[0].name = '의식 서판'; r.method.tablets.items[0].options[0].text = '조작한 설명'; assert.ok(validateData(envelope([r]), terms).length);
  r.method.tablets.items[0].options = [makeModifier(mod.id), makeModifier(mod.id)]; assert.ok(validateData(envelope([r]), terms).length);
  assert.throws(() => makeModifier('not-a-real-option'));
});
test('every selectable modifier and master ability resolves to a verified valid record', () => {
  assert.equal(new Set(editorData.modifiers.map(m => m.id)).size, editorData.modifiers.length);
  for (const mod of editorData.modifiers) {
    const r = blankRecord(); r.method.tablets.usage = 'use';
    r.method.tablets.items.push({ name: mod.tablets[0], count: null, remainingUses: null, status: 'required', options: [makeModifier(mod.id, 'required', mod.numeric ? 10 : null)] });
    assert.deepEqual(validateData(envelope([r]), terms), [], mod.id);
  }
  for (const ability of editorData.masters) {
    const r = blankRecord(); r.method.masters.choices.push({ name: ability.master, role: '', nodes: [{ name: ability.name, choice: null, basis: 'personal', poedbUrl: 'https://poe2db.tw/kr/Masters_of_the_Atlas' }] });
    assert.deepEqual(validateData(envelope([r]), terms), []);
    r.method.masters.choices[0].name = ability.master === '자도' ? '힐다' : '자도'; assert.ok(validateData(envelope([r]), terms).length);
  }
});
test('v2 migration preserves prose, patch, party, notes and investment without inventing a budget', () => {
  const record = copyMethod(seed, seed.strategies[0]); record.method.patch = '이전 사용자 패치'; record.method.map.regions.push('기존 사용자 지역');
  const old = { format: 'poe2-farming-personal', schemaVersion: 2, records: [record] };
  const result = parseBackup(JSON.stringify(old), terms).data;
  assert.equal(result.schemaVersion, 6); assert.deepEqual(result.records, old.records);
  assert.equal(result.records[0].method.budget, undefined);
});
