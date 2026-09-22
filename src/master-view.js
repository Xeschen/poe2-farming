import { editorData } from './editor-data.js';

// Use the same verified names and tier grouping as the editor, without editable controls.
export function renderMasterAbilities(choice, { esc, term, nodeView }) {
  const available = editorData.masters.filter(n => n.master === choice.name);
  const selected = new Map(choice.nodes.map(n => [n.name, n]));
  const card = (ability, node) => `<li class="master-map-card${node ? ' is-selected' : ''}" data-ability-name="${esc(ability.name)}" data-recorded="${!!node}"><span class="master-map-mark" aria-hidden="true">${node ? '✓' : '–'}</span><span class="sr-only">${node ? '선택한 능력' : '선택 기록 없음'}: </span>${node ? nodeView(node, 'master') : `<div class="master-map-name">${term(ability.name, null, 'master')}</div>`}</li>`;
  const tiers = [1, 2, 3, 4].map(tier => {
    const options = available.filter(n => n.tier === tier);
    if (!options.length) return '';
    const count = options.filter(n => selected.has(n.name)).length;
    return `<section class="master-map-tier"><h6><span class="master-tier-number" aria-hidden="true">${tier}</span>${tier}단계 능력<span class="master-tier-count">${count ? `${count}개 선택` : '선택 기록 없음'}</span></h6><ul class="master-map-options">${options.map(n => card(n, selected.get(n.name))).join('')}</ul></section>`;
  }).join('');
  const unmatched = choice.nodes.filter(n => !available.some(a => a.name === n.name));
  return `<div class="master-map-summary"><div class="master-capacity"><span class="master-capacity-slots" aria-hidden="true">${Array.from({length: 4}, (_, i) => `<span class="${i < choice.nodes.length ? 'filled' : ''}"></span>`).join('')}</span><strong>선택 능력 ${choice.nodes.length} / 4</strong></div><p class="master-map-legend"><span>✓ 선택</span><span>– 선택 기록 없음</span></p></div><div class="master-selection-map">${tiers}${unmatched.length ? `<section class="master-map-tier"><h6>단계 미확인</h6><ul class="master-map-options">${unmatched.map(n => card(n, n)).join('')}</ul></section>` : ''}${!available.length && !choice.nodes.length ? '<p class="muted">능력 구성 미확인</p>' : ''}</div>`;
}
