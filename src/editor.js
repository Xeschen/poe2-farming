import { editorData } from './editor-data.js';
import { priorities, currencies } from './model.js';
import { waystoneEffects, allWaystoneModifiers, waystoneEffectFor, waystoneProperties } from './waystones.js';
export const selectableAtlas = editorData.atlas.filter(n => n.choices.length > 0).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
const contentNames = { Breach: '균열', Incursion: '사원', Abyss: '심연', Ritual: '의식', Expedition: '탐험', Delirium: '환영' };
export const atlasGroupLabel = node => node.subtree ? contentNames[node.subtree] || '콘텐츠 미확인' : `아틀라스 · ${node.minAreaLevel === null ? '지도 레벨 조건 표기 없음' : `지도 ${node.minAreaLevel}레벨 이상`}`;
export const atlasGroups = [...new Set(selectableAtlas.map(atlasGroupLabel))].sort((a, b) => {
  const mainA = a.startsWith('아틀라스'), mainB = b.startsWith('아틀라스');
  return Number(mainB) - Number(mainA) || a.localeCompare(b, 'ko', { numeric: true });
}).map(label => ({ label, nodes: selectableAtlas.filter(n => atlasGroupLabel(n) === label) }));
export function modifierLabel(mod) {
  const affix = { prefix: '접두', suffix: '접미', other: '기타' }[mod.affix];
  return `[${affix} · ${mod.tablets.length === 8 ? '공통' : mod.tablets.join(' / ') + ' 전용'}] ${mod.text}`;
}

// Controls expose paths only; the app validates every mutation before persisting it.
export function editorControls({ draft, terms, esc, field, action, pathGet }) {
  const choices = values => Object.fromEntries(values.map(value => [value, value]));
  const checkList = (path, label, values) => {
    const selected = pathGet(draft, path);
    const environmentHelp = path === 'method.map.biomes' ? `<details class="biome-rules" data-editor-details="biome-rules"><summary>환경을 추가 적용하는 아틀라스 노드</summary><ul>${editorData.biomeRules.map(r => `<li>${esc(r.biomes.join(' · '))} → ${esc(r.choices.join(' / '))} 중 선택<br><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.nodeName)} ↗</a>${r.minAreaLevel ? ` · 지도 ${r.minAreaLevel}레벨 이상` : ''}</li>`).join('')}</ul><p class="form-help">도시 유형은 도시의 세부 분류입니다. 추가 환경은 아틀라스에서 해당 노드와 효과를 선택하세요.</p></details>` : '';
    return `<fieldset class="check-list ${values.length > 15 ? 'searchable-choices' : ''}"><legend>${label}</legend><p class="form-help">복수 선택 가능 · 선택하지 않으면 미지정입니다. <span class="selection-count">${selected.length}개 선택</span></p>${values.length > 15 ? `<input type="search" data-choice-search aria-label="${label} 검색" placeholder="${label} 검색"><p class="form-help">전체 ${values.length}개 · 가나다순 · 같은 이름 통합 · <a href="https://poe2db.tw/kr/Waystones#EndGameMaps" target="_blank" rel="noopener noreferrer">PoEDB 목록 ↗</a></p><p class="form-help">DB의 미사용 표시 항목도 포함합니다. 현재 리그 출현 여부는 미확인입니다.</p>` : ''}<div class="check-grid">${[...new Set([...values, ...selected])].map(value => `<label data-choice-row="${esc(value)}"><input type="checkbox" data-check-path="${path}" value="${esc(value)}" ${selected.includes(value) ? 'checked' : ''}><span>${esc(value)}${values.includes(value) ? '' : ' (기존 기록)'}</span></label>`).join('')}</div><p class="choice-empty muted" hidden>일치하는 항목이 없습니다.</p>${environmentHelp}</fieldset>`;
  };
  const listEditor = (path, label) => `<fieldset class="list-editor"><legend>${label}</legend><p class="form-help">Enter로 연속 추가 · 여러 줄 붙여넣기로 한 번에 추가 · ↑↓ 버튼으로 순서 변경</p>${pathGet(draft, path).map((value, i) => `<div class="list-edit-row">${field(`${path}.${i}`, `${label} ${i + 1}`)}<div class="list-row-actions"><button type="button" data-move-list="${path}" data-index="${i}" data-direction="-1" aria-label="${label} ${i + 1} 위로" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move-list="${path}" data-index="${i}" data-direction="1" aria-label="${label} ${i + 1} 아래로" ${i === pathGet(draft, path).length - 1 ? 'disabled' : ''}>↓</button>${action('remove', `${path}.${i}`, '삭제')}</div></div>`).join('')}<div class="list-add-row"><input data-list-input="${path}" aria-label="${label} 추가" placeholder="새 항목 입력"><button type="button" data-op="add-list" data-path="${path}">추가</button></div></fieldset>`;
  const optionEditor = path => {
    if (!path.startsWith('method.tablets.')) return null;
    const tablet = pathGet(draft, path.replace(/\.options$/, ''));
    const available = editorData.modifiers.filter(m => m.tablets.includes(tablet.name));
    const groupedOptions = (items, selectedId, index = -1) => ['prefix', 'suffix', 'other'].map(affix => {
      const group = items.filter(m => m.affix === affix).sort((a, b) => Number(b.tablets.length === 8) - Number(a.tablets.length === 8) || a.text.localeCompare(b.text, 'ko'));
      return group.length ? `<optgroup label="${{ prefix: '접두', suffix: '접미', other: '기타' }[affix]}">${group.map(m => `<option value="${m.id}" ${m.id === selectedId ? 'selected' : ''} ${tablet.options.some((x, j) => j !== index && x.modifierId === m.id) ? 'disabled' : ''}>${esc(modifierLabel(m))}${m.tablets.includes(tablet.name) ? '' : ' (서판 종류 불일치)'}</option>`).join('')}</optgroup>` : '';
    }).join('');
    const rows = tablet.options.map((o, i) => {
      const p = `${path}.${i}`, selected = editorData.modifiers.find(m => m.id === o.modifierId);
      const items = [...available]; if (selected && !items.includes(selected)) items.unshift(selected);
      return `<div class="edit-option"><label class="field"><span>서판 속성</span><select data-modifier-path="${p}" aria-label="서판 속성">${!selected ? `<option value="" selected>기존 기록: ${esc(o.text)}</option>` : ''}${groupedOptions(items, o.modifierId, i)}</select></label>${!selected ? '<p class="form-help">기존 문장은 보존됩니다. 등록 속성을 선택하면 선택형 데이터로 전환합니다.</p>' : ''}<div class="form-grid">${field(`${p}.priority`, '우선순위', 'text', priorities)}${selected?.numeric ? field(`${p}.min`, '목표 수치', 'number', null, '빈 값은 수치 미지정입니다. 서판 효과를 반영한 목표 수치를 입력하세요.') : ''}</div><p class="option-summary">${esc(o.text)}</p>${action('remove', p, '속성 삭제')}</div>`;
    }).join('');
    return `${field(path.replace(/\.options$/, '.optionRequirement'), '속성 조건 상태', 'text', { unknown: tablet.options.length ? '조건 지정' : '미확인', unrestricted: '속성 제한 없음' })}${rows}<label class="field"><span>서판 속성 추가</span><select data-add-modifier="${path}" aria-label="서판 속성 추가"><option value="">속성을 선택해 추가</option>${groupedOptions(available.filter(m => !tablet.options.some(o => o.modifierId === m.id)))}</select></label>${available.length ? '<p class="form-help">접두·접미 안에서 공통 → 전용, 각 그룹은 가나다순입니다. 공통은 등록된 기본 서판 8종에 공통인 속성입니다.</p>' : '<p class="form-help">이 고유 서판의 선택 가능한 비고정 속성은 등록되어 있지 않습니다.</p>'}`;
  };
  const nodeEditor = path => {
    const nodes = pathGet(draft, path), legacy = nodes.filter(n => !selectableAtlas.some(a => a.name === n.name));
    return `<p class="form-help">선택 효과가 있는 ${selectableAtlas.length}개 노드 · 콘텐츠별 / 아틀라스 지도 레벨별 분류 · 각 분류 안에서 가나다순</p>` + nodes.map((n, i) => {
      const p = `${path}.${i}`, node = selectableAtlas.find(t => t.name === n.name); if (!node) return '';
      const effects = { '': '미선택', ...choices(node.choices) };
      if (n.choice && !Object.hasOwn(effects, n.choice)) effects[n.choice] = n.choice + ' (기존 기록)';
      const select = `<label class="field"><span>아틀라스 노드</span><select data-path="${p}.name" data-type="term-node" aria-label="아틀라스 노드">${atlasGroups.map(g => `<optgroup label="${esc(g.label)}">${g.nodes.map(a => `<option value="${esc(a.name)}" ${a.name === n.name ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
      return `<div class="node-editor"><p class="atlas-category badge">${esc(atlasGroupLabel(node))}</p><div class="form-grid">${select}${field(`${p}.choice`, '선택 효과', 'nullable', effects)}</div><p class="form-help">${esc(node.description.replace(/SubTree: [A-Za-z]+(?: · )?/g, ''))}</p>${action('remove', p, '노드 삭제')}</div>`;
    }).join('') + action('add-node', path, '＋ 노드 추가') + (legacy.length ? `<details class="legacy-atlas" data-editor-details="legacy-atlas"><summary>기존 고정 효과 기록 ${legacy.length}개</summary><p class="form-help">선택 효과가 없어 새 목록에서 제외했습니다. 이전 기록은 유지됩니다.</p>${legacy.map(n => `<p>${esc(n.name)}${n.choice ? ' · ' + esc(n.choice) : ''} ${action('remove', `${path}.${nodes.indexOf(n)}`, '기록 삭제')}</p>`).join('')}</details>` : '');
  };
  const waystoneEditor = path => {
    const options = pathGet(draft, path), catalog = waystoneEffects;
    const usedElsewhere = (mod, index) => options.some((o, i) => i !== index && waystoneEffectFor(o.modifierId)?.family === mod.family);
    const groups = (selectedId, index = -1) => ['prefix', 'suffix', 'other'].map(affix => {
      const items = catalog.filter(m => m.affix === affix && (index !== -1 || !usedElsewhere(m, index))).sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.text.localeCompare(b.text, 'ko', { numeric: true }));
      return items.length ? `<optgroup label="${{ prefix: '접두', suffix: '접미', other: '기타' }[affix]}">${items.map(m => `<option value="${m.id}" ${waystoneEffectFor(selectedId)?.id === m.id ? 'selected' : ''} ${usedElsewhere(m, index) ? 'disabled' : ''}>${esc(m.text)}</option>`).join('')}</optgroup>` : '';
    }).join('');
    return `<div class="waystone-options"><h4>접두·접미 옵션</h4><p class="form-help">같은 효과는 수치·등급에 관계없이 하나로 표시합니다. #은 수치 무관이며, 아이템의 전체 수치 조건은 위의 경로석 수치 조건에서 지정합니다.</p>${options.map((o, i) => {
      const p = `${path}.${i}`, mod = allWaystoneModifiers.find(m => m.id === o.modifierId);
      return `<div class="edit-option"><label class="field"><span>경로석 속성</span><select data-modifier-path="${p}" aria-label="경로석 속성">${!mod ? `<option value="" selected>기존 기록: ${esc(o.text)}</option>` : ''}${groups(o.modifierId, i)}</select></label>${!mod ? '<p class="form-help">기존 기록은 보존됩니다. 등록 속성을 선택하면 선택형 데이터로 전환합니다.</p>' : ''}${mod && !mod.variantIds ? `<p class="form-help">이전에 저장한 수치 범위를 보존 중입니다. <button type="button" data-unify-waystone="${p}">옵션 수치 제한 해제</button></p>` : ''}${field(`${p}.priority`, '우선순위', 'text', priorities)}<p class="option-summary">${esc(o.text)}</p>${mod ? `<a class="form-help" href="${mod.sourceUrls[0]}" target="_blank" rel="noopener noreferrer">PoEDB 속성 근거 ↗</a>` : ''}${action('remove', p, '속성 삭제')}</div>`;
    }).join('')}<label class="field"><span>경로석 속성 추가</span><select data-add-modifier="${path}" aria-label="경로석 속성 추가"><option value="">속성을 선택해 추가</option>${groups()}</select></label></div>`;
  };
  const waystonePropertyEditor = () => `<details class="waystone-properties" data-editor-details="waystone-properties"><summary>경로석 수치 조건</summary><p class="form-help">거래소의 지도 필터처럼 최소·최대를 지정합니다. 빈칸은 제한 없음이며, 경로석 자체에 표시되는 수치 기준입니다. 몬스터 희귀도와 아이템 희귀도는 별도 조건입니다.</p><div class="property-columns">${waystoneProperties.map(p => `<div class="property-range"><strong>${p.label} <small>(${p.unit})</small></strong>${field(`method.waystone.properties.${p.key}.min`, `${p.label} 최소`, 'number').replace(/aria-labelledby="[^"]+"/, `aria-label="${p.label} 최소"`).replace(`>${p.label} 최소</span>`, '>최소</span>')}${field(`method.waystone.properties.${p.key}.max`, `${p.label} 최대`, 'number').replace(/aria-labelledby="[^"]+"/, `aria-label="${p.label} 최대"`).replace(`>${p.label} 최대</span>`, '>최대</span>')}</div>`).join('')}</div></details>`;
  const masterEditor = (c, i) => {
    const path = `method.masters.choices.${i}`;
    const available = editorData.masters.filter(n => n.master === c.name);
    return `<fieldset class="master-editor"><legend>대가 구성 ${i + 1}</legend>${field(`${path}.name`, '대가', 'term-master', choices(['자도','도리아니','힐다']))}${field(`${path}.role`, '선택 조건 / 역할')}<p class="master-selection-count" role="status">${c.nodes.length} / 4개 선택</p><p class="master-selection-error notice error" role="alert" ${c.nodes.length <= 4 ? 'hidden' : ''}>능력은 최대 4개까지 선택할 수 있습니다. 5개 이상은 데이터 오류이며 저장되지 않습니다.</p><p class="form-help">능력을 선택하면 세팅에 반영됩니다. 아래 단계는 PoEDB 분류이며, 실제 배분 가능 여부는 게임에서 확인하세요.</p>${[1,2,3,4].map(tier => `<fieldset class="master-tier"><legend>${tier}단계 능력</legend><div class="master-abilities">${available.filter(n => n.tier === tier).map(n => `<label class="ability-card"><input type="checkbox" data-master-path="${path}" value="${n.id}" ${c.nodes.some(x => x.name === n.name) ? 'checked' : ''}><span><strong>${esc(n.name)}</strong><small>${esc(/[가-힣]/.test(n.description) ? n.description : '한국어 효과 설명 미확인 · PoEDB에서 확인')}</small></span></label>`).join('')}</div></fieldset>`).join('')}${c.nodes.filter(n => !available.some(x => x.name === n.name)).map(n => `<p class="notice">${esc(n.name)}: 기존 대가의 선택입니다. 현재 대가에 맞게 해제하세요. ${action('remove', `${path}.nodes.${c.nodes.indexOf(n)}`, '능력 해제')}</p>`).join('')}${action('remove', path, '대가 구성 삭제')}</fieldset>`;
  };
  const budgetEditor = () => `${field('method.budget.amount', '비용', 'number').replace('data-path="method.budget.amount"', 'data-path="method.budget.amount" aria-describedby="budget-help"')}${field('method.budget.currency', '단위', 'text', choices(currencies))}`;
  return { listEditor, optionEditor, waystoneEditor, waystonePropertyEditor, nodeEditor, masterEditor, budgetEditor, checkList };
}
