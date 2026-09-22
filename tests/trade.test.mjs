import test from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { blankRecord, makeModifier } from '../src/model.js';
import { editorData } from '../src/editor-data.js';
import { tradeData } from '../src/trade-data.js';
import { tradePlan, tradeQuery, tradeUrl } from '../src/trade.js';

const tablet = editorData.modifiers.find(m => m.metric === 'omenChance');
const waystone = editorData.waystoneModifiers.find(m => m.family === 'MapPlayersGainReducedFlaskCharges');
function example() {
  const m = blankRecord().method;
  m.tablets.items = [{ name: '의식 서판', count: 4, options: [makeModifier(tablet.id, 'required', 60)] }];
  m.waystone.options = [makeModifier(waystone.id, 'required')];
  return m;
}

test('official URL round trips gzip query directly and encodes the selected league', async () => {
  const query = tradeQuery(tradePlan(example(), 'tablet'));
  assert.equal(query.status.option, 'securable');
  for (const league of [undefined, 'Hardcore Forbidden Rites', '리그 / 이름']) {
    const url = new URL(await tradeUrl(query, league));
    assert.equal(url.origin, 'https://poe.kakaogames.com');
    const segments = url.pathname.split('/');
    assert.equal(decodeURIComponent(segments.at(-2)), league ?? 'Forbidden Rites');
    assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(segments.at(-1), 'base64url'))), query);
    assert.equal(query.query, undefined);
  }
  for (const invalid of ['', ' ', 'bad\nleague', 'a'.repeat(101)]) await assert.rejects(tradeUrl(query, invalid));
});

test('tablet minima, type and unique base/name are preserved without quantity or private data', () => {
  const m = example(); m.name = 'PRIVATE_NAME'; m.notes = 'PRIVATE_NOTES';
  const before = structuredClone(m), q = tradeQuery(tradePlan(m, 'tablet'));
  assert.equal(q.type, '의식 서판');
  assert.equal(q.filters.type_filters.filters.category.option, 'map.tablet');
  assert.deepEqual(q.stats[0].filters[0].value, { min: 60 });
  assert.doesNotMatch(JSON.stringify(q), /PRIVATE|remainingUses|count|sources|evidence/);
  assert.deepEqual(m, before);
  m.tablets.items[0].name = '신념의 자유';
  assert.equal(tradeQuery(tradePlan(m, 'tablet')).name, '신념의 자유');
  m.tablets.items[0].options[0] = makeModifier(tablet.id, 'required', 0);
  assert.equal(tradeQuery(tradePlan(m, 'tablet')).stats[0].filters[0].value.min, 0);
});

test('exact waystone fields, unknowns and negated numeric ranges have distinct meanings', () => {
  const m = example(); let q = tradeQuery(tradePlan(m, 'waystone'));
  assert.equal(q.filters.map_filters, undefined); assert.equal(q.filters.misc_filters, undefined);
  assert.deepEqual(q.stats[0].filters[0].value, { min: -24, max: -20 });
  m.waystone.tier = 16; m.waystone.affixCount = 8; m.waystone.corrupted = false;
  q = tradeQuery(tradePlan(m, 'waystone'));
  assert.deepEqual(q.filters.map_filters.filters.map_tier, { min: 16, max: 16 });
  assert.equal(q.filters.misc_filters.filters.corrupted.option, 'false');
  assert.deepEqual(q.stats.at(-1).filters[0], { id: 'pseudo.pseudo_number_of_affix_mods', value: { min: 8, max: 8 } });
  m.waystone.corrupted = true;
  assert.equal(tradeQuery(tradePlan(m, 'waystone')).filters.misc_filters.filters.corrupted.option, 'true');
  const fixed = editorData.waystoneModifiers.find(x => !x.text.split(' · ')[0].includes('—') && (tradeData.mappings[x.id]?.matcher.match(/#/g) || []).length === 1);
  assert.ok(fixed);
  m.waystone.options = [makeModifier(fixed.id, 'required')];
  const value = tradeQuery(tradePlan(m, 'waystone')).stats[0].filters[0].value;
  assert.equal(value.min, value.max); assert.ok(Number.isFinite(value.min));
});

test('unknown and optional conditions require selection, avoid excludes every equivalent ID at any roll', () => {
  const m = example(), multi = editorData.modifiers.find(x => tradeData.mappings[x.id]?.ids.length > 1);
  m.tablets.items[0].options = ['unknown', 'optional', 'alternative', 'not_applicable', 'recommended', 'avoid'].map(p => makeModifier(multi.id, p, 20));
  const plan = tradePlan(m, 'tablet'), q = tradeQuery(plan), ids = tradeData.mappings[multi.id].ids;
  assert.deepEqual(plan.conditions.map(c => c.checked), [false, false, false, false, true, true]);
  assert.equal(q.stats[0].type, 'count'); assert.equal(q.stats[0].value.min, 1);
  assert.deepEqual(q.stats.slice(1), ids.map(id => ({ type: 'not', filters: [{ id }] })));
  assert.equal(tradeQuery(plan, ['0']).stats[0].filters.length, ids.length);
  assert.deepEqual(tradeQuery(plan, []).stats, [{ type: 'and', filters: [] }]);
});

test('unmapped legacy text and unsupported catalog entries cannot silently become search filters', () => {
  const m = example(), missing = editorData.modifiers.find(x => !tradeData.mappings[x.id]);
  m.tablets.items[0].options.push(makeModifier(missing.id, 'required'));
  m.tablets.items[0].options.push({ text: '확인되지 않은 옛 설명', priority: 'required', min: null });
  const plan = tradePlan(m, 'tablet');
  assert.deepEqual(plan.conditions.map(c => c.checked), [true, false, false]);
  assert.throws(() => tradeQuery(plan, ['1']), /ID/);
  assert.throws(() => tradeQuery(plan, ['2']), /ID/);
  delete m.tablets.items[0].options[0].modifierId;
  assert.ok(tradePlan(m, 'tablet').conditions[0].mapping);
  m.tablets.items[0].name = '알 수 없는 서판';
  assert.throws(() => tradePlan(m, 'tablet'), /명칭/);
  m.waystone = null; assert.throws(() => tradePlan(m, 'waystone'), /세팅/);
});

test('published mapping inventory has explicit IDs, reviewed gaps and all waystone primary effects', () => {
  assert.equal(Object.keys(tradeData.mappings).length, 156);
  assert.equal(editorData.modifiers.filter(m => !tradeData.mappings[m.id]).length, 3);
  assert.ok(editorData.waystoneModifiers.every(m => tradeData.mappings[m.id]?.primaryOnly));
  assert.ok(Object.values(tradeData.mappings).every(m => m.ids.length && m.ids.every(id => /^explicit\.stat_\d+$/.test(id))));
  assert.equal(tradeData.liveVerified, false);
});
