import { migrateLegacyRecords } from './legacy.js';
import { editorData } from './editor-data.js';
import { allWaystoneModifiers, waystoneProperties } from './waystones.js';
export const FORMAT = 'poe2-farming-personal';
export const STORAGE_KEY = 'poe2-farming.personal.v1';
export const MAX_BYTES = 2_000_000;
export const priorities = { required: '필수', recommended: '권장', avoid: '회피', optional: '선택 사항', alternative: '대안', unknown: '미확인', not_applicable: '적용하지 않음' };
export const metrics = { monsterRarity: '몬스터 희귀도', itemRarity: '아이템 희귀도', waystoneQuantity: '경로석 수량', waystoneDropChance: '경로석 출현 확률', buriedStrongboxes: '묻힌 금고 수', additionalAzmeriSpirits: '추가 아즈메리 혼백 수', additionalMapModifiers: '추가 지도 속성 수', omenChance: '징조 등장 확률' };
export const investments = { unknown: '미확인', low: '낮음', low_to_medium: '낮음~중간', medium: '중간', medium_to_high: '중간~높음', high: '높음' };
export const tabletUsages = { use: '지도에 사용', not_used: '사용하지 않음', unknown: '미확인' };
const contentTags = {
  'azmeri-strongbox': ['아즈메리 혼백', '금고', '탐험'], 'grand-expedition-chests': ['대탐험'], 'grand-expedition-runes': ['대탐험'],
  'ritual-nameless-cycle': ['의식'], 'tablet-drop': ['서판', '탐험'], 'cleansed-fracturing': ['소환의 원', '환영', '의식']
};
export const clone = value => structuredClone(value);
export const newId = () => `personal-${crypto.randomUUID()}`;
export const envelope = records => ({ format: FORMAT, schemaVersion: 6, records });
export const currencies = ['엑잘티드 오브', '신성한 오브', '카오스 오브'];
export function investmentText(m) {
  return m.budget?.amount != null ? `${m.budget.amount} ${m.budget.currency} / 지도 1회당` : m.investment === 'unknown' ? '비용 미확인' : `금액 미확인 · 영상 분류 ${investments[m.investment]}`;
}
export function modifierText(mod, value) { return value === null || !mod.numeric ? mod.text : mod.template.replace('{value}', String(value)); }
export function makeModifier(id, priority = 'unknown', min = null) {
  const mod = [...editorData.modifiers, ...allWaystoneModifiers].find(m => m.id === id);
  if (!mod) throw Error('등록되지 않은 속성입니다.');
  return { modifierId: id, text: modifierText(mod, min), priority, metric: mod.metric, min: mod.numeric ? min : null, unit: mod.unit };
}
export function versionOf(seed, method) {
  let hash = 2166136261;
  for (const c of JSON.stringify([method, seed.sources])) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return `${seed.schemaVersion}/${seed.extractedAt}/${(hash >>> 0).toString(16)}`;
}
export function normalizeMethod(method) {
  const m = clone(method);
  m.notes ??= '';
  m.stopConditions ??= [];
  m.content ??= contentTags[m.id] || [];
  m.tablets.usage ??= m.tablets.items.length ? 'use' : m.id === 'grand-expedition-chests' ? 'not_used' : 'unknown';
  m.tablets.items.forEach(t => { t.status ??= 'required'; t.remainingUses ??= null; });
  return m;
}
export function copyMethod(seed, method, id = newId()) {
  const now = new Date().toISOString();
  return { id, originId: method.id, originVersion: versionOf(seed, method), createdAt: now, updatedAt: now,
    method: normalizeMethod(method), sources: clone(seed.sources.filter(s => s.id === method.sourceVideoId || (method.supportingVideoIds || []).includes(s.id))) };
}
export function blankRecord() {
  const now = new Date().toISOString();
  return { id: newId(), originId: null, originVersion: null, createdAt: now, updatedAt: now, sources: [], method: {
    id: 'custom', name: '새 파밍법', content: [], sourceVideoId: null, goals: [], investment: 'unknown', budget: { amount: null, currency: '엑잘티드 오브' }, party: '미확인', patch: null, summary: '',
    tablets: { usage: 'not_used', items: [], notes: [], evidence: [] }, waystone: { tier: null, affixCount: null, corrupted: null, options: [], notes: [], evidence: [] },
    map: { regions: [], biomes: [], conditions: [], optional: [], evidence: [] }, atlas: { nodes: [], fullTreeVerified: false, evidence: [] },
    masters: { choices: [], fullSetupVerified: false, evidence: [] }, supplies: [], steps: [], executionEvidence: [], constraints: [],
    reportedResults: { text: '수익 미확인', netProfitPerHour: null, evidence: [] }, unresolved: [], notes: '', stopConditions: []
  } };
}
// The same strict contract protects both local storage and imported files.
const str = (min = 0, max = 4000) => ({ type: 'string', min, max });
const num = (min, max, integer = true) => ({ type: 'number', min, max, integer });
const nullable = schema => ({ nullable: schema });
const optional = schema => ({ optional: schema });
const arr = (item, max = 100) => ({ array: item, max });
const one = values => ({ enum: values });
const obj = properties => ({ object: properties });
const textList = arr(str(1));
const url = { url: true };
const videoId = { pattern: /^[A-Za-z0-9_-]{11}$/ };
const evidence = obj({ videoId, startSeconds: num(0, 86400), url });
const option = obj({ modifierId: optional(str(1, 150)), text: str(1), priority: one(Object.keys(priorities)), metric: nullable(one(Object.keys(metrics))), min: nullable(num(0, 100000, false)), unit: nullable(str(1, 20)) });
const node = obj({ name: str(1, 120), choice: nullable(str(1)), basis: one(['video', 'effect_matched', 'screen_and_effect', 'poedb_prerequisite', 'creator_guide', 'personal']), poedbUrl: url });
const waystonePropertySchema = obj(Object.fromEntries(waystoneProperties.map(p => [p.key, optional(obj({ min: nullable(num(0, 100000, p.key === 'revives')), max: nullable(num(0, 100000, p.key === 'revives')) }))])));
const methodSchema = obj({
  id: str(1, 150), name: str(1, 120), content: textList, sourceVideoId: nullable(videoId), goals: textList,
  investment: one(Object.keys(investments)), party: str(1, 120), patch: nullable(str(1, 80)), summary: str(),
  budget: optional(obj({ amount: nullable(num(0, 100000000, false)), currency: one(currencies) })),
  tablets: obj({ usage: one(Object.keys(tabletUsages)), items: arr(obj({ name: str(1, 120), count: nullable(num(1, 4)), remainingUses: nullable(num(1, 1000)), status: one(Object.keys(priorities)), optionRequirement: optional(one(['unknown', 'unrestricted'])), options: arr(option) }), 20), notes: textList, evidence: arr(evidence) }),
  waystone: obj({ tier: nullable(num(1, 16)), affixCount: nullable(num(0, 8)), corrupted: nullable(one([true, false])), properties: optional(waystonePropertySchema), options: arr(option), notes: textList, evidence: arr(evidence) }),
  map: obj({ regions: arr(str(1), 500), biomes: textList, conditions: textList, optional: textList, evidence: arr(evidence) }),
  atlas: obj({ nodes: arr(node), otherPriorities: optional(textList), fullTreeVerified: one([true, false]), evidence: arr(evidence) }),
  masters: obj({ choices: arr(obj({ name: str(1, 120), role: str(), nodes: arr(node) })), fullSetupVerified: one([true, false]), evidence: arr(evidence) }),
  supplies: textList, steps: textList, executionEvidence: arr(evidence), constraints: arr(obj({ text: str(1), evidence: nullable(evidence), sourceUrl: optional(url) })),
  reportedResults: obj({ text: str(), netProfitPerHour: one([null]), evidence: arr(evidence), sampleMaps: optional(num(1, 100000)), fracturingOrbs: optional(num(0, 100000)), costExample: optional(obj({ currency: str(1, 120), perMapApprox: num(0, 100000, false), includes: str(), excludes: str(), priceDate: str(1, 40), sourceUrl: url })) }),
  unresolved: textList, notes: str(0, 12000), stopConditions: textList,
  creatorGuide: optional(obj({ url, section: str(1, 120), checkedAt: str(1, 40), note: str(1) })),
  supportingVideoIds: optional(arr(videoId, 20)),
  evidenceReview: optional(obj({ checkedAt: str(1, 40), scope: str(1), note: str(1) }))
});
const source = obj({ id: videoId, creator: str(1, 120), titleKo: str(1), publishedAt: str(1, 40), patch: nullable(str(1, 80)), patchEvidence: str(), language: str(1, 20), url,
  titleOriginal: optional(str(1)), audience: optional(obj({ views: num(0, Number.MAX_SAFE_INTEGER), checkedAt: str(1, 40), basis: str(1) })), reviewNote: optional(str(1)) });
const date = { pattern: /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/ };
const recordSchema = obj({ id: { pattern: /^personal-[a-zA-Z0-9-]{1,80}$/ }, originId: nullable(str(1, 150)), originVersion: nullable(str(1, 200)), createdAt: date, updatedAt: date, method: methodSchema, sources: arr(source) });
const dataSchema = obj({ format: one([FORMAT]), schemaVersion: one([6]), records: arr(recordSchema, 200) });
const without = (properties, key) => Object.fromEntries(Object.entries(properties).filter(([k]) => k !== key));
const legacyMethodSchema = obj({ ...without(methodSchema.object, 'content'), tablets: obj(without(methodSchema.object.tablets.object, 'usage')) });
const legacyDataSchema = obj({ ...dataSchema.object, schemaVersion: one([1]), records: arr(obj({ ...recordSchema.object, method: legacyMethodSchema }), 200) });
function validate(value, schema, path, errors) {
  const fail = reason => errors.push(`${path}: ${reason}`);
  if (schema.optional) { if (value !== undefined) validate(value, schema.optional, path, errors); return; }
  if (schema.nullable) { if (value !== null) validate(value, schema.nullable, path, errors); return; }
  if (schema.enum) { if (!schema.enum.includes(value)) fail('선택할 수 없는 값입니다.'); return; }
  if (schema.url) { try { const u = new URL(value); if (typeof value !== 'string' || u.protocol !== 'https:' || u.username || u.password || value.length > 2000) throw Error(); } catch { fail('올바른 HTTPS 주소가 필요합니다.'); } return; }
  if (schema.pattern) { if (typeof value !== 'string' || !schema.pattern.test(value)) fail('형식이 올바르지 않습니다.'); return; }
  if (schema.array) { if (!Array.isArray(value) || value.length > schema.max) { fail(`배열은 최대 ${schema.max}개입니다.`); return; } value.forEach((v, i) => validate(v, schema.array, `${path}[${i + 1}]`, errors)); return; }
  if (schema.object) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) { fail('객체가 필요합니다.'); return; }
    for (const key of Object.keys(value)) if (!Object.hasOwn(schema.object, key)) fail(`알 수 없는 필드: ${key}`);
    for (const [key, rule] of Object.entries(schema.object)) validate(value[key], rule, `${path}.${key}`, errors);
    return;
  }
  if (typeof value !== schema.type) { fail(schema.type === 'number' ? '숫자 또는 미확인(null)이 필요합니다.' : '문자열이 필요합니다.'); return; }
  if (schema.type === 'string' && (value.trim().length < schema.min || value.length > schema.max)) fail(`글자 수는 ${schema.min}~${schema.max}자여야 합니다.`);
  if (schema.type === 'number' && (!Number.isFinite(value) || value < schema.min || value > schema.max || (schema.integer && !Number.isInteger(value)))) fail(`${schema.min}~${schema.max} 사이의 ${schema.integer ? '정수' : '숫자'}가 필요합니다.`);
}
export function validateData(data, glossary) {
  const errors = [];
  validate(data, dataSchema, '백업', errors);
  if (errors.length) return errors.slice(0, 12);
  const names = new Map(glossary.map(t => [t.nameKo, t]));
  const ids = new Set();
  for (const r of data.records) {
    if (ids.has(r.id)) errors.push('중복 개인 ID가 있습니다.');
    ids.add(r.id);
    if ((r.originId === null) !== (r.originVersion === null)) errors.push('원본 ID와 복사 버전은 함께 있어야 합니다.');
    const m = r.method;
    if (m.tablets.usage === 'not_used' && m.tablets.items.length) errors.push('서판을 사용하지 않는 구성에는 서판 행을 남길 수 없습니다.');
    for (const t of m.tablets.items) {
      if (t.optionRequirement === 'unrestricted' && t.options.length) errors.push('속성 제한 없음 상태에서는 서판 옵션을 지정할 수 없습니다.');
      if (names.get(t.name)?.kind !== '서판') errors.push(`서판 공식 명칭을 선택하세요: ${t.name}`);
      for (const o of t.options) if (o.modifierId) {
        const mod = editorData.modifiers.find(x => x.id === o.modifierId);
        if (!mod || !mod.tablets.includes(t.name)) { errors.push('서판 종류에 맞는 등록 속성을 선택하세요.'); continue; }
        if (o.text !== modifierText(mod, o.min) || o.metric !== mod.metric || o.unit !== mod.unit || (!mod.numeric && o.min !== null)) errors.push('서판 속성의 ID·수치·설명이 일치하지 않습니다.');
      }
      const structuredIds = t.options.map(o => o.modifierId).filter(Boolean);
      if (new Set(structuredIds).size !== structuredIds.length) errors.push('같은 서판 속성을 중복 선택할 수 없습니다.');
    }
    const waystoneFamilies = new Set();
    for (const o of m.waystone?.options || []) if (o.modifierId) {
      const mod = allWaystoneModifiers.find(x => x.id === o.modifierId);
      if (!mod) { errors.push('경로석의 등록 속성을 선택하세요.'); continue; }
      if (o.text !== mod.text || o.metric !== null || o.min !== null || o.unit !== null) errors.push('경로석 속성의 ID·설명이 일치하지 않습니다.');
      if (waystoneFamilies.has(mod.family)) errors.push('같은 계열의 경로석 속성을 중복 선택할 수 없습니다.');
      waystoneFamilies.add(mod.family);
    }
    for (const p of waystoneProperties) {
      const range = m.waystone?.properties?.[p.key];
      if (range?.min != null && range?.max != null && range.min > range.max) errors.push(`method.waystone.properties.${p.key}.max: ${p.label} 최대값은 최소값 이상이어야 합니다.`);
    }
    for (const n of [...(m.atlas?.nodes || []), ...(m.masters?.choices || []).flatMap(c => c.nodes)]) {
      if (!names.get(n.name)?.kind.includes('패시브')) errors.push(`공식 패시브 명칭을 선택하세요: ${n.name}`);
      if (!n.poedbUrl.startsWith('https://poe2db.tw/kr/')) errors.push('노드 링크는 PoEDB 한국어 주소여야 합니다.');
    }
    for (const c of m.masters?.choices || []) {
      if (c.nodes.length > 4) errors.push(`대가 구성 ${m.masters.choices.indexOf(c) + 1}: 능력은 최대 4개까지 선택할 수 있습니다. 현재 ${c.nodes.length}개를 선택했습니다.`);
      if (names.get(c.name)?.kind !== '대가') errors.push(`공식 대가 명칭을 선택하세요: ${c.name}`);
      for (const n of c.nodes) {
        const ability = editorData.masters.find(a => a.name === n.name);
        if (!ability || ability.master !== c.name) errors.push(`${c.name}에게 속하지 않는 능력입니다: ${n.name}`);
      }
    }
    const sources = new Set(r.sources.map(s => s.id));
    if (sources.size !== r.sources.length) errors.push('중복 출처 ID가 있습니다.');
    if (m.sourceVideoId !== null && !sources.has(m.sourceVideoId)) errors.push('주 출처 정보가 없습니다.');
    for (const id of m.supportingVideoIds || []) if (!sources.has(id)) errors.push('보조 영상 출처 정보가 없습니다.');
    const evidenceRows = [...m.tablets.evidence, ...(m.waystone?.evidence || []), ...(m.map?.evidence || []), ...(m.atlas?.evidence || []), ...(m.masters?.evidence || []), ...m.executionEvidence, ...m.reportedResults.evidence, ...m.constraints.map(c => c.evidence).filter(Boolean)];
    for (const e of evidenceRows) {
      const u = new URL(e.url);
      if (!sources.has(e.videoId) || u.hostname !== 'www.youtube.com' || u.pathname !== '/watch' || u.searchParams.get('v') !== e.videoId || u.searchParams.get('t') !== `${e.startSeconds}s`) errors.push('타임스탬프와 영상 출처가 일치하지 않습니다.');
    }
    for (const s of r.sources) {
      const u = new URL(s.url);
      if (u.hostname !== 'www.youtube.com' || u.pathname !== '/watch' || u.searchParams.get('v') !== s.id) errors.push('영상 출처 주소가 ID와 일치하지 않습니다.');
    }
  }
  return errors.slice(0, 12);
}
function migrateRecords(records) {
  return migrateLegacyRecords(records, corrections => {
    const errors = [];
    validate(corrections, arr(obj({ text: str(1), url, supersedes: optional(evidence) })), '이전 정정 자료', errors);
    if (errors.length) throw Error(errors.slice(0, 12).join('\n'));
  });
}
export function parseBackup(raw, glossary) {
  if (new TextEncoder().encode(raw).length > MAX_BYTES) throw Error('파일은 2 MB 이하여야 합니다.');
  let data;
  try { data = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { throw Error('JSON 문법이 올바르지 않습니다.'); }
  let note = '';
  if (['0.1.0', '0.2.0'].includes(data?.schemaVersion) && Array.isArray(data.strategies) && Array.isArray(data.sources)) {
    if (!data.strategies.length || data.strategies.length > 200 || new Set(data.strategies.map(m => m.id)).size !== data.strategies.length) throw Error('추출본의 전략 개수나 중복 ID를 확인하세요.');
    try { const migrated = migrateRecords(data.strategies.map(method => ({ method }))); const records = migrated.records.map(r => copyMethod(data, r.method)); note = `${data.schemaVersion} 라이브러리 변환 · 전략 ${records.length}개`; data = envelope(records); } catch { throw Error('이전 추출본의 필수 자료가 누락됐습니다.'); }
  }
  if ([1, 2, 3, 4, 5].includes(data?.schemaVersion)) {
    const version = data.schemaVersion;
    const migrated = migrateRecords(data.records);
    data = { ...data, records: migrated.records };
    if (version === 1) {
      const legacyErrors = []; validate(data, legacyDataSchema, '이전 백업', legacyErrors);
      if (legacyErrors.length) throw Error(legacyErrors.slice(0, 12).join('\n'));
      data.records = data.records.map(r => ({ ...r, method: normalizeMethod(r.method) }));
    }
    data.schemaVersion = 6;
    note = '이전 백업을 버전 6으로 변환했습니다. 제외된 기록 ' + migrated.removed + '개. 남은 개인 세팅과 출처는 유지됩니다.';
  }
  if (data?.schemaVersion !== 6) throw Error('지원하지 않는 데이터 버전입니다.');
  const errors = validateData(data, glossary);
  if (errors.length) throw Error(errors.join('\n'));
  return { data, note };
}
export function mergeRecords(existing, incoming, idFactory = newId) {
  const records = clone(existing);
  let added = 0, duplicates = 0, conflicts = 0;
  for (const r of incoming) {
    const old = records.find(x => x.id === r.id);
    if (old && JSON.stringify(old) === JSON.stringify(r)) { duplicates++; continue; }
    const copy = clone(r);
    if (old) { copy.id = idFactory(); conflicts++; }
    records.push(copy); added++;
  }
  return { records, added, duplicates, conflicts };
}
export function createStore(storage, glossary) {
  let expected, blocked = false;
  return {
    read() {
      try {
        expected = storage.getItem(STORAGE_KEY);
        if (expected === null) return envelope([]);
        const parsed = parseBackup(expected, glossary);
        if (JSON.parse(expected.replace(/^\uFEFF/, '')).schemaVersion !== 6) this.write(parsed.data);
        return parsed.data;
      }
      catch (error) { blocked = true; throw error; }
    },
    write(data, recover = false) {
      const errors = validateData(data, glossary);
      if (errors.length) throw Error(errors.join('\n'));
      if (blocked && !recover) throw Error('기존 저장 자료를 읽지 못했습니다. 원본을 백업한 뒤 복원하세요.');
      if (storage.getItem(STORAGE_KEY) !== expected) throw Error('다른 탭에서 자료가 변경됐습니다. 현재 자료를 내보낸 뒤 새로고침하세요.');
      const raw = JSON.stringify(data);
      if (new TextEncoder().encode(raw).length > MAX_BYTES) throw Error('개인 데이터가 2 MB를 초과합니다.');
      storage.setItem(STORAGE_KEY, raw);
      expected = raw; blocked = false;
    },
    raw() { return expected; }
  };
}
