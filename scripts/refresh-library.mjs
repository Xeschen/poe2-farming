// Curated mappings, not fuzzy matching. The original extraction remains immutable.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editorData } from '../src/editor-data.js';
import { normalizeMethod, makeModifier, copyMethod, envelope, validateData } from '../src/model.js';
import { applyOverrides, readOverrides, validateLibrary } from './library-overrides.mjs';

export function curateLibrary(source, additions = { sources: [], strategies: [] }, review = null) {
  const library = structuredClone(source);
  library.schemaVersion = '0.2.0';
  library.status = 'structured_draft';
  delete library.glossary; // The app uses the separately verified glossary.ko.json catalog.
  library.curation = { revision: 1, checkedAt: '2026-09-21', sourceFile: 'farming-methods.ko.json',
    note: '현재 선택형 편집·검색 구조로 정비한 영상 기반 초안. 영상 패치·출처·미확인 사항은 유지하며 현재 리그 실전 검증을 의미하지 않음.',
    catalogSources: editorData.sources };
  const optionFamilies = {
    '탐험에 묻힌 금고 2개 등장': 'ExpeditionBuriedStrongboxes',
    '아즈메리 혼백 등장 확률 증가': 'MapAdditionalSpirit',
    '아즈메리 혼백 2개 추가': 'MapBossAdditionalSpirit',
    '무작위 지도 속성 2개 추가': 'MapAdditionalModifier',
    '몬스터 효과 증가': 'MapMonsterEffectiveness',
    '아이템 희귀도 증가': 'MapDroppedItemRarityIncrease',
    '비용이 높으면 아이템 희귀도로 타협': 'MapDroppedItemRarityIncrease',
    '징조 등장 확률 60% 이상': 'RitualOmenChance',
    '경로석 수량 35% 이상': 'MapDroppedMapsIncrease',
    '무리 규모 증가': 'MapPackSizeIncrease',
    '희귀 몬스터 수 증가': 'MapRarePackIncrease',
  };
  const choiceMappings = {
    '바람을 타고': ['주변에 플레이어가 없을 때 혼백이 형체를 잃지 않음', '아즈메리 혼백이 주위에 플레이어가 없을 때 형체를 잃지 않음'],
    '성스러운 진액': ['성스러운 혼백에 사로잡히면 다른 무작위 혼백 추가', '몬스터가 성스러운 혼백에게 사로잡힌 경우, 다른 무작위 혼백에게 추가로 사로잡힘'],
    '대군주의 영향력': ['아즈메리 혼백', '추가 아즈메리 혼백 1개'],
    '보이지 않는 강': ['야생 혼백; 다른 선택도 가능', '야생 혼백'],
    '계산된 투자': ['룬 속성당 아이템 수량', '룬 속성당 몬스터가 떨어뜨리는 아이템의 수량 1% 증가'],
    '묻고 더블로 가': ['추가 룬 속성 확률', '25%의 확률로 추가 룬 속성 추가'],
    '고무된 제물': ['헌정품 수 증가가 포함된 선택', '의식 제단의 스킬로 주는 피해 50% 증가 · 의식 제단이 제시하는 헌정품의 수 10% 증가'],
    '산 숙련': ['서판 수량 50%', '발견하는 서판의 수량 50% 증가'],
    '대군주의 영토': ['소환의 원', '소환의 원 · 재활성화 룬 개'],
  };
  library.strategies = source.strategies.map(original => {
    const m = normalizeMethod(original);
    m.budget = { amount: null, currency: '엑잘티드 오브',  };
    for (const t of m.tablets.items) {
      t.options = t.options.flatMap(o => {
        if (t.name === '신념의 자유' && o.text === '헌정품 무작위 변경 횟수 증가를 활용') {
          m.tablets.notes.push('신념의 자유로 헌정품 무작위 변경 횟수를 늘린다. 거래소에서는 고유 아이템 이름으로 검색한다.');
          return [];
        }
        const matches = editorData.modifiers.filter(x => x.family === optionFamilies[o.text] && x.tablets.includes(t.name));
        if (matches.length !== 1) throw Error(`${m.id}: 서판 속성 대조 필요: ${t.name} / ${o.text}`);
        return [makeModifier(matches[0].id, o.priority, o.min)];
      });
    }
    if (m.waystone) {
      m.waystone.properties = {};
      for (const o of m.waystone.options) {
        if (['monsterRarity', 'waystoneDropChance'].includes(o.metric) && o.min !== null && ['required', 'recommended'].includes(o.priority)) {
          m.waystone.properties[o.metric] = { min: o.min, max: null };
          m.waystone.notes.push(`${o.priority === 'required' ? '필수' : '권장'} 수치 조건: ${o.text}.`);
        } else if (m.id === 'cleansed-fracturing' && o.text === '무리 규모 증가로 대체 가능' && o.priority === 'alternative') {
          m.waystone.notes.push('몬스터 희귀도 조건 대신 무리 규모 증가를 선택할 수 있다. 대안의 최소 수치는 미확인이며, 거래소에서 대안으로 검색할 때는 몬스터 희귀도 최소값을 해제한다.');
        } else throw Error(`${m.id}: 경로석 조건 대조 필요: ${o.text}`);
      }
      m.waystone.options = [];
    }
    if (m.map) {
      const oldRegions = {
        'azmeri-strongbox': ['에조미어 도시'], 'grand-expedition-chests': ['대탐험'], 'grand-expedition-runes': ['대탐험'],
        'ritual-nameless-cycle': ['이름 없는 자의 의례'], 'tablet-drop': ['일반 지도', '일반 탐험 지도'], 'cleansed-fracturing': ['정화된 지역'],
      };
      const moves = {
        'azmeri-strongbox': () => { m.map.biomes = ['에조미어 도시', ...m.map.biomes]; },
        'grand-expedition-chests': () => {}, 'grand-expedition-runes': () => {},
        'ritual-nameless-cycle': () => { m.map.conditions.unshift('이름 없는 자의 의례에서 진행'); },
        'tablet-drop': () => { m.map.conditions.unshift('일반 지도와 일반 탐험 지도를 순회'); m.map.biomes = ['섬', ...m.map.biomes]; },
        'cleansed-fracturing': () => {},
      };
      if (JSON.stringify(m.map.regions) !== JSON.stringify(oldRegions[m.id])) throw Error(`${m.id}: 지도 분류 원문이 변경되어 재검토가 필요합니다.`);
      if (!moves[m.id]) throw Error(`${m.id}: 지도 분류 검토 필요`);
      moves[m.id]();
      m.map.regions = []; // Old entries were content, state, or biome labels, never specific map names.
    }
    if (m.atlas) {
      m.atlas.nodes = m.atlas.nodes.filter(n => {
        const catalog = editorData.atlas.find(x => x.name === n.name);
        if (!catalog) throw Error(`아틀라스 이름 대조 필요: ${n.name}`);
        if (!catalog.choices.length) {
          m.atlas.otherPriorities ??= [];
          m.atlas.otherPriorities.push(`고정 효과 · ${n.name}`);
          return false;
        }
        const replacement = choiceMappings[n.name];
        if (replacement && n.choice === replacement[0]) n.choice = replacement[1];
        if (!catalog.choices.includes(n.choice)) throw Error(`${m.id}: 아틀라스 선택 대조 필요: ${n.name} / ${n.choice}`);
        n.poedbUrl = catalog.url;
        return true;
      });
    }
    if (m.id === 'azmeri-strongbox') {
      m.map.optional.push('보이지 않는 강은 야생 혼백을 선택한다. 다른 혼백 선택도 가능하다.');
      m.stopConditions.push('성스러운 혼백이 없으면 해당 지도의 금고 반복 파밍을 중단한다.');
    }
    if (m.id === 'grand-expedition-runes') {
      const master = m.masters.choices[0];
      master.role += ' · 살점 꿰매기는 재도전 여유를 위한 선택';
      master.nodes.find(n => n.name === '살점 꿰매기').choice = null;
    }
    if (m.id === 'tablet-drop') {
      const [base, unusual, expedition] = m.masters.choices;
      for (const [variant, replaced] of [[unusual, '기나긴 나날'], [expedition, '예기치 못한 위협']]) {
        const replacement = variant.nodes[0];
        variant.nodes = base.nodes.map(n => structuredClone(n.name === replaced ? replacement : n));
      }
      m.masters.choices.forEach(c => { c.role = `대안 구성 중 하나 선택 · ${c.role}`; });
    }
    if (m.id === 'cleansed-fracturing') {
      m.content = ['소환의 원', '환영', '의식', '균열'];
      m.unresolved.push('대군주의 영토 선택 효과 중 재활성화 룬 개수는 한국어 PoEDB 표기에서 미확인');
    }
    return m;
  });
  for (const [key, items] of Object.entries({ sources: additions.sources, strategies: additions.strategies })) {
    const ids = new Set(library[key].map(item => item.id));
    for (const item of items) {
      if (ids.has(item.id)) throw Error(`추가 자료의 중복 ${key} ID: ${item.id}`);
      ids.add(item.id);
      library[key].push(structuredClone(item));
    }
  }
  if (additions.strategies.length) {
    library.curation.revision = 2;
    library.curation.additionalSourceFile = 'library-additions.ko.json';
    library.method = `기존 영상 추출 ${source.strategies.length}종과 추가 영상 설명란·제작자 세팅 문서 정리 ${additions.strategies.length}종. 각 항목의 출처·추출 범위·미확인 조건을 구분하며 실전 수익은 미검증.`;
  }
  if (review) {
    for (const key of ['sources', 'strategies']) {
      const seen = new Set();
      for (const patch of review[key]) {
        const target = library[key].find(item => item.id === patch.id);
        if (!target || seen.has(patch.id)) throw Error(`재검토 대상 ID 확인 필요: ${key}/${patch.id}`);
        seen.add(patch.id);
        Object.assign(target, structuredClone(patch));
      }
    }
    library.curation.revision = 3;
    library.curation.checkedAt = review.checkedAt;
    library.curation.reviewFile = 'library-review.ko.json';
    library.method = '출처 영상의 자막과 일부 세팅 화면·제작자 문서·PoEDB 한국어를 대조한 파밍법. 항목별 출처 패치와 적용 범위를 함께 참고한다. 실전 수익과 전체 아틀라스 연결 경로는 미검증.';
  }
  library.curation.revision = 4;
  const terms = JSON.parse(readFileSync(new URL('../data/glossary.ko.json', import.meta.url))).terms;
  const errors = validateData(envelope(library.strategies.map(m => copyMethod(library, m))), terms);
  if (errors.length) throw Error(errors.join('\n'));
  return library;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(readFileSync(new URL('../data/farming-methods.ko.json', import.meta.url)));
  const additions = JSON.parse(readFileSync(new URL('../data/library-additions.ko.json', import.meta.url)));
  const review = JSON.parse(readFileSync(new URL('../data/library-review.ko.json', import.meta.url)));
  const root = fileURLToPath(new URL('..', import.meta.url));
  const library = applyOverrides(curateLibrary(source, additions, review), await readOverrides(root));
  await validateLibrary(root, library);
  writeFileSync(new URL('../data/library.ko.json', import.meta.url), JSON.stringify(library, null, 2) + '\n');
  console.log(`Library 0.2.0: ${library.strategies.length} strategies, ${library.strategies.flatMap(m => m.tablets.items.flatMap(t => t.options)).length} registered tablet conditions; farming library refreshed.`);
}

