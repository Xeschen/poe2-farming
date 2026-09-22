import { tradePlan, tradeQuery, tradeUrl } from './trade.js';
import { priorities } from './model.js';
import { tradeData } from './trade-data.js';
import { waystoneProperties } from './waystones.js';

export function installTradeDialog({ getMethod, esc, status }) {
  const dialog = document.querySelector('#trade-dialog');
  let plan, revision = 0, league = tradeData.defaultLeague;
  const refresh = async () => {
    const current = ++revision, link = dialog.querySelector('#trade-open'), copy = dialog.querySelector('#trade-copy'), output = dialog.querySelector('#trade-url');
    if (!plan || !link) return;
    link.hidden = true; link.removeAttribute('href'); copy.disabled = true; output.value = '';
    dialog.querySelector('#trade-applied').textContent = '';
    const error = dialog.querySelector('#trade-error'); error.hidden = true;
    const select = dialog.querySelector('#trade-league');
    dialog.querySelector('#trade-custom-field').hidden = select.value !== 'custom';
    league = select.value === 'custom' ? dialog.querySelector('#trade-custom').value.trim() : select.value;
    try {
      if (plan.kind === 'waystone') for (const input of dialog.querySelectorAll('[data-trade-property]')) {
        const key = input.dataset.tradeProperty; plan.properties[key] ??= { min: null, max: null };
        plan.properties[key][input.dataset.bound] = input.validity.badInput ? NaN : input.value === '' ? null : Number(input.value);
      }
      const keys = [...dialog.querySelectorAll('[data-trade-condition]:checked')].map(el => el.value);
      const url = await tradeUrl(tradeQuery(plan, keys), league);
      if (current !== revision || !dialog.open) return;
      link.href = url; link.hidden = false; copy.disabled = false; output.value = url;
      dialog.querySelector('#trade-applied').textContent = `속성 조건 ${keys.length}개 반영 · ${plan.title}`;
    } catch (e) { if (current === revision) { error.textContent = e.message; error.hidden = false; } }
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-trade]');
    if (!button) return;
    revision++; plan = null;
    try { plan = tradePlan(getMethod(), button.dataset.trade, Number(button.dataset.index || 0)); }
    catch (e) { status(e.message); return; }
    const presets = [[tradeData.defaultLeague, '금단의 의식 · 0.5.5 (Forbidden Rites)'], ['Standard', '스탠다드'], ['Hardcore', '하드코어'], ['custom', '다른 리그 직접 입력']];
    const known = presets.some(([id]) => id === league && id !== 'custom');
    const ranges = plan.kind === 'waystone' ? `<fieldset class="trade-property-ranges"><legend>경로석 수치 조건</legend><p class="form-help">최소·최대 · 빈칸은 제한 없음. 여기서 변경한 값은 이번 검색에만 적용됩니다.</p>${waystoneProperties.map(p => `<div class="property-range"><strong>${p.label} <small>(${p.unit})</small></strong>${['min', 'max'].map(bound => `<label class="field"><span>${bound === 'min' ? '최소' : '최대'}</span><input type="number" min="0" max="100000" step="${p.key === 'revives' ? '1' : 'any'}" data-trade-property="${p.key}" data-bound="${bound}" aria-label="${p.label} ${bound === 'min' ? '최소' : '최대'}" placeholder="제한 없음" value="${esc(plan.properties[p.key]?.[bound] ?? '')}"></label>`).join('')}</div>`).join('')}</fieldset>` : '';
    dialog.querySelector('#trade-body').innerHTML = `<p><strong>${esc(plan.title)}</strong> 세팅으로 검색합니다.</p><p class="badge">거래 방식: 즉시 구입</p><label class="field"><span>검색 리그</span><select id="trade-league">${presets.map(([id, label]) => `<option value="${id}" ${id === (known ? league : 'custom') ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="field" id="trade-custom-field" ${known ? 'hidden' : ''}><span>거래소 리그 이름</span><input id="trade-custom" maxlength="100" value="${known ? '' : esc(league)}" placeholder="거래소의 영문 리그 이름"></label><p class="form-help">필수·권장·회피 조건을 기본으로 반영합니다. 나머지 조건은 직접 선택하세요. 회피는 해당 효과가 없는 아이템을 찾습니다.</p>${plan.kind === 'waystone' ? `<p>등급 ${plan.tier ?? '미지정'} · 속성 수 ${plan.affixCount ?? '미지정'} · ${plan.corrupted === null ? '타락 미지정' : plan.corrupted ? '타락' : '비타락'}</p>` : ''}${ranges}<div class="trade-conditions">${plan.conditions.map(c => `<label><input type="checkbox" data-trade-condition value="${c.key}" ${c.checked ? 'checked' : ''} ${!c.mapping ? 'disabled' : ''}><span><b>${priorities[c.priority]}</b> · ${esc(c.text)}${!c.mapping ? '<small class="trade-missing">거래소 속성 연결 미확인 — 검색에서 제외</small>' : ''}</span></label>`).join('') || '<p>저장한 속성 조건이 없습니다. 아이템 종류로 검색합니다.</p>'}</div><ul class="form-help">${plan.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul><p class="form-help">연결 데이터 확인: ${tradeData.checkedAt}. 거래소 실검색은 미검증입니다. 열린 거래소에서 조건을 확인하세요.</p><p id="trade-applied" role="status"></p><p id="trade-error" class="notice error" role="alert" hidden></p><label class="field"><span>생성한 검색 주소</span><textarea id="trade-url" readonly></textarea></label><div class="dialog-actions"><button id="trade-copy" disabled>주소 복사</button><a id="trade-open" class="button-link primary" target="_blank" rel="noopener noreferrer" hidden>카카오 거래소 열기 ↗</a></div>`;
    dialog.showModal(); refresh();
  });
  dialog.addEventListener('change', refresh);
  dialog.addEventListener('input', event => { if (event.target.id === 'trade-custom' || event.target.dataset.tradeProperty) refresh(); });
  dialog.addEventListener('close', () => { revision++; });
  const outside = event => {
    const r = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom);
  };
  let backdropDown = false;
  dialog.addEventListener('pointerdown', event => { backdropDown = outside(event); });
  dialog.addEventListener('pointercancel', () => { backdropDown = false; });
  dialog.addEventListener('click', async event => {
    if (backdropDown && outside(event)) { backdropDown = false; dialog.close(); return; }
    backdropDown = false;
    if (event.target.id !== 'trade-copy') return;
    const output = dialog.querySelector('#trade-url');
    try { await navigator.clipboard.writeText(output.value); status('거래소 검색 주소를 복사했습니다.'); }
    catch { output.focus(); output.select(); status('선택한 주소를 복사하세요.'); }
  });
}
