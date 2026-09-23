import { imageCatalogue } from './image-assets.js';
import { editorData } from './editor-data.js';
import { allWaystoneModifiers, waystoneProperties } from './waystones.js';
import { priorities, metrics } from './model.js';
import { optionRequirementText } from './usability.js';

const images = new Map(imageCatalogue.assets.map(a => [`${a.kind}:${a.name}`, a]));
export const imageFor = (kind, name) => images.get(`${kind}:${name}`);
export const waystoneImage = tier => imageCatalogue.assets.find(a => a.kind === 'waystone' && a.tier === tier);
export const propertyValue = (range, unit) => range.min != null && range.max != null
  ? range.min === range.max ? `${range.min}${unit}` : `${range.min}~${range.max}${unit}`
  : range.min != null ? `${range.min}${unit} 이상` : `${range.max}${unit} 이하`;
export const imageTag = (asset, esc, className = '') => asset
  ? `<img class="game-art ${className}" src="./${esc(asset.path)}" alt="" width="72" height="72" loading="lazy" decoding="async">`
  : '<span class="art-placeholder" aria-hidden="true">?</span>';

const modifiers = new Map([...editorData.modifiers, ...allWaystoneModifiers].map(m => [m.id, m]));
export function compactOptions(options, { esc, rich }) {
  return options.length ? `<ul class="compact-options">${options.map(o => {
    const mod = modifiers.get(o.modifierId), affix = mod?.affix;
    const inlineMinimum = mod?.numeric && o.min != null;
    const text = inlineMinimum ? mod.template.replace('{value}', `≥${o.min}`) : o.text;
    const target = !inlineMinimum && o.min != null ? `최소 ${o.min}${o.unit || ''}` : '';
    return `<li class="condition-${esc(o.priority)}"><span class="affix-label ${affix || ''}" aria-label="${{ prefix: '접두', suffix: '접미' }[affix] || '조건'}">${{ prefix: 'P', suffix: 'S' }[affix] || '조건'}</span><span class="compact-option-text">${rich(text)}${target ? `<small class="option-target">${esc(o.metric ? metrics[o.metric] + ' · ' : '')}${esc(target)}</small>` : ''}</span><span class="condition-priority">${esc(priorities[o.priority])}</span></li>`;
  }).join('')}</ul>` : '';
}

const tradeHint = preview => preview ? '' : '<span class="item-trade-hint" aria-hidden="true"><span class="trade-hint-full">거래소 검색</span><span class="trade-hint-short">검색</span> ↗</span>';

export function tabletCard(t, index, preview, ctx) {
  const { esc } = ctx;
  return `<article class="item-card tablet-card" aria-label="${esc(t.name)} 구성 ${index + 1}"><div class="tablet-heading item-identity">${imageTag(imageFor('tablet', t.name), esc)}<div><strong>${esc(t.name)}</strong><span class="tablet-count">${t.count === null ? '개수 미확인' : `${t.count}개`}</span><small>${esc(priorities[t.status])}</small></div>${tradeHint(preview)}</div><div class="item-conditions">${compactOptions(t.options, { ...ctx, rich: esc }) || `<p class="muted">${optionRequirementText(t)}</p>`}</div>${preview ? '' : `<button type="button" class="trade-search item-trade" data-trade="tablet" data-index="${index}" aria-label="${esc(t.name)} 거래소 검색"></button>`}</article>`;
}

export function waystoneCard(w, preview, ctx) {
  const { esc } = ctx;
  const properties = waystoneProperties.filter(p => w.properties?.[p.key]?.min != null || w.properties?.[p.key]?.max != null);
  const flags = [w.tier != null ? `${w.tier}등급` : '', w.affixCount != null ? `속성 ${w.affixCount}개` : '', w.corrupted != null ? w.corrupted ? '타락' : '비타락' : ''].filter(Boolean);
  const configured = flags.length || properties.length || w.options.length;
  return `<article class="item-card waystone-card" aria-label="경로석 검색 조건"><div class="item-identity">${imageTag(waystoneImage(w.tier), esc)}<div><strong>경로석</strong><div class="waystone-baseline">${flags.map(s => `<span>${s}</span>`).join('')}</div></div>${tradeHint(preview)}</div><div class="item-conditions">${properties.length ? `<dl class="waystone-targets">${properties.map(p => `<div><dt>${p.label}</dt><dd>${esc(propertyValue(w.properties[p.key], p.unit))}</dd></div>`).join('')}</dl>` : ''}${compactOptions(w.options, { ...ctx, rich: esc })}${!configured ? '<p class="muted">경로석 조건 미확인</p>' : ''}</div>${preview ? '' : '<button type="button" class="trade-search item-trade" data-trade="waystone" aria-label="경로석 거래소 검색"></button>'}</article>`;
}

export function atlasIcons(nodes, { term }) {
  return nodes.map(n => `<li class="atlas-icon-item">${term(n.name, n.choice, 'atlas', { asset: imageFor('atlas', n.name), note: n.choice ? '아틀라스 노드' : '선택 내용 미확인' })}</li>`).join('');
}
