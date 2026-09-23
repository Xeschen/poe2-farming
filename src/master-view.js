import { editorData } from './editor-data.js';
import { imageFor } from './visual-setup.js';

// Keep the same three choices per tier and four tiers as the editor.
export function renderMasterAbilities(choice, { esc, term }) {
  const available = editorData.masters.filter(n => n.master === choice.name).sort((a, b) => a.tier - b.tier);
  const nodes = available.map(ability => {
    const selected = choice.nodes.find(n => n.name === ability.name);
    const note = `${choice.name} · ${ability.tier}단계 · ${selected ? '선택한 능력' : '선택하지 않은 능력'}`;
    return `<li class="master-map-card${selected ? ' is-selected' : ''}" data-ability-name="${esc(ability.name)}" data-recorded="${!!selected}">${term(ability.name, selected?.choice, 'master', { asset: imageFor('master', ability.name), hideName: true, note })}${selected ? '<span class="ability-selected-mark" aria-label="선택됨">✓</span>' : ''}</li>`;
  }).join('');
  return `<div class="master-map-summary"><div class="master-capacity"><strong>선택 능력 ${choice.nodes.length} / 4</strong></div></div><ul class="master-icon-strip" aria-label="${esc(choice.name)} 능력 · 단계별 3개, 총 4단계">${nodes}</ul>${!choice.nodes.length ? '<p class="muted">능력 구성 미확인</p>' : ''}`;
}
