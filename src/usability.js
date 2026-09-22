import { priorities } from './model.js';
import { propertyLines } from './waystones.js';
export const optionRequirementLabels = { unknown: '속성 미확인', unrestricted: '속성 제한 없음' };
export function optionRequirementText(item) {
  return item.options.length ? '속성 조건 지정' : optionRequirementLabels[item.optionRequirement || 'unknown'];
}
export function groupedTablets(method) {
  const groups = new Map();
  for (const t of method.tablets.items) {
    const key = `${t.name}/${t.status}`;
    const group = groups.get(key) || { name: t.name, status: t.status, count: 0, configurations: 0 };
    group.count = group.count === null || t.count === null ? null : group.count + t.count;
    group.configurations++;
    groups.set(key, group);
  }
  return [...groups.values()];
}
// Region names such as Pit are linked only through the structured region field.
export function canLinkInProse(text, index, name) {
  if (index && /[\p{L}\p{N}_]/u.test(text[index - 1])) return false;
  const tail = text.slice(index + name.length);
  return !/^[\p{L}\p{N}_]/u.test(tail) || /^(?:은|는|이|가|을|를|의|에서|에|와|과|으로|로|도|만|부터|까지|처럼|보다)(?:$|[^\p{L}\p{N}_])/u.test(tail);
}
// Reviewed, exact source sentences: attach these to their structured preparation.
// Edited or unfamiliar sentences stay independent; nothing is discarded by fuzzy matching.
const preparationReferences = new Map([
  ['보상 확률 2배와 심연 4개 추가 등장 확률을 나누어 갖춘 심연 서판 3개', 'tablets'],
  ['전용 조건을 나누어 가진 심연 서판 4개', 'tablets'],
  ['일반 균열 서판 3개', 'tablets'],
  ['포위당한 레이클라스트 1개', 'tablets'],
  ['환영 서판 3개', 'tablets'],
  ['캐릭터가 감당할 수 있는 경로석; 고정 등급과 속성 수는 미확인', 'waystone'],
  ['타락한 15등급 경로석', 'waystone'],
  ['6~8개 속성의 15등급 경로석', 'waystone'],
  ['6개 속성 경로석', 'waystone']
]);
export function preparationItems(m) {
  const items = [];
  m.tablets.items.forEach((t, i) => items.push({ text: `서판 ${i + 1} · ${t.name} · ${t.count ?? '개수 미확인'}${t.count === null ? '' : '개'} · ${priorities[t.status]}`, role: t.options.length ? t.options.filter(o => o.priority === 'required' || o.priority === 'avoid').map(o => `${priorities[o.priority]} · ${o.text}`).join(' / ') || `${priorities[t.options[0].priority]} · ${t.options[0].text}` : optionRequirementText(t), details: [optionRequirementText(t), ...t.options.map(o => `${priorities[o.priority]} · ${o.text}`)], notes: [], trade: 'tablet', index: i }));
  if (m.tablets.usage === 'unknown') items.push({ text: '서판 사용 방식 확인', details: ['미확인 · 준비 완료 전에 확인하세요.'] });
  items.push({ text: '경로석 조건 확인', details: [`등급 ${m.waystone.tier ?? '미확인'} · 속성 수 ${m.waystone.affixCount ?? '미확인'} · ${m.waystone.corrupted === null ? '타락 여부 미확인' : m.waystone.corrupted ? '타락' : '비타락'}`, ...propertyLines(m.waystone), ...m.waystone.options.map(o => `${priorities[o.priority]} · ${o.text}`), ...m.waystone.notes], trade: 'waystone' });
  items.push({ text: '아틀라스 선택 확인', details: m.atlas.nodes.map(n => `${n.name} · ${n.choice || '선택 미확인'}`) });
  items.push({ text: '대가 구성 확인 · 대안 중 하나 선택', details: m.masters.choices.map(c => `${c.name} · ${c.role} · ${c.nodes.map(n => n.name).join(', ')}`) });
  for (const text of [...m.map.conditions, ...m.supplies]) {
    const reference = preparationReferences.get(text);
    const target = reference === 'tablets' ? items.find(i => i.trade === 'tablet') : reference === 'waystone' ? items.find(i => i.trade === 'waystone') : null;
    if (target) { (target.notes ??= []).push(text); }
    else items.push({ text, details: [] });
  }
  return items;
}
export function nextRun(state) {
  state.checked = state.checked.filter(i => !state.repeat.includes(i));
  state.step = state.startStep;
  state.round++;
}
// Progress is transient and isolated from both the library and saved personal records.
export function progressFor(cache, id, method) {
  const signature = JSON.stringify(method), old = cache.get(id);
  if (old?.signature === signature) return old;
  const state = { signature, checked: [], repeat: [], step: 0, startStep: 0, round: 1, changed: !!old };
  cache.set(id, state); return state;
}
