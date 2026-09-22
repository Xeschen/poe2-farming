import { groupedTablets, optionRequirementText } from './usability.js';
import { propertyLines, waystoneProperties, rangeText } from './waystones.js';
import { investmentText, investments, priorities, tabletUsages } from './model.js';

export const UNKNOWN = '__unknown';
export const NOT_APPLICABLE = '__not_applicable';
export const baseKey = id => id === 'tablet-drop' ? 'base' : `base:${id}`;
export const reviewLabel = entry => entry.personal ? '개인 수정 · 미검증' : entry.method.evidenceReview ? '자막 대조 · 실전 미검증' : entry.method.creatorGuide ? '영상·문서 정리 · 미검증' : '영상 추출 · 미검증';
export function tabletSummary(m) {
  if (m.tablets.usage === 'not_used') return '사용하지 않음';
  return groupedTablets(m).map(t => `${t.name} · ${t.count === null ? '개수 미확인' : `${t.count}개`} (${priorities[t.status]})${t.configurations > 1 ? ` · ${t.configurations}개 구성` : ''}`).join(' + ') || '미확인';
}
export function facetValues(m, key) {
  switch (key) {
    case 'goal': return m.goals.length ? m.goals : [UNKNOWN];
    case 'content': return m.content.length ? m.content : [UNKNOWN];
    case 'tablet': return m.tablets.usage === 'not_used' ? [NOT_APPLICABLE] : m.tablets.items.length ? [...new Set(m.tablets.items.map(t => t.name))] : [UNKNOWN];
    case 'master': return m.masters === null ? [NOT_APPLICABLE] : m.masters.choices.length ? [...new Set(m.masters.choices.map(c => c.name))] : [UNKNOWN];
    case 'patch': return [m.patch ?? UNKNOWN];
    case 'investment': return [m.investment];
    default: return [];
  }
}
export function filterEntries(entries, { query = '', scope = 'all', ...facets } = {}) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    if (scope !== 'all' && (scope === 'personal') !== !!entry.personal) return false;
    if (facets.review && (facets.review === 'personal') !== !!entry.personal) return false;
    const m = entry.method;
    const haystack = [m.name, m.summary, ...m.goals, ...m.content, ...m.tablets.items.map(t => t.name), ...(m.masters?.choices || []).map(c => c.name), m.patch || '미확인'].join(' ').toLocaleLowerCase();
    return words.every(word => haystack.includes(word)) && Object.entries(facets).every(([key, value]) => !value || key === 'review' || facetValues(m, key).includes(value));
  });
}
export function toggleComparison(ids, id) {
  if (ids.includes(id)) return ids.filter(value => value !== id);
  if (ids.length >= 3) throw Error('비교는 최대 3개까지 선택할 수 있습니다. 먼저 하나를 해제하세요.');
  return [...ids, id];
}
export function publicUrl(currentUrl, entries) {
  if (!entries.length || entries.length > 3 || entries.some(e => e.personal)) throw Error('개인 자료는 JSON으로 공유하세요. 링크에는 개인 세팅을 담지 않습니다.');
  const url = new URL(currentUrl); url.search = ''; url.hash = '';
  if (entries.length === 1) url.searchParams.set('method', entries[0].method.id);
  else entries.forEach(e => url.searchParams.append('compare', e.method.id));
  return url.href;
}
export function parseRoute(currentUrl, publicEntries) {
  const url = new URL(currentUrl), compare = url.searchParams.getAll('compare'), method = url.searchParams.get('method');
  const view = url.searchParams.get('view'), kind = url.searchParams.get('kind'), scope = url.searchParams.get('scope');
  if (['view', 'kind', 'scope'].some(key => url.searchParams.getAll(key).length > 1) ||
      (view !== null && view !== 'library') || (kind !== null && !['map', 'crafting'].includes(kind)) ||
      (scope !== null && scope !== 'personal') || ((kind || scope) && view !== 'library') ||
      (view && (method !== null || compare.length))) return { error: '주소의 페이지 또는 분류를 확인해주세요.' };
  const byId = new Map(publicEntries.map(e => [e.method.id, e.id]));
  if (compare.length) {
    if (method !== null || compare.length < 2 || compare.length > 3 || new Set(compare).size !== compare.length || compare.some(id => !byId.has(id))) return { error: '비교 주소의 파밍법을 찾을 수 없습니다. 기본 자료 2~3개를 다시 선택하세요.' };
    return { mode: 'compare', compareIds: compare.map(id => byId.get(id)) };
  }
  if (method !== null) {
    if (url.searchParams.getAll('method').length !== 1 || !byId.has(method)) return { error: '이 주소의 파밍법을 찾을 수 없습니다. 목록에서 다시 선택하세요.' };
    return { mode: 'detail', selected: byId.get(method) };
  }
  if (view === 'library') return { mode: 'library', filters: {}, scope: scope || 'all' };
  return { mode: 'home' };
}
const known = values => values.length ? values : ['미확인'];
const nodeLines = nodes => nodes.map(n => `${n.name}${n.choice ? ` → ${n.choice}` : ''}`);
const optionLines = options => options.map(o => `${priorities[o.priority]} · ${o.text}`);
const metricLines = (m, metric) => {
  const rows = [];
  if (m.tablets.usage === 'use') for (const t of m.tablets.items) for (const o of t.options.filter(o => o.metric === metric)) rows.push(`${t.name}: ${o.min === null ? '수치 미확인' : o.min + (o.unit || '')} · ${priorities[o.priority]}`);
  for (const o of m.waystone?.options || []) if (o.metric === metric) rows.push(`경로석: ${o.min === null ? '수치 미확인' : o.min + (o.unit || '')} · ${priorities[o.priority]}`);
  const property = waystoneProperties.find(p => p.key === metric), range = m.waystone?.properties?.[metric];
  if (property && (range?.min != null || range?.max != null)) rows.push(`경로석: ${rangeText(range)} (${property.unit})`);
  return rows.length ? rows : ['미확인'];
};
export function comparisonRows(entries) {
  const specs = [
    ['goals', '목적', m => known(m.goals)], ['content', '콘텐츠', m => known(m.content)],
    ['investment', '예상 투자 비용', m => [investmentText(m)]], ['patch', '출처 패치', m => [m.patch ?? '미확인']],
    ['tablets', '서판 구성', m => [tabletSummary(m), ...m.tablets.notes]],
    ['options', '서판 속성', m => m.tablets.usage === 'not_used' ? ['사용하지 않음'] : known(m.tablets.items.flatMap((t, i) => (t.options.length ? optionLines(t.options) : [optionRequirementText(t)]).map(o => `${t.name} 구성 ${i + 1} · ${o}`)))],
    ['waystone', '경로석', m => [`등급 ${m.waystone.tier ?? '미확인'} · 속성 수 ${m.waystone.affixCount ?? '미확인'} · ${m.waystone.corrupted === null ? '타락 여부 미확인' : m.waystone.corrupted ? '타락' : '비타락'}`, ...propertyLines(m.waystone), ...optionLines(m.waystone.options)]],
    ['monsterRarity', '몬스터 희귀도', m => metricLines(m, 'monsterRarity')], ['itemRarity', '아이템 희귀도', m => metricLines(m, 'itemRarity')],
    ['waystoneQuantity', '경로석 수량', m => metricLines(m, 'waystoneQuantity')], ['waystoneDropChance', '경로석 출현 확률', m => metricLines(m, 'waystoneDropChance')],
    ['map', '지도 · 환경', m => [...known(m.map.regions), `환경: ${m.map.biomes.join(' / ') || '미확인'}`]],
    ['conditions', '준비 조건', m => known(m.map.conditions)], ['supplies', '준비물', m => known(m.supplies)],
    ['atlas', '아틀라스 선택', m => [...known(nodeLines(m.atlas.nodes)), ...(m.atlas.otherPriorities || []), `전체 경로: ${m.atlas.fullTreeVerified ? '확인 표시 있음 · 재검증 필요' : '미검증'}`]],
    ['masters', '대가 선택', m => [...known(m.masters.choices.map(c => `${c.name} · ${c.role} · ${nodeLines(c.nodes).join(', ') || '노드 미확인'}`)), `전체 구성: ${m.masters.fullSetupVerified ? '영상 근거 있음' : '미검증'}`]],
    ['stop', '중단 조건 · 주의점', m => [...(m.stopConditions.length ? m.stopConditions : ['중단 조건 미확인']), ...m.constraints.map(c => c.text)]],
    ['unresolved', '미확인 사항', m => known(m.unresolved)],
    ['profit', '영상 수익 사례', m => [m.reportedResults.text, '검증된 시간당 순이익: 미확인']]
  ];
  return specs.map(([id, label, value]) => {
    const values = entries.map(e => value(e.method));
    return { id, label, values, different: new Set(values.map(v => JSON.stringify(v))).size > 1 };
  });
}
export { tabletUsages };
