import { groupedTablets, canLinkInProse, progressFor, preparationItems, nextRun } from './usability.js';
import { renderComparisonContent } from './comparison.js';
import { renderPlay } from './play.js';
import { clone, copyMethod, blankRecord, envelope, parseBackup, mergeRecords, validateData, createStore, versionOf, priorities, metrics, investments, tabletUsages, MAX_BYTES } from './model.js';
import { baseKey, facetValues, filterEntries, tabletSummary, reviewLabel, toggleComparison, publicUrl, parseRoute, UNKNOWN, NOT_APPLICABLE } from './catalog.js';
import { renderDetail } from './details.js';
import { editorData } from './editor-data.js';
import { editorControls, selectableAtlas } from './editor.js';
import { investmentText, makeModifier } from './model.js';
import { installTradeDialog } from './trade-ui.js';
import { waystoneEffectFor } from './waystones.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let seed, terms, verification, store, bases = [], records = [], selected = 'base', mode = 'detail', scope = 'all', draft, draftErrors = [], storageBroken = false, storageSaved = true, pendingImport, termCounter = 0;
let compareIds = [], differencesOnly = false, routeError = '', filters = {}, routeLocation = '';
let termsByName, termPattern;
let pendingDelete, sidebarOpen = false, comparisonDetails = false;
const progress = new Map();
let sectionObserver;
const selectQueries = new Map();
let editBaseline, editNew = false, editReturn;
let previewReturn, previewSection = 'notes';
let restoringPosition = false;
// LOCAL_ADMIN_START
let libraryAdmin = null, libraryRevision;
// LOCAL_ADMIN_END
history.scrollRestoration = 'manual';
function rememberPosition() {
  if (restoringPosition || !history.state || mode === 'edit') return;
  history.replaceState({ ...history.state, scrollY, comparisonScroll: $('.comparison-scroll')?.scrollTop || 0 }, '', location.href);
}
function focusPageStart() { $('#main').focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
const contextualTerms = new Map();
const time = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const status = message => { $('#toast').textContent = message; $('#toast').classList.add('active'); clearTimeout(status.timer); status.timer = setTimeout(() => $('#toast').classList.remove('active'), 4500); };
const ext = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
function term(name, choice = null, context = null) {
  const t = contextualTerms.get(`${context}:${name}`) || termsByName.get(name);
  if (!t) return esc(name);
  const id = `term-link-${++termCounter}`;
  return `<a class="term-link" id="${id}" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" data-term="${t.id}" data-choice="${esc(choice)}" aria-haspopup="dialog" title="포커스로 설명 보기 · ↓ 설명 카드로 이동 · Enter로 PoEDB 열기">${esc(t.nameKo)}</a>`;
}
function rich(text) {
  const value = String(text ?? '');
  let result = '', last = 0;
  for (const match of value.matchAll(termPattern)) { result += esc(value.slice(last, match.index)) + (canLinkInProse(value, match.index, match[0]) ? term(match[0]) : esc(match[0])); last = match.index + match[0].length; }
  return result + esc(value.slice(last));
}
const list = (items, fallback = '미확인') => items.length ? `<ul>${items.map(s => `<li>${rich(s)}</li>`).join('')}</ul>` : `<p class="muted">${fallback}</p>`;
const evidence = items => items.length ? `<div class="evidence">영상 근거 ${items.map(e => ext(e.url, time(e.startSeconds))).join('')}</div>` : '<p class="muted">영상 근거 미확인</p>';
const getRecord = () => records.find(r => r.id === selected);
const entries = () => [...bases, ...records.map(r => ({ ...r, personal: true }))];
const getEntry = id => entries().find(e => e.id === id);
function pageLink(label, page = 'home', { scope: targetScope = '' } = {}) {
  const params = new URLSearchParams();
  if (page === 'library') params.set('view', page);
  if (targetScope) params.set('scope', targetScope);
  return `<a href="${params.size ? '?' + esc(params.toString()) : './'}" data-page="${page}" data-target-scope="${targetScope}">${esc(label)}</a>`;
}
function breadcrumb(parts) {
  return `<nav class="breadcrumb" aria-label="현재 위치"><ol><li>${pageLink('홈')}</li>${parts.map(part => `<li>${part}</li>`).join('')}</ol></nav>`;
}
function navigatePage(page, targetScope = 'all') {
  if (!guard()) return;
  sidebarOpen = false; mode = page; selected = ''; routeError = ''; scope = targetScope || 'all';
  updateRoute(); render(); $('#main').focus(); window.scrollTo({ top: 0, behavior: 'instant' });
}
function tabletSummaryView(method) {
  if (method.tablets.usage !== 'use' || !method.tablets.items.length) return esc(tabletSummary(method));
  return groupedTablets(method).map(t => `<span class="summary-tablet">${esc(t.name)} <b class="inline-count${t.count === null ? ' unknown-count' : ''}">${t.count === null ? '개수 미확인' : `${t.count}개`}</b> <span class="summary-status">(${esc(priorities[t.status])})${t.configurations > 1 ? ` · ${t.configurations}개 구성` : ''}</span></span>`).join(' + ');
}
function libraryCards(items) {
  return items.map(e => `<article class="browse-card"><span class="eyebrow">${e.personal ? '내 데이터' : '기본 자료'}</span><h3><a href="${e.personal ? './' : `?method=${encodeURIComponent(e.method.id)}`}" data-select="${esc(e.id)}">${esc(e.method.name)} <span aria-hidden="true">↗</span></a></h3><p>${esc(e.method.summary)}</p><p class="browse-setup"><span class="setup-label">서판 구성</span>${tabletSummaryView(e.method)}</p><div class="browse-meta">${esc(investmentText(e.method))} · ${esc(e.method.patch || '패치 미확인')}</div><button data-compare="${esc(e.id)}" aria-pressed="${compareIds.includes(e.id)}">${compareIds.includes(e.id) ? '✓ 비교 선택됨' : '＋ 비교에 담기'}</button></article>`).join('');
}
function renderHome() {
  document.title = '파밍 노트 · PoE2';
  $('#content').innerHTML = `<section class="home-hero"><div><span class="eyebrow">YOUR NEXT FARMING RUN</span><h1>오늘의 파밍을<br>준비하는 곳.</h1><p>파밍법을 찾고, 준비 조건을 비교하고,<br>나에게 맞는 세팅으로 기록하세요.</p><div class="home-actions">${pageLink('파밍 라이브러리 둘러보기 ↗', 'library')}${pageLink('내 데이터 열기', 'library', { scope: 'personal' })}</div></div><div class="home-guide"><span class="eyebrow">FARMING FIELD NOTES</span><strong>${bases.length}<small>개의 기본 파밍법</small></strong><ol><li><b>01</b> 목적에 맞는 파밍법 찾기</li><li><b>02</b> 2~3개의 준비 조건 비교하기</li><li><b>03</b> 내 데이터로 복사해 세팅 기록하기</li></ol></div></section><section class="home-section" aria-labelledby="browse-title"><div class="section-heading"><h2 id="browse-title">파밍 준비 시작하기</h2><span>찾고, 비교하고, 기록하기</span></div><div class="category-grid">${[['library', '파밍 라이브러리', '목적과 콘텐츠로 파밍법을 찾고, 서판과 경로석부터 아틀라스 세팅까지 비교하세요.'], ['personal', '내 데이터', '복사한 세팅과 직접 작성한 나의 파밍 기록.']].map(([key, label, description]) => `<div class="category-card"><span class="category-count">${key === 'personal' ? records.length : bases.length}개</span><h3>${pageLink(label + ' ↗', 'library', key === 'personal' ? { scope: 'personal' } : {})}</h3><p>${description}</p></div>`).join('')}</div></section><section class="home-section" aria-labelledby="start-title"><div class="section-heading"><h2 id="start-title">기본 자료 둘러보기</h2>${pageLink('전체 보기 ↗', 'library')}</div><div class="browse-grid">${libraryCards(bases.slice(0, 3))}</div></section><p class="notice">영상 기반 초안입니다. 현재 패치의 유효성·전체 아틀라스 경로·시간당 순이익은 미확인입니다. 각 파밍법의 출처와 확인 상태를 함께 살펴보세요.</p><p class="footer-note">개인 세팅은 이 브라우저에 저장됩니다. 다른 기기로 옮기려면 JSON으로 백업하세요.</p>`;
}
function renderLibrary() {
  const title = scope === 'personal' ? '내 데이터' : '파밍 라이브러리';
  const results = filterEntries(entries(), { query: $('#search').value, scope, ...filters });
  document.title = `${title} · 파밍 노트`;
  $('#content').innerHTML = `${breadcrumb([...(title !== '파밍 라이브러리' ? [pageLink('파밍 라이브러리', 'library')] : []), `<span aria-current="page">${title}</span>`])}<div class="detail-hero"><div><span class="eyebrow">EXPLORE THE LIBRARY</span><h2>${title}</h2><p>조건으로 좁히고, 비교에 담아 준비물을 확인하세요.</p></div><span class="badge">${results.length}개 파밍법</span></div><div class="library-shortcuts">${pageLink('전체', 'library')}${pageLink('내 데이터', 'library', { scope: 'personal' })}</div><div class="browse-grid">${libraryCards(results)}</div>${results.length ? '' : `<div class="library-empty"><h3>${scope === 'personal' && !records.length ? '아직 저장한 개인 세팅이 없습니다.' : '일치하는 파밍법이 없습니다.'}</h3><p>${scope === 'personal' && !records.length ? '기본 자료에서 ‘내 데이터로 복사’를 누르거나 새 파밍법을 작성하세요.' : '검색어나 조건을 변경해보세요.'}</p><button data-action="reset-filters">전체 파밍법 보기</button></div>`}`;
}
function warning(message) {
  const el = $('#storage-warning'); el.hidden = false;
  el.replaceChildren(document.createTextNode(message));
  if (store?.raw()) { const b = document.createElement('button'); b.textContent = '기존 저장 원문 백업'; b.onclick = () => download(store.raw(), 'poe2-storage-recovery.json'); el.append(b); }
}
function download(raw, name) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function persist(recover = false) {
  try { store.write(envelope(records), recover); storageBroken = false; storageSaved = true; $('#storage-warning').hidden = true; return true; }
  catch (error) { storageSaved = false; warning(`저장하지 못했습니다. ${error.message} 편집 중인 내용은 그대로 유지됩니다.`); return false; }
}
const editChanged = () => mode === 'edit' && (editNew || JSON.stringify(draft) !== editBaseline);
function guard() {
  // LOCAL_ADMIN_START
  if (libraryAdmin?.busy) return false;
  // LOCAL_ADMIN_END
  if (editChanged()) { status('편집 중인 내용이 있습니다. 저장하거나 취소한 뒤 이동하세요.'); return false; }
  return true;
}
function beginEdit(record, isNew = false, selection = record.id) {
  // LOCAL_ADMIN_START
  if (selection === record.id) libraryAdmin?.end();
  // LOCAL_ADMIN_END
  editReturn = { selected, mode }; editNew = isNew;
  draft = clone(record); editBaseline = JSON.stringify(draft); draftErrors = [];
  sidebarOpen = false; selectQueries.clear(); selected = selection; mode = 'edit'; routeError = ''; render(); focusPageStart();
  if (isNew) { $('#field-method-name').focus({preventScroll:true}); $('#field-method-name').select(); }
}
function endEdit(cancel = false) {
  // LOCAL_ADMIN_START
  libraryAdmin?.end();
  // LOCAL_ADMIN_END
  if (cancel && editNew) { selected = editReturn.selected; mode = editReturn.mode; }
  else mode = 'detail';
  draft = null; draftErrors = []; editBaseline = null; editNew = false;
  updateRoute(true); render(); $('#main').focus();
}
function renderList() {
  const all = entries();
  const filtered = filterEntries(all, { query: $('#search').value, scope, ...filters });
  $('#list').innerHTML = `<div class="list-count"><span>FARMING METHODS</span><span>${filtered.length} / ${all.length}개</span></div>` + (filtered.map(r => `<div class="library-item"><button class="method-card" data-select="${esc(r.id)}" aria-current="${r.id === selected && mode !== 'compare'}"><span class="card-tag">${r.personal ? 'PERSONAL · 내 데이터' : '기본 자료'}</span><strong>${esc(r.method.name)}</strong><span class="card-description">${esc(r.method.goals.join(' · ') || '목적 미확인')}</span><span class="card-description card-setup">${tabletSummaryView(r.method)}</span><span class="card-bottom"><span>${esc(investmentText(r.method))} · ${esc(r.method.masters?.choices.map(c => c.name).filter((v, i, a) => a.indexOf(v) === i).join(' / ') || '대가 미확인')}</span><span>${esc(r.method.patch || '패치 미확인')}</span></span><span class="card-bottom">${reviewLabel(r)}</span></button><button class="compare-toggle" data-compare="${esc(r.id)}" aria-pressed="${compareIds.includes(r.id)}" aria-label="${esc(r.method.name)} 비교 ${compareIds.includes(r.id) ? '해제' : '선택'}">${compareIds.includes(r.id) ? '✓ 비교 선택됨' : '＋ 비교에 담기'}</button></div>`).join('') || '<p class="empty">일치하는 파밍법이 없습니다.</p><button data-action="reset-filters">검색 조건 초기화</button>');
  renderTray();
}
function renderFilters() {
  const labels = { content: '콘텐츠', goal: '목적', tablet: '서판', master: '대가', patch: '패치', investment: '영상 투자 분류' };
  const labelOf = (key, value) => value === UNKNOWN ? '미확인' : value === NOT_APPLICABLE ? (key === 'tablet' ? '사용하지 않음' : '적용하지 않음') : (key === 'investment' ? investments[value] : value);
  $('#filters').innerHTML = Object.entries(labels).map(([key, label]) => {
    const values = [...new Set(entries().flatMap(e => facetValues(e.method, key)))].sort((a, b) => labelOf(key, a).localeCompare(labelOf(key, b), 'ko'));
    if (filters[key] && !values.includes(filters[key])) values.push(filters[key]);
    return `<label class="field"><span>${label}</span><select data-filter="${key}"><option value="">전체 ${label}</option>${values.map(v => `<option value="${esc(v)}" ${filters[key] === v ? 'selected' : ''}>${esc(labelOf(key, v))}</option>`).join('')}</select></label>`;
  }).join('') + `<label class="field"><span>확인 상태</span><select data-filter="review"><option value="">전체 확인 상태</option><option value="source" ${filters.review === 'source' ? 'selected' : ''}>영상 추출 · 미검증</option><option value="personal" ${filters.review === 'personal' ? 'selected' : ''}>개인 수정 · 미검증</option></select></label><button type="button" data-action="reset-filters">조건 초기화</button>`;
}
function renderTray() {
  const selectedEntries = compareIds.map(getEntry).filter(Boolean);
  $('#compare-tray').hidden = !selectedEntries.length || ['compare', 'edit', 'play'].includes(mode);
  $('#compare-tray').innerHTML = `<details><summary>비교 ${selectedEntries.length} / 3 · 선택 목록</summary><div class="compare-chips">${selectedEntries.map(e => `<button data-compare="${esc(e.id)}" aria-label="${esc(e.method.name)} 비교 해제">${esc(e.method.name)} ×</button>`).join('')}</div></details><div class="hero-actions"><button data-action="clear-compare">선택 비우기</button><button class="primary" data-action="compare" ${selectedEntries.length < 2 ? 'disabled' : ''}>${selectedEntries.length}개 비교</button></div>`;
}
function numericText(o) { return `${metrics[o.metric]} ${o.min === null ? '수치 미확인' : `${o.min}${o.unit || ''} 이상`}`; }
function optionsView(options) {
  return options.length ? `<ul class="option-list">${options.map(o => `<li><span class="priority ${o.priority}">${priorities[o.priority]}</span><span>${rich(o.text)}${o.metric && o.text !== numericText(o) ? `<br><small class="muted">수치 기준 · ${esc(numericText(o))}</small>` : ''}</span></li>`).join('')}</ul>` : '<p class="muted">속성 미확인</p>';
}
function nodeView(n, context) { return `<div class="node-row">${term(n.name, n.choice, context)}${n.choice ? `<p><span class="selection">선택 · ${esc(n.choice)}</span></p>` : ''}</div>`; }
function detail(m, sources, personal = false, preview = false) {
  const record = getRecord();
  const origin = seed.strategies.find(s => s.id === record?.originId);
  const changed = !!(personal && origin && record.originVersion !== versionOf(seed, origin));
  return renderDetail(m, sources, personal, preview, { esc, rich, term, list, evidence, ext, optionsView, nodeView, record, origin, changed, selected, compareIds, breadcrumb, pageLink });
}
function render() {
  // LOCAL_ADMIN_START
  if (mode !== 'edit') libraryAdmin?.end();
  // LOCAL_ADMIN_END
  sectionObserver?.disconnect(); closeTerm(); renderList(); renderFilters();
  document.body.classList.toggle('home-page', mode === 'home' && !routeError);
  document.body.dataset.mode = mode;
  document.body.classList.toggle('switcher-open', sidebarOpen);
  $('.sidebar').hidden = mode !== 'library' && !sidebarOpen;
  $('#main').inert = sidebarOpen; $('.topbar').inert = sidebarOpen; $('#compare-tray').inert = sidebarOpen;
  if (sidebarOpen) { $('.sidebar').setAttribute('role','dialog'); $('.sidebar').setAttribute('aria-modal','true'); }
  else { $('.sidebar').removeAttribute('role'); $('.sidebar').removeAttribute('aria-modal'); }
  $('#list').hidden = mode === 'library';
  $('#workspace-switch')?.remove();
  if (['detail','compare','play'].includes(mode)) $('#main').insertAdjacentHTML('afterbegin', '<button id="workspace-switch" data-action="toggle-sidebar" aria-expanded="' + sidebarOpen + '">파밍법 바꾸기</button>');
  document.querySelectorAll('[data-scope]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.scope === scope)));
  document.querySelectorAll('.top-nav a').forEach(a => { if ((mode === 'home') === (a.dataset.page === 'home')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (mode === 'edit') { renderEditor(); return; }
  if (routeError) { $('#content').innerHTML = `<h2>주소를 확인해주세요</h2><p>${esc(routeError)}</p><button data-action="home">홈으로 이동</button>`; return; }
  if (mode === 'home') { renderHome(); return; }
  if (mode === 'library') { renderLibrary(); return; }
  if (mode === 'compare') { renderComparison(); return; }
  if (mode === 'play') { renderRun(); return; }
  const r = getEntry(selected);
  if (!r) { $('#content').innerHTML = '<h2>개인 자료를 찾을 수 없습니다.</h2><p>해당 자료를 JSON으로 가져오거나 목록에서 다시 선택하세요.</p>'; return; }
  document.title = `${r.method.name} · 파밍 노트`;
  $('#content').innerHTML = detail(r.method, r.sources, !!r.personal);
  // LOCAL_ADMIN_START
  libraryAdmin?.decorateDetail();
  // LOCAL_ADMIN_END
  $('.detail-layout').prepend($('.detail-toc'));
  observeSections();
}
function renderComparison() {
  const chosen = compareIds.map(getEntry).filter(Boolean);
  document.title = '파밍법 비교 · 파밍 노트';
  if (chosen.length < 2) { $('#content').innerHTML = '<h2>파밍법 비교</h2><p>목록에서 파밍법을 2~3개 선택하세요.</p>'; return; }
  $('#content').innerHTML = `${breadcrumb([pageLink('파밍 라이브러리', 'library'), '<span aria-current="page">준비 조건 비교</span>'])}<div class="detail-hero"><div><h2>파밍법 비교</h2><p>준비물과 선택 효과를 나란히 확인하세요.</p></div>${chosen.every(e=>!e.personal) ? '<button data-action="share">비교 주소 공유 ↗</button>' : '<p class="footer-note">개인 자료는 JSON으로 공유하세요.</p>'}</div>${renderComparisonContent(chosen,comparisonDetails,differencesOnly,{esc,rich,ext,evidence})}`;
  $('.comparison-scroll').addEventListener('scroll',rememberPosition,{passive:true});
}
function updateRoute(replace = false) {
  if (!replace) rememberPosition();
  const chosen = mode === 'compare' ? compareIds.map(getEntry).filter(Boolean) : [getEntry(selected)].filter(Boolean);
  let url = new URL(location.href); url.search = ''; url.hash = '';
  if (mode === 'library') { url.searchParams.set('view', 'library'); if (scope === 'personal') url.searchParams.set('scope', scope); }
  else if (mode !== 'home' && chosen.length && (mode !== 'compare' || chosen.length >= 2) && chosen.every(e => !e.personal)) url = new URL(publicUrl(url, chosen));
  history[replace ? 'replaceState' : 'pushState']({ selected, compareIds, mode: mode === 'edit' ? 'detail' : mode, filters, scope, query: $('#search').value, scrollY: replace ? scrollY : 0, comparisonScroll: replace ? $('.comparison-scroll')?.scrollTop || 0 : 0 }, '', url);
  routeLocation = location.pathname + location.search;
}
function readRoute(state) {
  routeError = '';
  if (typeof state?.selected === 'string' && Array.isArray(state.compareIds)) {
    selected = state.selected; compareIds = state.compareIds.filter(id => getEntry(id)).slice(0, 3); mode = ['home', 'library', 'compare', 'play'].includes(state.mode) ? state.mode : 'detail';
    filters = { ...state.filters }; delete filters.kind; scope = state.scope || 'all'; $('#search').value = state.query || '';
  } else {
    const route = parseRoute(location.href, bases); routeError = route.error || '';
    mode = route.mode || 'detail'; selected = route.selected || 'base'; compareIds = route.compareIds || [];
    filters = route.filters || {}; scope = route.scope || 'all'; $('#search').value = '';
  }
}
async function shareCurrent() {
  try {
    const chosen = mode === 'compare' ? compareIds.map(getEntry).filter(Boolean) : [getEntry(selected)];
    const url = publicUrl(location.href, chosen);
    $('#share-url').value = url;
    $('#share-note').textContent = ['localhost', '127.0.0.1'].includes(location.hostname) ? '현재는 로컬 주소입니다. 다른 사람에게 전달할 공개 주소는 배포 후 사용할 수 있습니다.' : '기본 자료의 주소입니다. 개인 수정본은 포함되지 않습니다.';
    $('#share-dialog').showModal(); $('#share-url').select();
    try { await navigator.clipboard.writeText(url); $('#share-status').textContent = '주소를 복사했습니다.'; } catch { $('#share-status').textContent = '아래 주소를 선택해 복사하세요.'; }
  } catch (error) { status(error.message); }
}
function pathGet(object, path) { return path.split('.').reduce((o, k) => o?.[k], object); }
function pathSet(object, path, value) { const parts = path.split('.'); const key = parts.pop(); parts.reduce((o, k) => o[k], object)[key] = value; }
function field(path, label, type = 'text', choices = null, hint = '') {
  if (type === 'lines') return getControls().listEditor(path, label.replace(/ · 한 줄에.*$/, ''));
  if (path.endsWith('.patch')) choices = Object.fromEntries(['', ...new Set([...editorData.patches, ...bases.map(e => e.method.patch), ...records.map(e => e.method.patch), ...draft.sources.map(s => s.patch), pathGet(draft, path)].filter(Boolean))].map(v => [v, v || '미확인']));
  if (type === 'term-tablet') choices = Object.fromEntries(terms.filter(t => t.kind === '서판').map(t => [t.nameKo, t.nameKo]));
  const value = pathGet(draft, path), id = `field-${path.replaceAll('.', '-')}`;
  let control;
  if (choices) control = `<select id="${id}" data-path="${path}" data-type="${type}">${Object.entries(choices).sort(([a], [b]) => a === '' ? -1 : b === '' ? 1 : 0).map(([v, l]) => `<option value="${esc(v)}" ${String(value ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (type === 'lines' || type === 'textarea') control = `<textarea id="${id}" data-path="${path}" data-type="${type}">${esc(type === 'lines' ? value.join('\n') : value)}</textarea>`;
  else control = `<input id="${id}" data-path="${path}" data-type="${type}" type="${type === 'number' ? 'number' : 'text'}" ${type === 'number' ? 'step="any" placeholder="미확인"' : ''} ${type.startsWith('term') ? `list="${type}-list" autocomplete="off"` : ''} value="${esc(value)}">`;
  control = control.replace(/^(<(?:select|textarea|input))/, `$1 aria-labelledby="label-${id}"`);
  if (type === 'number') {
    const limits = path.includes('waystone.properties.') ? [0, 100000, path.includes('.revives.') ? 1 : 'any'] : /^method\.tablets\.items\.\d+\.count$/.test(path) ? [1, 4, 1] : path.endsWith('waystone.tier') ? [1, 16, 1] : path.endsWith('waystone.affixCount') ? [0, 8, 1] : path.endsWith('.amount') ? [0, 100000000, 'any'] : path.endsWith('.min') ? [0, 100000, 'any'] : null;
    if (limits) control = control.replace('step="any"', `min="${limits[0]}" max="${limits[1]}" step="${limits[2]}"`);
    if (path.includes('waystone.properties.')) control = control.replace('placeholder="미확인"', 'placeholder="제한 없음"');
  }
  return `<label class="field" for="${id}"><span id="label-${id}">${label}</span>${control}${hint ? `<small>${hint}</small>` : ''}</label>`;
}
const action = (op, path, label) => `<button type="button" data-op="${op}" data-path="${path}">${label}</button>`;
const getControls = () => editorControls({ draft, terms, esc, field, action, pathGet });
function optionEditor(path) {
  if (path.startsWith('method.tablets.')) return getControls().optionEditor(path);
  return getControls().waystoneEditor(path);
}
function nodeEditor(path, kind = 'term-node') {
  return getControls().nodeEditor(path);
}
function renderEditor() {
  const view = $('#editor') ? { x: scrollX, y: scrollY, open: [...document.querySelectorAll('#editor details[open][data-editor-details]')].map(el => el.dataset.editorDetails) } : null;
  draft.method.budget ??= { amount: null, currency: '엑잘티드 오브' };
  $('#content').innerHTML = `${breadcrumb([pageLink('파밍 라이브러리', 'library'), pageLink('내 데이터', 'library', { scope: 'personal' }), '<span aria-current="page">세팅 편집</span>'])}<div class="editor-heading"><div><h2>세팅 편집</h2><span id="save-status" class="save-status" role="status">입력 대기</span></div><div class="hero-actions">${editNew ? '' : '<button data-action="delete" class="danger">개인 파밍법 삭제</button>'}<button data-action="cancel-edit">취소</button><button data-action="finish" class="primary">저장</button></div></div><details class="editor-rules"><summary>입력·저장 안내</summary><p>서판 개수·경로석 등급의 빈 값은 미확인, 경로석 수치 범위의 빈 값은 제한 없음입니다. 선택 사항·적용하지 않음은 상태에서 구분하세요. 저장 전 변경은 개인 저장본에 반영되지 않습니다. 취소하면 이번 편집의 모든 변경을 버립니다.</p></details><div id="form-errors" class="notice error" role="alert" tabindex="-1" hidden></div>
    <div class="editor-layout"><div class="editor-main"><form id="editor" novalidate>
    <section class="panel editor-section quick-notes" id="edit-notes" tabindex="-1">${field('method.name', '파밍법 이름 (필수)')}<div class="section-heading"><h3>빠른 메모</h3><button type="button" data-preview-section="notes">메모 미리보기</button></div>${field('method.notes', '나의 메모', 'textarea')}<div class="hero-actions"><button type="button" data-note-to="supplies">선택한 문장 → 준비물</button><button type="button" data-note-to="steps">선택한 문장 → 진행 순서</button><button type="button" data-note-to="unresolved">선택한 문장 → 재확인 사항</button></div><p class="form-help">선택한 문장을 복사합니다. 원문은 유지되며, 메모는 공식 옵션·검증 정보로 취급하지 않습니다.</p><div id="note-copy-result" role="status"></div></section><section class="panel basic-info editor-section" id="edit-basic" tabindex="-1"><h3>기본 정보</h3><div class="form-grid"><div class="basic-cost-row">${field('method.patch', '적용 패치', 'nullable')}${getControls().budgetEditor()}</div><p id="budget-help" class="form-help budget-help">지도 1회당 비용입니다. 빈 값은 미확인, 0은 추가 비용 없음입니다.</p>${field('method.goals', '목적 · 한 줄에 하나', 'lines')}${getControls().checkList('method.content', '콘텐츠', editorData.contents)}${field('method.summary', '설명', 'textarea')}</div></section>
    <section class="panel editor-section" id="edit-tablets" tabindex="-1"><h3>서판 구성</h3>${draft.method.tablets.items.map((t, i) => { const p = `method.tablets.items.${i}`; return `<fieldset><legend>서판 ${i + 1}</legend><div class="form-grid">${field(`${p}.name`, '공식 서판 명칭', 'term-tablet')}${field(`${p}.status`, '사용 상태', 'text', priorities)}${field(`${p}.count`, '개수 (1~4)', 'number')}</div>${optionEditor(`${p}.options`)}<div class="row-actions">${action('remove', p, '서판 삭제')}</div></fieldset>`; }).join('')}${action('add-tablet', 'method.tablets.items', '＋ 서판 행 추가')}${field('method.tablets.notes', '서판 준비 메모 · 한 줄에 하나', 'lines')}</section>
    <section class="panel editor-section" id="edit-waystone" tabindex="-1"><h3>경로석 · 지도</h3><div class="waystone-basics">${field('method.waystone.tier', '경로석 등급', 'number', Object.fromEntries([['', '미확인'], ...Array.from({ length: 16 }, (_, i) => [i + 1, (i + 1) + '등급'])]))}${field('method.waystone.affixCount', '속성 수', 'number', Object.fromEntries([['', '미확인'], ...Array.from({ length: 9 }, (_, i) => [i, i + '개'])]))}${field('method.waystone.corrupted', '타락 여부', 'boolean', { '': '미확인', true: '타락', false: '비타락' })}</div>${getControls().waystonePropertyEditor()}${optionEditor('method.waystone.options')}${field('method.waystone.notes', '경로석 준비 메모 · 한 줄에 하나', 'lines')}<h4 class="editor-section" id="edit-map" tabindex="-1">지도 · 환경</h4><div class="form-grid">${getControls().checkList('method.map.regions', '지도 지역', editorData.regions)}${getControls().checkList('method.map.biomes', '환경', editorData.biomes)}${field('method.map.conditions', '준비 조건 · 한 줄에 하나', 'lines')}${field('method.map.optional', '선택 사항 · 한 줄에 하나', 'lines')}</div></section>
    <section class="panel editor-section" id="edit-atlas" tabindex="-1"><h3>아틀라스와 대가</h3><p class="form-help">노드와 효과를 목록에서 선택하세요. 변경한 배분은 개인 선택·미검증으로 표시됩니다.</p>${nodeEditor('method.atlas.nodes')}<h4 class="editor-section" id="edit-masters" tabindex="-1">대가 구성</h4>${draft.method.masters.choices.map((c, i) => getControls().masterEditor(c, i)).join('')}${action('add-master', 'method.masters.choices', '＋ 대가 구성 추가')}</section>
    <section class="panel editor-section" id="edit-steps" tabindex="-1"><div class="section-heading"><h3>진행 · 주의점</h3><button type="button" data-preview-section="steps">준비·진행 미리보기</button></div>${field('method.supplies', '준비물 · 한 줄에 하나', 'lines')}${field('method.steps', '진행 순서 · 한 줄에 한 단계', 'lines')}${field('method.stopConditions', '중단 조건 · 한 줄에 하나 (빈 값: 미확인)', 'lines')}${draft.method.constraints.map((c, i) => field(`method.constraints.${i}.text`, `주의점 ${i + 1}`)).join('')}${action('add-constraint', 'method.constraints', '＋ 주의점 추가')}${field('method.unresolved', '미확인 사항 · 한 줄에 하나', 'lines')}</section>
    <section class="preview editor-section" tabindex="-1" id="preview" aria-label="세팅 미리보기"><h3>미리보기</h3><button type="button" data-action="preview">현재 입력 미리보기</button><p>저장하기 전에 현재 입력을 확인할 수 있습니다.</p></section><div class="hero-actions editor-save-actions"><button type="button" data-action="cancel-edit">취소</button><button type="button" data-action="finish" class="primary">저장</button></div></form></div><nav class="editor-toc" aria-label="세팅 편집 목차"><strong>편집 목차</strong><div class="editor-toc-links">${[['edit-notes', '빠른 메모'], ['edit-basic', '기본 정보'], ['edit-tablets', '서판 구성'], ['edit-waystone', '경로석'], ...(draft.method.waystone ? [['edit-map', '지도 · 환경']] : []), ['edit-atlas', '아틀라스'], ...(draft.method.masters ? [['edit-masters', '대가 구성']] : []), ['edit-steps', '진행 · 주의점'], ['preview', '미리보기']].map(([id, label]) => `<a href="#${id}" data-editor-section="${id}">${label}</a>`).join('')}</div><div class="editor-toc-actions"><button type="button" data-action="cancel-edit">취소</button><button type="button" data-action="finish" class="primary">저장</button></div></nav></div>`;
  $('.editor-layout').prepend($('.editor-toc'));
  enhanceSelects(); observeSections(); showValidation();
  // LOCAL_ADMIN_START
  libraryAdmin?.decorateEditor();
  // LOCAL_ADMIN_END
  if (view) {
    view.open.forEach(path => document.querySelector(`[data-editor-details="${CSS.escape(path)}"]`)?.setAttribute('open', ''));
    window.scrollTo({ left: view.x, top: view.y, behavior: 'instant' });
  }
}
function showValidation(saved) {
  const box = $('#form-errors'); if (!box) return;
  box.hidden = !draftErrors.length;
  document.querySelectorAll('#editor [aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  const messages = draftErrors.map(error => {
    const [path, ...reason] = error.split(': ');
    const fieldPath = path.replace(/^백업\.records\[1\]\./, '').replace(/\[(\d+)\]/g, (_, n) => `.${Number(n) - 1}`);
    const input = document.querySelector(`#editor [data-path="${CSS.escape(fieldPath)}"]`);
    if (!input) return error;
    input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'form-errors');
    return `${input.getAttribute('aria-label') || input.closest('label')?.querySelector('span')?.textContent || fieldPath}: ${reason.join(': ')}`;
  });
  box.textContent = messages.length ? `저장하지 않은 입력이 있습니다. 마지막 정상 저장본은 유지됩니다.\n${messages.join('\n')}` : '';
  const failed = saved === false || !storageSaved;
  const label = $('#save-status'); label.classList.toggle('invalid', draftErrors.length > 0 || failed);
  label.textContent = draftErrors.length ? '입력 확인 필요 · 미저장' : failed ? '저장 실패 · 편집 내용 유지' : editChanged() ? '변경 사항 있음 · 저장 전' : '저장된 세팅 편집 중';
}
function validateDraft() {
  const candidates = editNew ? [...records, draft] : records.map(r => r.id === draft.id ? draft : r);
  draftErrors = validateData(envelope([draft]), terms);
  if (candidates.length > 200) draftErrors.push('개인 자료는 최대 200개까지 저장할 수 있습니다.');
  if (!draftErrors.length && new TextEncoder().encode(JSON.stringify(envelope(candidates))).length > MAX_BYTES) draftErrors.push('전체 개인 자료가 2 MB를 초과합니다. 입력을 줄여주세요. 마지막 정상 저장본은 유지됩니다.');
  if (draftErrors.length) { showValidation(); return false; }
  showValidation(); return true;
}
function commitDraft() {
  if (!validateDraft()) { $('#form-errors').focus(); return false; }
  const saved = clone(draft); saved.updatedAt = new Date().toISOString();
  const previous = records;
  records = editNew ? [...records, saved] : records.map(r => r.id === saved.id ? saved : r);
  if (!persist()) { records = previous; showValidation(false); return false; }
  return true;
}
function markPersonal(path) {
  if (path.startsWith('method.atlas.nodes')) { draft.method.atlas.fullTreeVerified = false; draft.method.atlas.nodes.forEach(n => { n.basis = 'personal'; }); }
  if (path.startsWith('method.masters.choices')) { draft.method.masters.fullSetupVerified = false; draft.method.masters.choices.forEach(c => c.nodes.forEach(n => { n.basis = 'personal'; })); }
}
document.addEventListener('input', event => {
  const el = event.target;
  if (el.matches('#editor [data-choice-search]')) {
    const group = el.closest('.check-list'), query = el.value.trim().toLocaleLowerCase('ko');
    const rows = [...group.querySelectorAll('[data-choice-row]')];
    rows.forEach(row => { row.hidden = !row.dataset.choiceRow.toLocaleLowerCase('ko').includes(query); });
    group.querySelector('.choice-empty').hidden = rows.some(row => !row.hidden); return;
  }
  if (!el.matches('#editor [data-path]')) return;
  const p = el.dataset.path, type = el.dataset.type;
  let value = el.value;
  if (type === 'number') value = el.validity.badInput ? NaN : value.trim() === '' ? null : Number(value);
  if (type === 'nullable') value = value.trim() || null;
  if (type === 'boolean') value = value === '' ? null : value === 'true';
  if (type === 'lines') value = value.split('\n').map(s => s.trim()).filter(Boolean);
  const optionPath = /\.options\.\d+\.(min|metric|unit)$/.test(p) ? p.replace(/\.[^.]+$/, '') : null;
  const oldOption = optionPath ? clone(pathGet(draft, optionPath)) : null;
  if (p.startsWith('method.waystone.properties.')) {
    const key = p.split('.')[3];
    draft.method.waystone.properties ??= {};
    draft.method.waystone.properties[key] ??= { min: null, max: null };
  }
  pathSet(draft, p, value);
  if (oldOption?.modifierId) {
    const option = pathGet(draft, optionPath);
    pathSet(draft, optionPath, makeModifier(option.modifierId, option.priority, option.min));
    el.closest('.edit-option').querySelector('.option-summary').textContent = pathGet(draft, optionPath).text;
  } else if (oldOption?.metric && oldOption.text === numericText(oldOption)) {
    const option = pathGet(draft, optionPath);
    if (option.metric) { option.text = numericText(option); const textInput = document.querySelector(`[data-path="${optionPath}.text"]`); if (textInput) textInput.value = option.text; }
  }
  if (type === 'term-node' && termsByName.has(value)) {
    pathSet(draft, p.replace(/name$/, 'poedbUrl'), editorData.atlas.find(n => n.name === value)?.url || termsByName.get(value).url);
    pathSet(draft, p.replace(/name$/, 'choice'), null);
  }
  markPersonal(p); validateDraft();
  if (['term-node', 'term-master', 'term-tablet'].includes(type)) { renderEditor(); document.querySelector(`#editor [data-path="${CSS.escape(p)}"]`)?.focus({ preventScroll: true }); }
});

function rerenderEditorAt(selector) { renderEditor(); document.querySelector(selector)?.focus({ preventScroll: true }); }

function openPreview(section = previewSection) {
  if (!validateDraft()) { $('#form-errors').focus(); return; }
  previewSection = section;
  const input = document.activeElement;
  previewReturn = { input, start: input.selectionStart, end: input.selectionEnd, x: scrollX, y: scrollY };
  $('#preview-dialog').innerHTML = '<div class="dialog-heading"><h2>세팅 미리보기</h2><button data-close autofocus>편집으로 돌아가기</button></div><label class="preview-toggle"><input type="checkbox" id="preview-full">전체 세팅 보기</label><div id="preview-body"></div>';
  renderPreview();
  $('#preview-dialog').showModal();
  $('#preview-dialog').scrollTop = 0;
}
function renderPreview() {
  const m = draft.method;
  $('#preview-body').innerHTML = detail(draft.method, draft.sources, true, true);
  if ($('#preview-full').checked) return;
  const body = $('#preview-body'), panels = [...body.querySelectorAll('[data-preview-panel]')];
  const populated = {
    setup: m.atlas.nodes.length || m.atlas.otherPriorities?.length || m.masters.choices.length,
    tablets: m.tablets.items.length || m.tablets.notes.length || m.tablets.usage === 'not_used',
    waystone: m.waystone.tier !== null || m.waystone.affixCount !== null || m.waystone.corrupted !== null || Object.values(m.waystone.properties || {}).some(v=>v.min !== null || v.max !== null) || m.waystone.options.length || m.waystone.notes.length || m.map.regions.length || m.map.biomes.length || m.map.conditions.length || m.map.optional.length,
    steps: m.supplies.length || m.steps.length || m.stopConditions.length || m.constraints.length,
    sources: draft.sources.length || m.unresolved.length,
    notes: m.notes.trim().length
  };
  const missing = [!m.goals.length && '목적', m.budget?.amount == null && '투자 비용', !m.patch && '패치', !populated.setup && '아틀라스·대가', m.tablets.usage === 'unknown' && '서판 사용', !populated.waystone && '경로석·지도'].filter(Boolean);
  body.replaceChildren();
  body.insertAdjacentHTML('beforeend', `<p class="notice">작성한 항목을 먼저 보여줍니다. ${missing.length ? `미확인: ${esc(missing.join(' · '))}. ` : ''}일부 입력이 있어도 세팅 완성을 뜻하지 않습니다. 전체 세팅 보기에서 빠진 조건과 출처·검증 범위를 확인하세요.</p>`);
  const first = panels.find(p=>p.dataset.previewPanel === previewSection);
  const ordered = [first, ...panels].filter((p,i,arr)=>p && arr.indexOf(p)===i && populated[p.dataset.previewPanel]);
  for (const panel of ordered) {
    if (panel.dataset.previewPanel === 'steps') panel.innerHTML = `<h3>진행 · 주의점</h3>${[['준비물',m.supplies],['진행 순서',m.steps],['중단 조건',m.stopConditions],['주의점',m.constraints.map(c=>c.text)]].filter(([,items])=>items.length).map(([label,items])=>`<h4>${label}</h4>${list(items)}`).join('')}`;
    if (panel.dataset.previewPanel === 'sources' && m.unresolved.length) {
      const heading = [...panel.querySelectorAll('h4')].find(h=>h.textContent === '미확인 사항');
      heading?.nextElementSibling?.remove(); heading?.remove();
      panel.insertAdjacentHTML('afterbegin', `<h3>재확인할 사항</h3>${list(m.unresolved)}`);
    }
    body.append(panel);
  }
  if (m.summary || m.goals.length || m.content.length || m.patch || m.budget?.amount != null) body.insertAdjacentHTML('beforeend', `<section class="panel"><h3>기본 정보</h3><p>${esc(m.name)}</p>${m.summary ? `<p>${rich(m.summary)}</p>` : ''}${list([...m.goals,...m.content,...(m.patch ? [`패치 ${m.patch}`] : []),...(m.budget?.amount != null ? [investmentText(m)] : [])], '추가 기본 정보 미확인')}</section>`);
  if (!body.querySelector('.panel')) body.insertAdjacentHTML('beforeend','<p>아직 작성한 세팅이나 메모가 없습니다.</p>');
}
$('#preview-dialog').addEventListener('close', () => {
  closeTerm();
  if (!previewReturn) return;
  const {input,start,end,x,y} = previewReturn;
  if (input?.isConnected) { input.focus({preventScroll:true}); if (typeof start === 'number') input.setSelectionRange(start,end); }
  window.scrollTo({left:x,top:y,behavior:'instant'});
});
function renderRun() {
  const entry = getEntry(selected); if (!entry) return;
  $('#content').innerHTML = renderPlay(entry, progressFor(progress, selected, entry.method), { esc, rich, list, evidence });
}
function observeSections() {
  sectionObserver?.disconnect();
  const links = [...document.querySelectorAll('[data-detail-section], [data-editor-section]')];
  const sections = links.map(a => document.getElementById(a.dataset.detailSection || a.dataset.editorSection)).filter(Boolean);
  const update = () => {
    const current = sections.filter(el => el.getBoundingClientRect().top <= 180).at(-1) || sections[0];
    links.forEach(a => { if ((a.dataset.detailSection || a.dataset.editorSection) === current?.id) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
  };
  sectionObserver = new IntersectionObserver(update, { rootMargin: '-80px 0px -50% 0px' });
  sections.forEach(el => sectionObserver.observe(el)); update();
}
function enhanceSelects() {
  document.querySelectorAll('#editor select[data-modifier-path], #editor select[data-add-modifier], #editor select[data-type="term-node"], #editor select[data-type="term-tablet"]').forEach((select, i) => {
    const key = select.dataset.modifierPath || select.dataset.addModifier || select.dataset.path;
    const label = select.getAttribute('aria-label') || select.closest('label')?.querySelector('span')?.textContent || '선택지';
    const input = document.createElement('input'); input.type = 'search'; input.className = 'select-search'; input.placeholder = '선택지 검색'; input.setAttribute('aria-label', `${label} 검색`);
    select.id ||= `searchable-select-${i}`; input.setAttribute('aria-controls', select.id);
    const hint = document.createElement('small'); hint.setAttribute('role','status');
    const filter = () => {
      const query = input.value.trim().toLocaleLowerCase('ko'); selectQueries.set(key, input.value);
      [...select.options].forEach(o => { o.hidden = !!o.value && !o.selected && !o.textContent.toLocaleLowerCase('ko').includes(query); });
      select.querySelectorAll('optgroup').forEach(g => { g.hidden = [...g.children].every(o => o.hidden); });
      hint.textContent = `${[...select.options].filter(o => o.value && !o.hidden && !o.disabled).length}개 선택지 · 기존 선택 유지`;
    };
    input.value = selectQueries.get(key) || ''; input.addEventListener('input', filter);
    input.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); select.focus(); } });
    // Keep the search input out of the select's wrapping label to avoid two labelled controls.
    const labelElement = select.closest('label'), group = document.createElement('div'); group.className = 'searchable-select';
    labelElement.before(group); group.append(input, labelElement, hint); filter();
  });
}
document.addEventListener('change', event => {
  const el = event.target;
  if (!el.closest('#editor')) return;
  if (el.dataset.addModifier || el.dataset.modifierPath) {
    if (!el.value) return;
    const path = el.dataset.addModifier || el.dataset.modifierPath;
    if (el.dataset.addModifier) { pathGet(draft, path).push(makeModifier(el.value)); if (path.startsWith('method.tablets.')) pathGet(draft, path.replace(/\.options$/, '')).optionRequirement = 'unknown'; }
    else pathSet(draft, path, makeModifier(el.value, pathGet(draft, path).priority));
    validateDraft(); rerenderEditorAt(`[${el.dataset.addModifier ? 'data-add-modifier' : 'data-modifier-path'}="${CSS.escape(path)}"]`);
  }
  if (el.dataset.checkPath) {
    const path = el.dataset.checkPath, values = pathGet(draft, path);
    pathSet(draft, path, el.checked ? [...new Set([...values, el.value])] : values.filter(v => v !== el.value)); validateDraft();
    el.closest('.check-list').querySelector('.selection-count').textContent = `${pathGet(draft, path).length}개 선택`;
  }
  if (el.dataset.masterPath) {
    const path = el.dataset.masterPath, c = pathGet(draft, path), ability = editorData.masters.find(a => a.id === el.value);
    if (el.checked) c.nodes.push({ name: ability.name, choice: null, basis: 'personal', poedbUrl: 'https://poe2db.tw/kr/Masters_of_the_Atlas' });
    else c.nodes = c.nodes.filter(n => n.name !== ability.name);
    markPersonal(path); validateDraft();
    const group = el.closest('.master-editor');
    group.querySelector('.master-selection-count').textContent = `${c.nodes.length} / 4개 선택`;
    group.querySelector('.master-selection-error').hidden = c.nodes.length <= 4;
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.dataset.listInput && !event.isComposing) {
    event.preventDefault(); event.target.parentElement.querySelector('button').click();
  }
});
document.addEventListener('paste', event => {
  if (!event.target.dataset.listInput) return;
  const text = event.clipboardData.getData('text');
  if (!/[\r\n]/.test(text)) return;
  event.preventDefault(); const path = event.target.dataset.listInput;
  pathGet(draft, path).push(...text.split(/\r?\n/).map(s => s.trim()).filter(Boolean));
  validateDraft(); rerenderEditorAt(`[data-list-input="${CSS.escape(path)}"]`);
});
document.addEventListener('submit', e => { if (e.target.id === 'editor') e.preventDefault(); });
document.addEventListener('toggle', event => {
  const panel = event.target;
  if (panel.matches('.detail-panel') && !panel.open && activeTerm && panel.contains(activeTerm)) closeTerm();
}, true);
document.addEventListener('click', event => {
  const unify = event.target.closest('[data-unify-waystone]');
  if (unify) {
    const path = unify.dataset.unifyWaystone, option = pathGet(draft, path), effect = waystoneEffectFor(option?.modifierId);
    if (effect) { pathSet(draft, path, makeModifier(effect.id, option.priority)); validateDraft(); rerenderEditorAt(`[data-modifier-path="${CSS.escape(path)}"]`); }
    return;
  }
  const move = event.target.closest('[data-move-list]');
  if (move) { const values = pathGet(draft, move.dataset.moveList), from = Number(move.dataset.index), to = from + Number(move.dataset.direction); if (to < 0 || to >= values.length) return; [values[from], values[to]] = [values[to], values[from]]; validateDraft(); rerenderEditorAt('[data-path="' + move.dataset.moveList + '.' + to + '"]'); return; }
  const noteCopy = event.target.closest('[data-note-to]');
  if (noteCopy) {
    const input = $('#field-method-notes'), start = input.selectionStart, end = input.selectionEnd, text = input.value.slice(start,end).trim();
    if (!text) { status('메모에서 복사할 문장을 먼저 선택하세요.'); input.focus({preventScroll:true}); return; }
    const target = noteCopy.dataset.noteTo, copied = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    draft.method[target].push(...copied); validateDraft(); rerenderEditorAt('#field-method-notes');
    $('#field-method-notes').setSelectionRange(start,end);
    previewSection = target === 'unresolved' ? 'sources' : 'steps';
    $('#note-copy-result').innerHTML = '<p>원문을 유지하고 '+copied.length+'개 항목을 복사했습니다.</p><button type="button" data-preview-section="'+previewSection+'">복사한 내용 확인</button>';
    status('원문을 유지하고 선택한 문장을 복사했습니다.'); return;
  }
  const previewButton = event.target.closest('[data-preview-section]');
  if (previewButton) { openPreview(previewButton.dataset.previewSection); return; }
  const step = event.target.closest('[data-play-step]');
  if (step) { const m=getEntry(selected).method, state=progressFor(progress,selected,m); state.step=Math.max(0,Math.min(m.steps.length-1,state.step+Number(step.dataset.playStep))); renderRun(); $('[data-play-step="'+step.dataset.playStep+'"]')?.focus({preventScroll:true}); return; }
  const sectionLink = event.target.closest('[data-editor-section], [data-detail-section]');
  if (sectionLink) {
    event.preventDefault();
    if (sectionLink.dataset.editorSection === 'preview') { openPreview(); return; }
    const section = document.getElementById(sectionLink.dataset.editorSection || sectionLink.dataset.detailSection);
    if (section?.matches('.detail-panel')) section.open = true;
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start', behavior: 'instant' });
    document.querySelectorAll('[data-editor-section], [data-detail-section]').forEach(a => {
      if (a === sectionLink) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    return;
  }
  const link = event.target.closest('a[data-page], a[data-select]');
  if (link && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return;
  const b = event.target.closest('button, a[data-page], a[data-select]'); if (!b) return;
  if (link) event.preventDefault();
  if (b.dataset.page) { navigatePage(b.dataset.page, b.dataset.targetScope); return; }
  if (b.dataset.select) { if (!guard()) return; sidebarOpen = false; selected = b.dataset.select; mode = 'detail'; routeError = ''; updateRoute(); render(); focusPageStart(); }
  if (b.dataset.scope) { scope = b.dataset.scope; document.querySelectorAll('[data-scope]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); refreshResults(); }
  if (b.hasAttribute('data-close')) b.closest('dialog').close();
  if (b.dataset.compare) {
    if (!guard()) return;
    const fromList = !!b.closest('#list'), fromTray = !!b.closest('#compare-tray');
    const toggledId = b.dataset.compare;
    try { compareIds = toggleComparison(compareIds, b.dataset.compare); } catch (error) { status(error.message); return; }
    if (mode === 'compare') { updateRoute(true); render(); }
    else { renderList(); document.querySelectorAll('#content [data-compare]').forEach(button => { const checked = compareIds.includes(button.dataset.compare); button.setAttribute('aria-pressed', String(checked)); button.textContent = checked ? '✓ 비교 선택됨' : '＋ 비교에 담기'; }); }
    if (fromList) document.querySelector(`#list [data-compare="${CSS.escape(toggledId)}"]`)?.focus({ preventScroll: true });
    else if (fromTray) ($('#compare-tray .compare-chips button') || $('#main')).focus({ preventScroll: true });
    else if (mode === 'compare') $('#main').focus({ preventScroll: true });
  }
  const a = b.dataset.action;
  if (a === 'toggle-sidebar') { sidebarOpen=!sidebarOpen; render(); (sidebarOpen ? $('#search') : $('#workspace-switch'))?.focus({preventScroll:true}); return; }
  if (a === 'toggle-filters') { const open=document.body.classList.toggle('filters-open'); b.setAttribute('aria-expanded',String(open)); b.textContent=open ? '검색·필터 접기' : '검색·필터 열기'; return; }
  if (a === 'play' || a === 'leave-play') { mode=a==='play' ? 'play' : 'detail'; sidebarOpen=false; updateRoute(); render(); $('#main').focus(); window.scrollTo({top:0,behavior:'instant'}); return; }
  if (a === 'reset-play') { nextRun(progressFor(progress,selected,getEntry(selected).method)); renderRun(); $('[data-action="reset-play"]').focus({preventScroll:true}); return; }
  if (a === 'delete') {
    const record = getRecord(); if (!record) return;
    if (storageBroken) { status('저장소 복원이 먼저 필요합니다. 상단 안내를 확인하세요.'); return; }
    pendingDelete = record.id; $('#delete-name').textContent = record.method.name;
    $('#delete-error').hidden = true; $('#delete-dialog').showModal();
  }
  if (b.id === 'confirm-delete') {
    if (!records.some(r => r.id === pendingDelete)) return;
    const previous = records; records = records.filter(r => r.id !== pendingDelete);
    if (!persist()) {
      records = previous; $('#delete-error').textContent = '삭제를 저장하지 못했습니다. 개인 기록은 유지됩니다. 상단 저장소 안내를 확인하세요.';
      $('#delete-error').hidden = false; return;
    }
    compareIds = compareIds.filter(id => id !== pendingDelete); pendingDelete = null;
    draft = null; draftErrors = []; selected = ''; mode = 'library'; scope = 'personal'; filters = {}; routeError = ''; $('#search').value = '';
    $('#delete-dialog').close(); updateRoute(true); render(); $('#main').focus(); status('개인 파밍법을 삭제했습니다.');
  }
  if (a === 'home') { navigatePage('home'); }
  if (a === 'reset-filters') { filters = {}; scope = 'all'; $('#search').value = ''; document.querySelectorAll('[data-scope]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.scope === 'all'))); renderFilters(); refreshResults(); }
  if (a === 'clear-compare') { if (!guard()) return; compareIds = []; if (mode === 'compare') updateRoute(true); render(); $('#main').focus({ preventScroll: true }); }
  if (a === 'compare' || a === 'compare-origin') {
    if (!guard()) return;
    if (a === 'compare-origin') { const r = getRecord(); compareIds = [baseKey(r.originId), r.id]; }
    if (compareIds.length < 2) return;
    mode = 'compare'; routeError = ''; updateRoute(); render(); focusPageStart();
  }
  if (a === 'share') shareCurrent();
  if (a === 'copy') {
    if (storageBroken) { status('저장소 복원이 먼저 필요합니다. 상단 안내를 확인하세요.'); return; }
    const r = copyMethod(seed, seed.strategies.find(m => m.id === getEntry(selected).method.id));
    beginEdit(r, true); status('개인 복사본을 편집합니다. 저장하면 내 데이터에 추가됩니다.');
  }
  if (a === 'edit') beginEdit(getRecord());
  if (a === 'cancel-edit') { endEdit(true); status('편집을 취소했습니다.'); }
  // LOCAL_ADMIN_START
  if (a === 'finish' && libraryAdmin?.active) { libraryAdmin.save(); return; }
  // LOCAL_ADMIN_END
  if (a === 'finish') { if (!commitDraft()) return; endEdit(); status('세팅을 저장했습니다.'); }
  if (a === 'preview') openPreview();
  if (b.dataset.op) {
    const op = b.dataset.op, path = b.dataset.path;
    if (op === 'remove') { const parts = path.split('.'); const i = Number(parts.pop()); pathGet(draft, parts.join('.')).splice(i, 1); }
    else {
      const target = pathGet(draft, path);
      if (op === 'add-list') {
        const input = document.querySelector(`[data-list-input="${CSS.escape(path)}"]`);
        const value = input.value.trim(); if (!value) { input.focus(); return; }
        target.push(value);
      }
      if (op === 'add-tablet') { target.push({ name: '방사능 노출 서판', count: null, remainingUses: null, status: 'unknown', options: [] }); draft.method.tablets.usage = 'use'; }
      if (op === 'add-node') {
        const node = selectableAtlas.find(n => !target.some(t => t.name === n.name));
        if (!node) { status('선택 가능한 노드를 모두 추가했습니다.'); return; }
        target.push({ name: node.name, choice: null, basis: 'personal', poedbUrl: node.url });
      }
      if (op === 'add-master') target.push({ name: '자도', role: '', nodes: [] });
      if (op === 'add-constraint') target.push({ text: '새 주의점', evidence: null });
    }
    if (op === 'remove' && /^method\.tablets\.items\.\d+$/.test(path)) draft.method.tablets.usage = draft.method.tablets.items.length ? 'use' : 'not_used';
    markPersonal(path); const valid = validateDraft(); renderEditor(); showValidation(valid && !$('#storage-warning').hidden ? false : undefined);
    const addedPath = op.startsWith('add-') ? `${path}.${pathGet(draft, path).length - 1}.` : path;
    const next = document.querySelector(`#editor input[data-path^="${CSS.escape(addedPath)}"], #editor select[data-path^="${CSS.escape(addedPath)}"]`) || document.querySelector(`#editor button[data-path="${CSS.escape(path)}"]`);
    next?.focus({ preventScroll: true });
    if (op === 'add-list') document.querySelector(`[data-list-input="${CSS.escape(path)}"]`)?.focus({ preventScroll: true });
  }
});
function refreshResults() {
  renderList();
  if (mode === 'library') { closeTerm(); renderLibrary(); updateRoute(true); }
}
$('#search').addEventListener('input', refreshResults);
document.addEventListener('change', e => {
  if (e.target.id === 'preview-full') { renderPreview(); return; }
  if (e.target.hasAttribute('data-repeat') || e.target.id === 'run-start-step') {
    const state=progressFor(progress,selected,getEntry(selected).method), target=e.target, y=scrollY;
    if (target.id === 'run-start-step') state.startStep=Number(target.value);
    else { const i=Number(target.dataset.repeat); state.repeat=target.checked ? [...new Set([...state.repeat,i])] : state.repeat.filter(v=>v!==i); }
    renderRun();
    const control=target.id ? $('#run-start-step') : $('[data-repeat="'+target.dataset.repeat+'"]');
    control?.focus({preventScroll:true}); window.scrollTo({top:y,behavior:'instant'}); return;
  }
  if (e.target.dataset.filter) { filters[e.target.dataset.filter] = e.target.value; refreshResults(); }
  if (e.target.id === 'comparison-details') { comparisonDetails=e.target.checked; renderComparison(); $('#comparison-details').focus(); }
  if (e.target.hasAttribute('data-prepared')) { const state=progressFor(progress,selected,getEntry(selected).method), i=Number(e.target.dataset.prepared); state.checked=e.target.checked ? [...new Set([...state.checked,i])] : state.checked.filter(v=>v!==i); $('#preparation-count').textContent=state.checked.length+' / '+preparationItems(getEntry(selected).method).length; }
  if (e.target.id === 'differences-only') { differencesOnly = e.target.checked; closeTerm(); renderComparison(); $('#differences-only').focus(); }
});
$('#new').onclick = () => {
  if (!guard()) return;
  if (storageBroken) { status('저장소 복원이 먼저 필요합니다.'); return; }
  beginEdit(blankRecord(), true);
};
$('#export').onclick = () => {
  download(JSON.stringify(envelope(records), null, 2), `poe2-${new Date().toISOString().slice(0, 10)}.personal.json`);
  status(mode === 'edit' ? '저장된 자료를 내보냈습니다. 편집 중인 변경은 저장 후 내보내세요.' : `개인 자료 ${records.length}개를 내보냈습니다.`);
};
$('#import').onclick = () => { if (!guard()) return; pendingImport = null; $('#backup-file').value = ''; $('#import-result').textContent = ''; $('#confirm-import').disabled = true; $('#import-dialog').showModal(); };
let importGeneration = 0;
$('#backup-file').onchange = async event => {
  const generation = ++importGeneration;
  pendingImport = null; $('#confirm-import').disabled = true;
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > MAX_BYTES) throw Error('파일은 2 MB 이하여야 합니다.');
    const raw = await file.text(); if (generation !== importGeneration) return;
    const parsed = parseBackup(raw, terms);
    const merged = mergeRecords(records, parsed.data.records);
    const errors = validateData(envelope(merged.records), terms); if (errors.length) throw Error(errors.join('\n'));
    if (new TextEncoder().encode(JSON.stringify(envelope(merged.records))).length > MAX_BYTES) throw Error('병합 후 자료가 2 MB를 초과합니다.');
    pendingImport = merged;
    $('#import-result').textContent = `검증 완료 · 추가 ${merged.added}개 / 동일 자료 ${merged.duplicates}개 건너뜀 / 충돌 ${merged.conflicts}개는 별도 복원\n${parsed.note}\n${parsed.data.records.map(r => `• ${r.method.name}`).join('\n')}${storageBroken ? '\n손상된 브라우저 저장본을 이 정상 자료로 교체합니다. 기존 저장 원문을 먼저 백업하세요.' : ''}`;
    $('#confirm-import').disabled = false;
  } catch (error) { $('#import-result').textContent = `복원할 수 없습니다.\n${error.message}`; }
};
$('#confirm-import').onclick = () => {
  if (!pendingImport) return;
  const old = records; records = pendingImport.records;
  if (!persist(storageBroken)) { records = old; $('#import-result').textContent += '\n저장 실패. 기존 자료를 유지했습니다.'; return; }
  selected = records.at(-1)?.id || 'base'; mode = 'detail'; routeError = ''; updateRoute(); $('#import-dialog').close(); render(); status('백업 복원을 완료했습니다.'); pendingImport = null;
};
window.addEventListener('storage', e => { if (e.key === 'poe2-farming.personal.v1' || e.key === null) warning('다른 탭에서 개인 자료가 변경되었습니다. 덮어쓰기를 막았습니다. 현재 자료를 내보낸 뒤 새로고침하세요.'); });
window.addEventListener('beforeunload', e => { if (editChanged() || !$('#storage-warning').hidden) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('popstate', e => {
  // In-page anchors keep the current personal/comparison view.
  if (!e.state && location.pathname + location.search === routeLocation) return;
  if (!guard()) { updateRoute(true); return; }
  restoringPosition = true;
  sidebarOpen = false; readRoute(e.state); routeLocation = location.pathname + location.search; render();
  $('#main').focus({preventScroll:true});
  window.scrollTo({top:e.state?.scrollY || 0,behavior:'instant'});
  if ($('.comparison-scroll')) $('.comparison-scroll').scrollTop=e.state?.comparisonScroll || 0;
  requestAnimationFrame(()=>{restoringPosition=false;});
});

// A single, hoverable explanation card supports mouse, keyboard and touch.
let activeTerm, card, hideTimer, pointerType = 'mouse';
function closeTerm(returnFocus = false) {
  clearTimeout(hideTimer);
  const previous = activeTerm; activeTerm?.removeAttribute('aria-describedby'); activeTerm?.setAttribute('aria-expanded', 'false');
  card?.remove(); card = null; activeTerm = null;
  if (returnFocus && previous?.isConnected) { previous.focus(); closeTerm(); }
}
function positionTerm() {
  if (!card || !activeTerm || card.classList.contains('term-card-inline')) return;
  const rect = activeTerm.getBoundingClientRect(), height = card.getBoundingClientRect().height;
  card.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - card.offsetWidth - 12))}px`;
  card.style.top = `${Math.max(12, Math.min(rect.bottom + 7, innerHeight - height - 12))}px`;
}
function showTerm(anchor) {
  clearTimeout(hideTimer); if (activeTerm === anchor) return;
  closeTerm(); activeTerm = anchor;
  const t = [...terms, ...contextualTerms.values()].find(t => t.id === anchor.dataset.term), chosen = anchor.dataset.choice;
  card = document.createElement('div'); card.className = 'term-card'; card.id = 'term-explanation'; card.role = 'dialog'; card.setAttribute('aria-label', `${t.nameKo} 설명`);
  const checked = t.verification || verification;
  card.innerHTML = `<button class="close-term" aria-label="용어 설명 닫기">✕</button><small>${esc(t.kind)}</small><h3>${esc(t.nameKo)}</h3><p>${esc(t.description)}</p>${t.choices.length ? `<ul>${t.choices.map(c => `<li class="${chosen === c ? 'chosen' : ''}">${esc(c)}${chosen === c ? ' · 이 세팅의 선택' : ''}</li>`).join('')}</ul>` : ''}${chosen && !t.choices.includes(chosen) ? `<p class="selection">이 세팅의 선택: ${esc(chosen)}</p>` : ''}<small>${checked.status === 'research_name_checked' ? '기존 조사 명칭 확인' : '명칭 확인'} ${esc(checked.checkedAt)} · 페이지 패치 미표기<br>영상 세팅의 현재 유효성은 미검증</small>${ext(t.url, 'PoEDB 한국어에서 확인')}`;
  const inline = pointerType === 'touch' || matchMedia('(max-width: 700px)').matches;
  if (inline) {
    card.classList.add('term-card-inline');
    const ability = anchor.closest('.master-map-card');
    if (ability) ability.append(card);
    else (anchor.closest('p, li, .node-row, .tablet-heading, .master-choice-heading h5') || anchor).after(card);
  } else ($('#preview-dialog').open ? $('#preview-dialog') : document.body).append(card);
  anchor.setAttribute('aria-describedby', card.id); anchor.setAttribute('aria-expanded', 'true');
  positionTerm();
  card.querySelector('button').onclick = () => closeTerm(true);
  card.onpointerenter = () => clearTimeout(hideTimer);
  card.onpointerleave = () => { hideTimer = setTimeout(() => closeTerm(), 220); };
}
document.addEventListener('pointerdown', e => { pointerType = e.pointerType; if (!e.target.closest('.term-link,.term-card')) closeTerm(); });
document.addEventListener('pointerover', e => { const a = e.target.closest('.term-link'); if (a && e.pointerType !== 'touch') showTerm(a); });
document.addEventListener('pointerout', e => { if (e.target.closest('.term-link')) hideTimer = setTimeout(() => closeTerm(), 220); });
document.addEventListener('focusin', e => { const a = e.target.closest('.term-link'); if (a) showTerm(a); else if (!e.target.closest('.term-card')) closeTerm(); });
document.addEventListener('click', e => { const a = e.target.closest('.term-link'); if (a && (pointerType === 'touch' || matchMedia('(hover: none)').matches) && e.detail !== 0) { e.preventDefault(); showTerm(a); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Tab' && sidebarOpen) {
    const focusable = [...$('.sidebar').querySelectorAll('button,input,select,a,summary')].filter(el => !el.disabled && el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  if (e.key === 'Escape' && sidebarOpen) { sidebarOpen=false; render(); $('#workspace-switch')?.focus(); }
  if (e.key === 'Escape' && card) { e.preventDefault(); closeTerm(true); }
  if (e.key === 'ArrowDown' && e.target.closest('.term-link')) { e.preventDefault(); showTerm(e.target.closest('.term-link')); card.querySelector('button').focus(); }
});
window.addEventListener('resize', () => closeTerm());
window.addEventListener('scroll', () => {
  rememberPosition();
  if (card?.classList.contains('term-card-inline')) return;
  if (activeTerm === document.activeElement || card?.contains(document.activeElement)) positionTerm();
  else closeTerm();
}, { passive: true });

async function start() {
  try {
    const responses = await Promise.all([fetch('./data/library.ko.json'), fetch('./data/glossary.ko.json')]);
    if (responses.some(r => !r.ok)) throw Error('기본 자료를 가져오지 못했습니다.');
    const [data, glossary] = await Promise.all(responses.map(r => r.json()));
    seed = data; terms = glossary.terms; verification = glossary.verification;
    // LOCAL_ADMIN_START
    libraryRevision = responses[0].headers.get('X-Library-Revision');
    // LOCAL_ADMIN_END
    termsByName = new Map(terms.map(t => [t.nameKo, t]));
    const ambiguous = new Set(editorData.atlas.filter(a => editorData.masters.some(m => m.name === a.name)).map(a => a.name));
    for (const context of ['atlas', 'master']) for (const n of (context === 'atlas' ? editorData.atlas : editorData.masters)) {
      if (!ambiguous.has(n.name)) continue;
      contextualTerms.set(context + ':' + n.name, { id: context + '-' + n.id, nameKo: n.name, kind: context === 'atlas' ? '아틀라스 패시브' : '대가 패시브', url: n.url || 'https://poe2db.tw/kr/Masters_of_the_Atlas', description: n.description, choices: n.choices || [], verification: { checkedAt: editorData.checkedAt, patch: null } });
    }
    termPattern = new RegExp(terms.filter(t => t.kind !== '지도 지역' && !ambiguous.has(t.nameKo)).map(t => t.nameKo).sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    const samples = seed.strategies.map(m => copyMethod(seed, m));
    const errors = validateData(envelope(samples), terms); if (errors.length) throw Error(errors.join('\n'));
    bases = samples.map(r => ({ id: baseKey(r.method.id), method: r.method, sources: r.sources, personal: false }));
    try { store = createStore(window.localStorage, terms); records = store.read().records; }
    catch (error) { storageBroken = true; warning(`개인 자료를 읽지 못했습니다. 기존 자료는 초기화하지 않았습니다. ${error.message}`); }
    readRoute(history.state); routeLocation = location.pathname + location.search; render();
    // Home and private views share a pathname; keep the initial entry distinguishable from section anchors.
    if (!routeError && !history.state) history.replaceState({ selected, compareIds, mode, filters, scope, query: $('#search').value }, '', location.href);
  } catch (error) {
    $('#content').innerHTML = `<h2>자료를 불러오지 못했습니다.</h2><p>${esc(error.message)}</p><p>로컬에서는 node scripts/serve.mjs로 실행한 뒤 HTTP 주소로 접속하세요.</p><button onclick="location.reload()">다시 시도</button>`;
    ['export', 'import', 'new', 'search'].forEach(id => { $(`#${id}`).disabled = true; });
  }
}
installTradeDialog({ getMethod: () => getEntry(selected)?.method, esc, status });
await start();
// LOCAL_ADMIN_START
if (document.querySelector('meta[name="local-library-admin"]') && seed) {
  try {
    const { installLocalAdmin } = await import('./local-admin.js');
    libraryAdmin = await installLocalAdmin({
      entry: () => getEntry(selected),
      begin: () => beginEdit(copyMethod(seed, getEntry(selected).method), false, selected),
      draft: () => draft, revision: () => libraryRevision, validate: validateDraft,
      accept: result => {
        seed = result.library; libraryRevision = result.revision;
        bases = seed.strategies.map(m => { const r = copyMethod(seed, m); return { id: baseKey(m.id), method: r.method, sources: r.sources, personal: false }; });
      },
      finish: () => endEdit(), status
    });
    render();
  } catch (error) { status(error.message); }
}
// LOCAL_ADMIN_END
