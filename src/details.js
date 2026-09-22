import { propertyLines } from './waystones.js';
import { investmentText, priorities } from './model.js';
import { reviewLabel } from './catalog.js';
import { optionRequirementText } from './usability.js';
import { renderMasterAbilities } from './master-view.js';

const nodeBasis = {
  video: ['영상 설명', '영상의 설명을 근거로 기록했습니다.'],
  effect_matched: ['효과 대조', '영상 설명과 능력의 효과를 대조해 연결했습니다.'],
  screen_and_effect: ['화면·효과 대조', '영상의 일부 화면과 효과를 대조했습니다.'],
  poedb_prerequisite: ['PoEDB 전제 조건', 'PoEDB의 전제 조건을 근거로 기록했습니다.'],
  creator_guide: ['제작자 문서', '제작자 문서를 근거로 기록하고 PoEDB 명칭을 대조했습니다.'],
  personal: ['개인 선택', '사용자가 선택한 구성으로, 별도 검증되지 않았습니다.']
};

export function renderDetail(m, sources, personal, preview, ctx) {
  const { esc, rich, term, list, evidence, ext, optionsView, nodeView, record, origin, changed, selected, compareIds, breadcrumb, pageLink } = ctx;
  const w = m.waystone, map = m.map, cost = m.reportedResults.costExample;
  const panel = (key, title, body) => preview
    ? `<section class="panel" data-preview-panel="${key}"><h3>${title}</h3>${body}</section>`
    : `<details class="panel detail-panel" id="${key}" tabindex="-1" open><summary><h3>${title}</h3><span class="panel-toggle-label" aria-hidden="true"><span class="when-open">접기</span><span class="when-closed">펼치기</span></span></summary><div class="detail-panel-body">${body}</div></details>`;
  const refs = (label, rows) => rows.length ? `<details><summary>${label}</summary>${evidence(rows)}</details>` : '';
  const basisGroups = new Map();
  const addBasis = (node, label) => {
    if (!basisGroups.has(node.basis)) basisGroups.set(node.basis, []);
    basisGroups.get(node.basis).push(`${label} · ${node.name}`);
  };
  m.atlas.nodes.forEach(n => addBasis(n, '아틀라스'));
  m.masters.choices.forEach((c, i) => c.nodes.forEach(n => addBasis(n, `대가 선택안 ${i + 1} · ${c.name}`)));
  const basisDetails = basisGroups.size ? `<details class="node-basis"><summary>노드·능력의 기록 근거</summary><p>아래 분류는 자료를 작성한 근거이며, 현재 패치의 실전 검증 완료를 뜻하지 않습니다.</p>${[...basisGroups].map(([basis, names]) => `<h4>${esc(nodeBasis[basis]?.[0] || '근거 미확인')}</h4><p>${esc(nodeBasis[basis]?.[1] || '')}</p>${list(names)}`).join('')}</details>` : '';
  const sourceCards = sources.map(s => `<div class="source-card">${ext(s.url, `${s.creator} · ${s.titleKo}`)}<small>${esc(s.publishedAt)} · ${esc(s.language)} · 패치 ${esc(s.patch || '미확인')} (${esc(s.patchEvidence)})</small>${s.titleOriginal ? `<small>${esc(s.titleOriginal)}</small>` : ''}${s.audience ? `<small>조회수 ${s.audience.views.toLocaleString('ko-KR')}회 · ${esc(s.audience.checkedAt)} 확인 · 조회수는 정확성을 보증하지 않습니다.</small>` : ''}${s.reviewNote ? `<p>${esc(s.reviewNote)}</p>` : ''}</div>`).join('');
  const guideCard = m.creatorGuide ? `<div class="source-card">${ext(m.creatorGuide.url, `제작자 세팅 문서 · ${m.creatorGuide.section}`)}<small>${esc(m.creatorGuide.checkedAt)} 확인</small><p>${esc(m.creatorGuide.note)}</p></div>` : '';
  const reviewCard = m.evidenceReview ? `<div class="source-card"><strong>자료 기준</strong><small>${esc(m.evidenceReview.checkedAt)} · ${esc(m.evidenceReview.scope)}</small><p>${esc(m.evidenceReview.note)}</p></div>` : '';
  const atlasSetup = `<section class="setup-group"><h4>아틀라스 선택</h4><div class="atlas-nodes">${m.atlas.nodes.map(n => nodeView(n, 'atlas')).join('') || '<p class="muted">선택 미확인</p>'}</div>${m.atlas.otherPriorities?.length ? `<h5>추가 우선순위</h5>${list(m.atlas.otherPriorities)}` : ''}<p class="muted">전체 연결 경로: ${m.atlas.fullTreeVerified ? '확인 표시 있음 · 재검증 필요' : '미검증'}</p>${refs('아틀라스 근거', m.atlas.evidence)}</section>`;
  const masterSetup = `<section class="setup-group master-group"><h4>대가 선택</h4><p class="setup-help">${m.masters.choices.length > 1 ? '아래 대안 중 하나를 선택하세요. 능력은 각 대가 구성에 속합니다.' : '대가와 그 구성에 속한 능력을 함께 확인하세요.'}</p><div class="master-options">${m.masters.choices.map((c, i) => `<article class="master-choice"><header class="master-choice-heading">${m.masters.choices.length > 1 ? `<span class="master-choice-label">선택안 ${i + 1}</span>` : ''}<h5>${term(c.name)}</h5>${c.role ? `<p class="master-role">${rich(c.role)}</p>` : ''}</header><div class="master-ability-group" role="group" aria-label="${esc(c.name)}의 선택 능력">${renderMasterAbilities(c, { esc, term, nodeView })}</div></article>`).join('') || '<p class="muted">구성 미확인</p>'}</div><p class="muted">전체 구성: ${m.masters.fullSetupVerified ? '영상 근거 있음 · 현재 유효성 미검증' : '미검증'}</p>${refs('대가 근거', m.masters.evidence)}</section>`;
  const setup = panel('setup', '아틀라스·대가 설정', atlasSetup + masterSetup);
  const tablets = panel('tablets', '서판 구성', `${m.tablets.items.map((t, i) => `<div class="tablet-heading"><span class="tablet-icon" aria-hidden="true">${i+1}</span><div><strong>${term(t.name)} <span class="pill tablet-count${t.count === null ? ' unknown-count' : ''}">${t.count === null ? '개수 미확인' : `${t.count}개`}</span></strong><small>구성 ${i+1} · ${priorities[t.status]}</small></div></div>${t.options.length ? optionsView(t.options) : `<p class="muted">${optionRequirementText(t)}</p>`}${preview ? '' : `<button class="trade-search" data-trade="tablet" data-index="${i}">${esc(t.name)} 거래소 검색 ↗</button>`}`).join('<hr>') || `<p class="muted">${m.tablets.usage === 'not_used' ? '이 세팅에서는 서판을 사용하지 않습니다.' : '서판 구성 미확인'}</p>`}${m.tablets.notes.length ? list(m.tablets.notes) : ''}${refs('서판 근거', m.tablets.evidence)}`);
  const waystone = panel('waystone', '경로석·지도', `<p class="waystone-baseline">등급 <strong>${w.tier ?? '미확인'}</strong> · 속성 수 <strong>${w.affixCount ?? '미확인'}</strong> · ${w.corrupted === null ? '타락 여부 미확인' : w.corrupted ? '타락' : '비타락'}</p>${propertyLines(w).length ? `<h4>경로석 수치 조건</h4><div class="waystone-targets">${list(propertyLines(w))}</div>` : ''}${optionsView(w.options)}${preview ? '' : '<button class="trade-search" data-trade="waystone">경로석 거래소 검색 ↗</button>'}${w.notes.length ? list(w.notes) : ''}<h4>지도·환경</h4><p>${map.regions.map(r => term(r)).join(' / ') || '지역 미확인'} · ${esc(map.biomes.join(' / ') || '환경 미확인')}</p>${map.conditions.length ? list(map.conditions) : ''}${map.optional.length ? `<h4>선택 사항</h4>${list(map.optional)}` : ''}${refs('경로석·지도 근거', [...w.evidence, ...map.evidence])}`);
  const steps = panel('steps', '진행 순서', `<h4>준비물</h4>${list(m.supplies)}<h4>파밍 흐름</h4>${m.steps.length ? `<ol class="step-list">${m.steps.map(s => `<li>${rich(s)}</li>`).join('')}</ol>` : '<p class="muted">미확인</p>'}<h4>중단 조건</h4>${list(m.stopConditions)}<h4>주의점</h4>${m.constraints.map(c => `<p>${rich(c.text)}</p>${c.evidence ? evidence([c.evidence]) : ''}${c.sourceUrl ? ext(c.sourceUrl, '참고 자료') : ''}`).join('') || '<p class="muted">미확인</p>'}${refs('진행 근거', m.executionEvidence)}`);
  const sourcePanel = panel('sources', '출처와 적용 범위', `${reviewCard}${sourceCards || '<p class="muted">등록된 출처 없음</p>'}${guideCard}${basisDetails}<h4>미확인 사항</h4>${list(m.unresolved)}<h4>영상 수익 사례</h4><p>${rich(m.reportedResults.text)}</p><p class="muted">검증된 시간당 순이익: 미확인</p>${evidence(m.reportedResults.evidence)}${cost ? `<h4>영상 당시 비용 예시</h4><p>지도당 약 ${cost.perMapApprox} ${term(cost.currency)} · ${esc(cost.priceDate)}</p><p>포함: ${rich(cost.includes)}</p><p>제외·미확인: ${rich(cost.excludes)}</p>${ext(cost.sourceUrl, '비용 근거')}` : ''}`);
  const toc = [['tablets','서판 구성'],['waystone','경로석·지도'],['setup','아틀라스·대가'],['steps','진행·주의점'],['sources','출처·확인']];
  return `${breadcrumb([pageLink('파밍 라이브러리', 'library'), ...(personal ? [pageLink('내 데이터', 'library', { scope: 'personal' })] : []), `<span aria-current="page">${esc(m.name)}</span>`])}
    <div class="detail-hero"><div><h2>${esc(m.name)}</h2><p>${rich(m.summary)}</p></div><div class="hero-actions">${preview ? '' : `<button class="primary" data-action="play">준비·진행 시작</button>${personal ? '<button data-action="edit">세팅 편집 ↗</button><button data-action="delete" class="danger">개인 파밍법 삭제</button>' : '<button data-action="copy">＋ 내 데이터로 복사</button><button data-action="share">주소 공유 ↗</button>'}<button data-compare="${esc(selected)}" aria-pressed="${compareIds.includes(selected)}">${compareIds.includes(selected) ? '✓ 비교 선택됨' : '＋ 비교에 담기'}</button>`}</div></div>
    <dl class="meta-strip"><div><dt>목적</dt><dd>${esc(m.goals.join(' · ') || '미확인')}</dd></div><div><dt>예상 투자 비용</dt><dd>${esc(investmentText(m))}</dd></div><div><dt>출처 패치</dt><dd>${esc(m.patch || '미확인')}</dd></div><div><dt>확인 상태</dt><dd>${reviewLabel({personal, method:m})}</dd></div></dl>
    <p class="notice">${personal ? '개인 세팅입니다.' : '출처 패치 기준의 세팅입니다.'} 현재 패치의 유효성·전체 아틀라스 경로·시간당 순이익은 미확인입니다.</p>
    <details class="entry-check"><summary>시작 전 조건·확인할 사항</summary><h4>준비·진입 조건</h4>${list([...map.conditions, ...m.supplies])}<p>캐릭터 요구 수준과 솔로 적합성은 별도 검증되지 않았습니다.</p><h4>위험·제약</h4>${list(m.constraints.map(c => c.text))}<h4>미확인 사항</h4>${list(m.unresolved)}</details>
    ${changed ? '<p class="notice">기본 자료가 복사 이후 변경되었습니다. 내 수정본은 그대로 유지됩니다. <button data-action="compare-origin">현재 기본 자료와 비교</button></p>' : ''}
    ${personal && record?.originId && !origin ? '<p class="notice">연결된 원본이 현재 기본 자료에 없습니다. 내 수정본과 출처는 유지됩니다.</p>' : ''}
    <div class="detail-layout"><div class="detail-main">${tablets}${waystone}${setup}${steps}${sourcePanel}${personal ? panel('notes','나의 메모',`<p style="white-space:pre-wrap">${esc(m.notes || '아직 작성한 메모가 없습니다.')}</p>`) : ''}</div>${preview ? '' : `<nav class="detail-toc" aria-label="파밍법 목차"><strong>이 페이지</strong>${toc.map(([key,label]) => `<a href="#${key}" data-detail-section="${key}">${label}</a>`).join('')}<button data-action="play">준비·진행</button><button data-action="toggle-sidebar">파밍법 바꾸기</button></nav>`}</div>`;
}
