import { optionRequirementText } from './usability.js';
import { editorData } from './editor-data.js';
import { tradeData } from './trade-data.js';
import { waystoneEffectFor, waystoneProperties } from './waystones.js';

const normalize = text => text.replace(/\([^()]*[—–][^()]*\)|\{value\}|-?\d+(?:\.\d+)?/g, '#').replace(/\s|·/g, '');
function mappingFor(option, kind) {
  if (option.modifierId) {
    if (tradeData.mappings[option.modifierId]) return tradeData.mappings[option.modifierId];
    const effect = waystoneEffectFor(option.modifierId);
    if (!effect) return null;
    const maps = effect.variantIds.map(id => tradeData.mappings[id]);
    if (maps.some(m => !m) || new Set(maps.map(m => JSON.stringify([m.ids, m.negate]))).size !== 1) return null;
    return maps[0];
  }
  const catalog = kind === 'tablet' ? editorData.modifiers : editorData.waystoneModifiers;
  const matches = catalog.filter(m => normalize(m.text) === normalize(option.text)).map(m => tradeData.mappings[m.id]).filter(Boolean);
  const unique = [...new Map(matches.map(m => [JSON.stringify(m), m])).values()];
  return unique.length === 1 ? unique[0] : null;
}
function bounds(option, mapping, kind) {
  // Avoid means the effect is absent, regardless of its roll.
  if (option.priority === 'avoid') return undefined;
  let min, max;
  if (kind === 'tablet' && option.min !== null) min = option.min;
  else if (kind === 'waystone' && (mapping.matcher.match(/#/g) || []).length === 1) {
    const line = option.text.split(' · ')[0];
    const range = line.match(/\((-?\d+(?:\.\d+)?)[—–](-?\d+(?:\.\d+)?)\)/);
    if (range) { min = Number(range[1]); max = Number(range[2]); }
    else {
      const numbers = line.match(/-?\d+(?:\.\d+)?/g) || [];
      if (numbers.length === 1) min = max = Number(numbers[0]);
    }
  }
  if (min === undefined && max === undefined) return undefined;
  if (mapping.negate) [min, max] = [max === undefined ? undefined : -max, min === undefined ? undefined : -min];
  return { ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
}
export function tradePlan(method, kind, index = 0) {
  const item = kind === 'waystone' ? method.waystone : method.tablets.items[index];
  if (!item) throw Error('검색할 세팅이 없습니다.');
  const registered = kind === 'waystone' ? {} : tradeData.tabletTypes[item.name];
  const type = !registered ? null : kind === 'waystone' ? {} : registered.name ? { name: item.name, type: Object.entries(tradeData.tabletTypes).find(([, t]) => !t.name && t.type === registered.type)?.[0] } : { type: item.name };
  if (!type) throw Error('이 서판의 거래소 아이템 명칭은 아직 연결되지 않았습니다.');
  const conditions = item.options.map((o, i) => {
    const mapping = mappingFor(o, kind);
    return { key: String(i), text: o.text, priority: o.priority, mapping,
      value: mapping ? bounds(o, mapping, kind) : undefined,
      checked: !!mapping && ['required', 'recommended', 'avoid'].includes(o.priority) };
  });
  const notes = kind === 'waystone' ? ['통합 옵션은 등급·수치를 제한하지 않습니다. 이전에 저장한 옵션의 수치 범위는 유지합니다.', '아이템 희귀도·몬스터 희귀도·무리 규모 등은 수치 조건으로 검색합니다. 경로석 자체에 표시되는 값이며 아틀라스·대가 효과는 합산하지 않습니다.'] : ['서판 개수는 구매할 수량이며 개별 아이템 검색 조건에 넣지 않습니다.', '목표 수치는 아이템 자체 수치 기준입니다. 아틀라스·대가의 증폭은 반영하지 않습니다.'];
  if (kind === 'tablet' && !item.options.length) notes.unshift(optionRequirementText(item) + (item.optionRequirement === 'unrestricted' ? ' · 아이템 종류로 검색합니다.' : ' · 아이템 종류만 검색하므로 필요한 속성은 별도 확인하세요.'));
  return { kind, title: kind === 'waystone' ? '경로석' : item.name, type, conditions, notes, properties: kind === 'waystone' ? structuredClone(item.properties || {}) : {}, tier: kind === 'waystone' ? item.tier : null, corrupted: kind === 'waystone' ? item.corrupted : null, affixCount: kind === 'waystone' ? item.affixCount : null };
}
export function tradeQuery(plan, selectedKeys = plan.conditions.filter(c => c.checked).map(c => c.key)) {
  const filters = { type_filters: { filters: { category: { option: plan.kind === 'waystone' ? 'map.waystone' : 'map.tablet' } } } };
  if (plan.tier !== null) filters.map_filters = { filters: { map_tier: { min: plan.tier, max: plan.tier } } };
  if (plan.kind === 'waystone') for (const p of waystoneProperties) {
    const range = plan.properties?.[p.key]; if (!range) continue;
    const value = Object.fromEntries(['min', 'max'].filter(k => range[k] != null).map(k => [k, range[k]]));
    if (!Object.keys(value).length) continue;
    if (Object.values(value).some(v => !Number.isFinite(v) || v < 0 || v > 100000 || (p.key === 'revives' && !Number.isInteger(v)))) throw Error(`${p.label}: 0 이상의 올바른 수치를 입력하세요.`);
    if (value.min != null && value.max != null && value.min > value.max) throw Error(`${p.label}: 최대값은 최소값 이상이어야 합니다.`);
    filters.map_filters ??= { filters: {} };
    filters.map_filters.filters[p.filter] = value;
  }
  if (plan.corrupted !== null) filters.misc_filters = { filters: { corrupted: { option: String(plan.corrupted) } } };
  const stats = [];
  for (const c of plan.conditions.filter(c => selectedKeys.includes(c.key))) {
    if (!c.mapping) throw Error('거래소 ID가 확인되지 않은 속성입니다.');
    const options = c.mapping.ids.map(id => ({ id, ...(c.value ? { value: c.value } : {}) }));
    if (c.priority === 'avoid') options.forEach(filter => stats.push({ type: 'not', filters: [filter] }));
    else if (options.length > 1) stats.push({ type: 'count', value: { min: 1 }, filters: options });
    else stats.push({ type: 'and', filters: options });
  }
  if (plan.affixCount !== null) stats.push({ type: 'and', filters: [{ id: tradeData.affixCount, value: { min: plan.affixCount, max: plan.affixCount } }] });
  if (!stats.length) stats.push({ type: 'and', filters: [] });
  return { status: { option: 'securable' }, ...plan.type, stats, filters };
}
export async function tradeUrl(query, league = tradeData.defaultLeague) {
  const name = league.trim();
  if (!name || name.length > 100 || /[\u0000-\u001f]/.test(name)) throw Error('거래소의 리그 이름을 입력하세요.');
  const stream = new Blob([JSON.stringify(query)]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const encoded = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://poe.kakaogames.com/trade2/search/poe2/${encodeURIComponent(name)}/${encoded}`;
}
