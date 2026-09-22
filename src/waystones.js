import { editorData } from './editor-data.js';

// Collapse numeric tiers only. Ground effects share a family but remain distinct effects.
const effectText = m => m.text.split(' · ')[0].replace(/\([^()]*[—–][^()]*\)|-?\d+(?:\.\d+)?/g, '#');
const stableId = text => {
  let hash = 14695981039346656037n;
  for (const c of text) hash = BigInt.asUintN(64, (hash ^ BigInt(c.codePointAt(0))) * 1099511628211n);
  return `waystone-effect-${hash.toString(16)}`;
};
export const waystoneEffects = [...Map.groupBy(editorData.waystoneModifiers, m => `${m.family}:${effectText(m)}`).entries()].map(([key, variants]) => ({
  id: stableId(key), family: variants[0].family, affix: variants[0].affix,
  name: effectText(variants[0]), text: effectText(variants[0]), template: effectText(variants[0]),
  numeric: false, metric: null, unit: null, variantIds: variants.map(m => m.id),
  sourceUrls: [...new Set(variants.flatMap(m => m.sourceUrls))]
}));
export const allWaystoneModifiers = [...waystoneEffects, ...editorData.waystoneModifiers];
export const waystoneEffectFor = id => waystoneEffects.find(m => m.id === id || m.variantIds.includes(id));

// Current trade map filters, checked against the 2026-09-15 public filter snapshot.
// The legacy API keys map_rare_monsters/map_magic_monsters now mean rarity/effectiveness.
export const waystoneProperties = [
  { key: 'itemRarity', label: '아이템 희귀도', filter: 'map_iir', unit: '%' },
  { key: 'monsterRarity', label: '몬스터 희귀도', filter: 'map_rare_monsters', unit: '%' },
  { key: 'packSize', label: '무리 규모', filter: 'map_packsize', unit: '%' },
  { key: 'monsterEffectiveness', label: '몬스터 효율', filter: 'map_magic_monsters', unit: '%' },
  { key: 'waystoneDropChance', label: '경로석 출현 확률', filter: 'map_bonus', unit: '%' },
  { key: 'gold', label: '골드', filter: 'map_gold', unit: '%' },
  { key: 'experience', label: '경험치', filter: 'map_experience', unit: '%' },
  { key: 'revives', label: '부활', filter: 'map_revives', unit: '회' }
];
export const rangeText = range => range?.min != null && range?.max != null ? `${range.min}~${range.max}` : range?.min != null ? `${range.min} 이상` : range?.max != null ? `${range.max} 이하` : '미지정';
export const propertyLines = waystone => waystoneProperties.filter(p => waystone?.properties?.[p.key]?.min != null || waystone?.properties?.[p.key]?.max != null).map(p => `${p.label}: ${rangeText(waystone.properties[p.key])} (${p.unit})`);
