import { comparisonRows, reviewLabel } from './catalog.js';
import { optionRequirementText } from './usability.js';

export function renderComparisonContent(chosen, detailed, differencesOnly, { esc, rich, ext, evidence }) {
  const summaryRows = new Set(['goals', 'investment', 'patch', 'tablets', 'options', 'conditions', 'supplies', 'stop', 'unresolved']);
  const rows = comparisonRows(chosen);
  const visible = rows.filter(r => (!differencesOnly || r.different) && (detailed || summaryRows.has(r.id)));
  const paragraphs = values => values.map(v => `<p>${rich(v)}</p>`).join('');
  const briefOption = t => {
    if (!t.options.length) return optionRequirementText(t);
    const o = t.options.find(o=>o.priority==='required') || t.options[0];
    return `${o.text.length > 64 ? o.text.slice(0,64)+'…' : o.text}${t.options.length > 1 ? ` · 외 ${t.options.length-1}개` : ''}`;
  };
  const cell = (row, index) => {
    const values = row.values[index], m = chosen[index].method;
    if (detailed) return paragraphs(values);
    if (row.id === 'tablets') return paragraphs(values.slice(0, 1)) + (m.tablets.notes.length ? `<details><summary>대안·준비 주의 ${m.tablets.notes.length}건</summary>${paragraphs(m.tablets.notes)}</details>` : '');
    if (row.id === 'options') return m.tablets.usage === 'not_used' ? '<p>사용하지 않음</p>' : m.tablets.items.length ? m.tablets.items.map((t,i) => `<p>구성 ${i+1} · ${rich(briefOption(t))}</p>`).join('') + (m.tablets.items.some(t=>t.options.length) ? `<details><summary>전체 옵션·우선순위 확인</summary>${paragraphs(values)}</details>` : '') : '<p>속성 미확인</p>';
    if (['conditions','supplies','stop','unresolved'].includes(row.id)) {
      const count = row.id === 'conditions' ? m.map.conditions.length : row.id === 'supplies' ? m.supplies.length : row.id === 'stop' ? m.stopConditions.length + m.constraints.length : m.unresolved.length;
      return count ? `<details><summary>${row.label} ${count}건${row.id === 'stop' && !m.stopConditions.length ? ' · 중단 조건 미확인' : ''}</summary>${paragraphs(values)}</details>` : paragraphs(values);
    }
    return paragraphs(values);
  };
  const sources = e => `<p>${reviewLabel(e)}</p><details${detailed ? ' open' : ''}><summary>출처·검증 범위 확인</summary>${e.sources.map(s=>`<p>${ext(s.url,`${s.creator} · ${s.titleKo}`)}</p>`).join('') || '<p>출처 미확인</p>'}${evidence(e.method.executionEvidence)}<p>현재 유효성·전체 경로·시간당 순이익 미검증</p></details>`;
  const name = e => `<span class="badge">${e.personal ? '내 데이터' : '기본 자료'}</span><h3>${esc(e.method.name)}</h3><button data-select="${esc(e.id)}">상세 보기</button><button data-compare="${esc(e.id)}" aria-label="${esc(e.method.name)} 비교 해제">해제</button>`;
  return `<div class="compare-controls"><label><input id="differences-only" type="checkbox" ${differencesOnly ? 'checked' : ''}>차이만 보기</label><label><input id="comparison-details" type="checkbox" ${detailed ? 'checked' : ''}>상세 조건 보기</label><span>${rows.filter(r=>r.different).length}개 항목에 차이</span></div>
    <details class="notice"><summary>비용·검증 안내 · 현재 수익 미검증</summary><p>투자 비용은 사용자가 기록한 예상 금액입니다. 기존 영상의 투자 분류는 금액으로 환산하지 않습니다. 수익 사례는 현재 시세나 검증된 시간당 순이익이 아닙니다.</p></details>
    <p class="footer-note">요약의 접힌 항목을 열면 대안과 주의점을 확인할 수 있습니다. 작은 화면에서는 같은 항목의 파밍법을 위아래로 비교합니다.</p>
    <div class="comparison-scroll" role="region" aria-label="파밍법 비교표" tabindex="0"><table class="comparison-table"><caption class="sr-only">${chosen.map(e=>esc(e.method.name)).join(', ')} 준비 조건과 차이</caption><thead><tr><th scope="col">비교 항목</th>${chosen.map(e=>`<th scope="col">${name(e)}</th>`).join('')}</tr></thead><tbody>${visible.map(r=>`<tr data-row="${r.id}" class="${r.different ? 'different' : ''}"><th scope="row">${r.label}${r.different ? '<span class="difference-mark">차이</span>' : ''}</th>${chosen.map((e,i)=>`<td><strong class="mobile-comparison-name">${esc(e.method.name)}</strong>${cell(r,i)}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">출처 · 확인 상태</th>${chosen.map(e=>`<td><strong class="mobile-comparison-name">${esc(e.method.name)}</strong>${sources(e)}</td>`).join('')}</tr></tbody></table></div>`;
}
