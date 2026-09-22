// Public, pinned EE2 data snapshot; runtime never requests the trade API.
import { readFileSync, writeFileSync } from 'node:fs';
import { editorData } from '../src/editor-data.js';
const dir = process.argv[2] || 'test-results';
const read = name => readFileSync(`${dir}/trade-ko-${name}.ndjson`, 'utf8').trim().split('\n').map(JSON.parse);
const stats = read('stats'), items = read('items');
const norm = s => s.replace(/\([^()]*[—–][^()]*\)|\{value\}|-?\d+(?:\.\d+)?/g, '#').replace(/\s|·/g, '');
const mappings = {};
for (const mod of [...editorData.modifiers, ...editorData.waystoneModifiers]) {
  const text = mod.tablets ? mod.text : mod.text.split(' · ')[0];
  const hits = stats.flatMap(s => s.trade?.ids?.explicit ? s.matchers.filter(m => norm(m.string) === norm(text)).map(m => ({ s, m })) : []);
  const unique = [...new Map(hits.map(h => [JSON.stringify([h.s.trade.ids.explicit, !!h.m.negate]), h])).values()];
  // A contradictory upstream sign and any ambiguous matches stay explicitly unsupported.
  if (unique.length !== 1 || (mod.family === 'MapVerisiumStackSize' && unique[0].m.negate)) continue;
  const { s, m } = unique[0];
  if (s.id === 'map_verisium_stack_size_+%' && m.negate) continue;
  mappings[mod.id] = { ids: s.trade.ids.explicit, negate: !!m.negate, matcher: m.string, ref: s.ref, primaryOnly: !mod.tablets };
}
const tabletNames = new Set(JSON.parse(readFileSync('data/glossary.ko.json', 'utf8')).terms.filter(t => t.kind === '서판').map(t => t.nameKo));
const tabletTypes = Object.fromEntries(items.filter(i => tabletNames.has(i.name) && (i.tags || []).includes('tower_augment')).map(i => [i.name, i.unique ? { name: i.refName, type: i.unique.base } : { type: i.refName }]));
const affixCount = stats.find(s => s.ref === '# Modifiers').trade.ids.pseudo[0];
const data = { checkedAt: '2026-09-21', sourceCommit: 'cca30662bf31eaf38bd711e2ec1a6b899a06c40e',
  sourceUrl: 'https://github.com/Kvan7/Exiled-Exchange-2/tree/cca30662bf31eaf38bd711e2ec1a6b899a06c40e/renderer/public/data/ko',
  liveVerified: false, defaultLeague: 'Forbidden Rites', leagueSource: 'https://poe2db.tw/League', affixCount, tabletTypes, mappings };
writeFileSync('src/trade-data.js', '// Public trade ID snapshot. See docs/trade-search.md for provenance and limits.\nexport const tradeData = ' + JSON.stringify(data, null, 2) + ';\n');
console.log({ tablets: Object.keys(tabletTypes).length, mapped: Object.keys(mappings).length, unsupported: [...editorData.modifiers, ...editorData.waystoneModifiers].filter(m => !mappings[m.id]).map(m => m.text) });
