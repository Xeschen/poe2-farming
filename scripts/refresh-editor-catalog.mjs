// Extract the reviewed, locally downloaded Korean PoEDB HTML snapshots. See docs/editor-validation.md.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
const page = await browser.newPage();
const glossary = JSON.parse(readFileSync('data/glossary.ko.json', 'utf8'));
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 16);
const masterUrl = 'https://poe2db.tw/kr/Masters_of_the_Atlas';
const atlasUrl = 'https://poe2db.tw/kr/Atlas_passive_skill';
const doc = name => readFileSync(`${process.argv[2] || 'test-results'}/poedb-${name}.html`, 'utf8');
const masters = await page.evaluate(html => {
  const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('br').forEach(br => br.replaceWith(' · '));
  return [...d.querySelectorAll('.flex-grow-1')].filter(e => e.querySelector('.magicitem')).map(e => {
    const title = e.firstElementChild, group = title.querySelector('span').textContent;
    const name = title.firstChild.textContent.trim();
    return { id: e.parentElement.querySelector('img').alt, name, master: group.startsWith('자도') ? '자도' : group.startsWith('도리아니') ? '도리아니' : '힐다', tier: Number(group.at(-1)), description: e.querySelector('.magicitem').textContent.trim() };
  });
}, doc('Masters_of_the_Atlas'));
const atlas = await page.evaluate(html => {
  const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('br').forEach(br => br.replaceWith(' · '));
  const all = [...d.querySelectorAll('a.PassiveSkills')].filter(a => a.closest('.flex-grow-1')).map(a => {
    const c = a.closest('.flex-grow-1');
    const properties = [...c.querySelectorAll('.property')].map(e => e.textContent.trim()).join(' · ');
    const subtree = properties.match(/SubTree:\s*([A-Za-z]+)/)?.[1] || null;
    const level = properties.match(/(\d+)\s*레벨 이상/);
    return { id: a.getAttribute('href'), name: a.textContent.trim(), url: new URL(a.getAttribute('href'), 'https://poe2db.tw/kr/').href,
      subtree, minAreaLevel: level ? Number(level[1]) : null,
      description: [...c.querySelectorAll('.property,.implicitMod')].map(e => e.textContent.trim()).join(' · '), choices: [...c.querySelectorAll('.explicitMod li')].map((e, i) => { e.querySelectorAll('.secondary').forEach(x => x.remove()); const text = e.textContent.replace(/(?:\s*·\s*)+$/, '').trim(); return /[가-힣]/.test(text) ? text : `한국어 설명 미확인 (선택지 ${i + 1})`; }) };
  });
  return [...new Map(all.map(e => [e.name, e])).values()];
}, doc('Atlas_passive_skill'));
const modifiers = [];
for (const [file, tablet] of [['Irradiated_Tablet','방사능 노출 서판'],['Breach_Tablet','균열 서판'],['Expedition_Tablet','탐험 서판'],['Delirium_Tablet','환영 서판'],['Ritual_Tablet','의식 서판'],['Overseer_Tablet','감독관 서판'],['Abyss_Tablet','심연 서판'],['Temple_Tablet','사원 서판']]) {
  const data = JSON.parse(doc(file).match(/new ModsView\((.*)\);/)[1]);
  for (const row of data.normal) {
    const parsed = await page.evaluate(html => {
      const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('br').forEach(br => br.replaceWith(' · ')); const values = [...d.querySelectorAll('.mod-value')];
      const text = d.body.textContent.trim();
      if (values.length === 1) values[0].textContent = '{value}';
      return { text, template: d.body.textContent.trim(), numeric: values.length === 1 };
    }, row.str);
    if (!/[가-힣]/.test(parsed.text) || /(?:^|[^0-9)])%/.test(parsed.text)) continue;
    const family = row.ModFamilyList.join('-');
    const id = 'tablet-' + hash(family + row.ModGenerationTypeID + parsed.template);
    const existing = modifiers.find(m => m.id === id);
    if (existing) { existing.tablets.push(tablet); continue; }
    const metric = ({ MapDroppedItemRarityIncrease: 'itemRarity', MapMonsterRarity: 'monsterRarity', MapDroppedMapQuantityIncrease: 'waystoneQuantity', MapAdditionalModifier: 'additionalMapModifiers', MapAdditionalAzmeriWisp: 'additionalAzmeriSpirits' })[family] || (/경로석.*수량/.test(parsed.text) ? 'waystoneQuantity' : /징조.*확률/.test(parsed.text) ? 'omenChance' : null);
    modifiers.push({ id, ...parsed, family, affix: row.ModGenerationTypeID === '1' ? 'prefix' : row.ModGenerationTypeID === '2' ? 'suffix' : 'other', metric, unit: parsed.template.includes('{value}%') ? '%' : null, tablets: [tablet], sourceUrl: `https://poe2db.tw/kr/${file}` });
  }
}
const waystoneModifiers = [];
for (const band of ['low', 'mid', 'top']) {
  const file = `Waystones_${band}_tier`, sourceUrl = `https://poe2db.tw/kr/${file}`;
  const data = JSON.parse(doc(file).match(/new ModsView\((.*)\);/)[1]);
  for (const row of data.normal) {
    const text = await page.evaluate(html => {
      const d = new DOMParser().parseFromString(html, 'text/html');
      d.querySelectorAll('.secondary').forEach(e => e.remove());
      d.querySelectorAll('br').forEach(e => e.replaceWith(' · '));
      return d.body.textContent.replace(/(?:\s*·\s*)+$/, '').trim();
    }, row.str);
    if (!/[가-힣]/.test(text)) continue;
    const family = row.ModFamilyList.join('-'), id = 'waystone-' + hash(family + row.ModGenerationTypeID + text);
    const existing = waystoneModifiers.find(m => m.id === id);
    if (existing) { existing.bands.push(band); existing.sourceUrls.push(sourceUrl); continue; }
    waystoneModifiers.push({ id, name: row.Name, text, template: text, numeric: false, metric: null, unit: null, family,
      affix: row.ModGenerationTypeID === '1' ? 'prefix' : row.ModGenerationTypeID === '2' ? 'suffix' : 'other', bands: [band], sourceUrls: [sourceUrl] });
  }
}
for (const n of [...atlas.map(n => ({ ...n, kind: '아틀라스 패시브' })), ...masters.map(n => ({ ...n, kind: '대가 패시브', url: masterUrl, choices: [] }))]) {
  const old = glossary.terms.find(t => t.nameKo === n.name);
  if (old) {
    if (old.id === 'term-' + hash(n.kind + n.id)) old.description = /[가-힣]/.test(n.description) ? n.description : old.description;
    if (old.kind === n.kind) {
      old.choices = n.choices; old.url = n.url;
      old.verification.checkedAt = '2026-09-21';
      old.verification.sourceUrl = n.kind === '아틀라스 패시브' ? atlasUrl : masterUrl;
    }
    continue;
  }
  glossary.terms.push({ id: 'term-' + hash(n.kind + n.id), nameKo: n.name, kind: n.kind, url: n.url, description: /[가-힣]/.test(n.description) ? n.description : '효과의 한국어 번역은 미확인입니다. PoEDB에서 확인하세요.', choices: n.choices,
    verification: { checkedAt: '2026-09-21', patch: null, status: 'poedb_name_checked', sourceUrl: n.url, note: '선택 목록용 명칭 확인. 현재 패치의 전체 배분 가능 여부는 미검증.' } });
}
const regionEntries = await page.evaluate(html => {
 const d = new DOMParser().parseFromString(html, 'text/html');
 return [...d.querySelectorAll('#EndGameMaps .flex-grow-1 > a.WorldAreas')].map(a => ({ name: a.textContent.trim(), url: new URL(a.getAttribute('href'), 'https://poe2db.tw').href }));
}, doc('Maps'));
const regions = [...new Set(regionEntries.map(r => r.name))].sort((a, b) => a.localeCompare(b, 'ko'));
if (regionEntries.length !== 173) throw Error('PoEDB 지도 수가 변경되었습니다. 원문과 추출을 검토하세요.');
for (const r of regionEntries) if (!glossary.terms.some(t => t.nameKo === r.name)) glossary.terms.push({ id: 'region-' + hash(r.url), nameKo: r.name, kind: '지도 지역', url: r.url, description: 'PoEDB 엔드게임 지도 목록에 등록된 지역입니다.', choices: [], verification: { checkedAt: '2026-09-21', patch: null, status: 'poedb_name_checked', sourceUrl: 'https://poe2db.tw/kr/Waystones#EndGameMaps', note: '지도 이름 확인. 현재 리그 출현 여부는 미검증.' } });
// Only environment conversions with player-selectable outcomes. Never infer an active bonus.
const biomeRules = atlas.filter(n => n.choices.length && n.description.includes('다른 환경으로도 간주됨')).map(n => {
  const subject = n.description.split(' · ').at(-1).replace(/(?:가|이) 다른 환경으로도 간주됨$/, '');
  const biomes = subject === '해양 및 섬 지역' ? ['해양', '섬'] : [subject];
  if (biomes.some(b => !/^(?:바알 도시|에조미어 도시|파리둔 도시|해양|섬)$/.test(b))) throw Error('환경 전환 노드의 분류를 검토하세요: ' + subject);
  return { nodeId: n.id, nodeName: n.name, biomes, choices: n.choices, minAreaLevel: n.minAreaLevel, url: n.url };
});
const cityBiomes = biomeRules.flatMap(r => r.biomes).filter(b => b.endsWith(' 도시')).sort((a, b) => a.localeCompare(b, 'ko'));
for (const name of cityBiomes) {
  const rule = biomeRules.find(r => r.biomes.includes(name)), id = 'biome-' + hash(name);
  const existing = glossary.terms.find(t => t.nameKo === name);
  if (existing?.kind === '지역') {
    existing.kind = '지도 환경'; existing.url = 'https://poe2db.tw/kr/Biome';
    existing.description = `${rule.nodeName}에서 추가로 적용할 환경을 선택하는 도시 분류입니다.`;
    existing.choices = rule.choices; existing.verification.sourceUrl = existing.url;
  }
  if (!existing) glossary.terms.push({ id, nameKo: name, kind: '지도 환경', url: 'https://poe2db.tw/kr/Biome', description: `${rule.nodeName}에서 추가로 적용할 환경을 선택하는 도시 분류입니다.`, choices: rule.choices,
    verification: { checkedAt: '2026-09-21', patch: null, status: 'poedb_name_checked', sourceUrl: 'https://poe2db.tw/kr/Biome', note: '아틀라스 선택 노드의 도시 분류 확인. 지도 환경을 선택해도 노드 효과는 자동 적용하지 않음.' } });
}
const data = { checkedAt: '2026-09-21', patch: null, sources: [masterUrl, atlasUrl, 'https://poe2db.tw/kr/Biome', 'https://poe2db.tw/kr/Waystones#EndGameMaps', 'https://poe2db.tw/kr/Modifiers', ...['low', 'mid', 'top'].map(b => `https://poe2db.tw/kr/Waystones_${b}_tier`)], patches: ['0.5.5','0.5'],
  regions, regionEntries, contents: ['금고','균열','대탐험','사원','서판','성소','소환의 원','심연','아즈메리 혼백','에센스','의식','탈주 유배자','탐험','환영'], biomes: ['풀','숲','늪','사막','산','물','도시', ...cityBiomes, '해양','섬'], biomeRules, masters, atlas, modifiers, waystoneModifiers };
writeFileSync('src/editor-data.js', '// PoEDB Korean selection snapshot, checked 2026-09-21. Not a live patch compatibility guarantee.\nexport const editorData = ' + JSON.stringify(data, null, 2) + ';\n');
writeFileSync('data/glossary.ko.json', JSON.stringify(glossary, null, 2) + '\n');
console.log({ regions: regions.length, sourceMaps: regionEntries.length, selectableAtlas: atlas.filter(n => n.choices.length).length, masters: masters.length, atlas: atlas.length, modifiers: modifiers.length, waystoneModifiers: waystoneModifiers.length, terms: glossary.terms.length });
await browser.close();
