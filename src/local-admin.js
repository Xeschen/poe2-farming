// Loaded only by the explicitly enabled local server; excluded from dist/.
export async function installLocalAdmin(api) {
  const response = await fetch('/__admin/session');
  if (!response.ok) throw Error('관리 세션을 열지 못했습니다.');
  const { token } = await response.json();
  let active = false, busy = false;
  const badge = document.createElement('span');
  badge.className = 'badge'; badge.textContent = '로컬 관리 모드';
  document.querySelector('.topbar').append(badge);
  const admin = {
    get active() { return active; },
    get busy() { return busy; },
    end() { active = false; },
    decorateDetail() {
      if (api.entry()?.personal) return;
      const button = document.createElement('button');
      button.className = 'primary'; button.textContent = '원본 편집';
      button.dataset.adminEdit = '';
      button.onclick = () => { active = true; api.begin(); };
      document.querySelector('.detail-hero .hero-actions')?.prepend(button);
    },
    decorateEditor() {
      if (!active) return;
      document.querySelector('.editor-heading h2').textContent = '기본 자료 원본 편집';
      document.querySelector('.editor-heading [data-action="delete"]')?.remove();
      const breadcrumb = document.querySelector('.breadcrumb ol');
      breadcrumb?.children[2]?.remove();
      document.querySelector('.breadcrumb [aria-current]')?.replaceChildren('원본 편집');
      document.querySelector('.editor-rules p').textContent = '저장하면 이 프로젝트의 기본 라이브러리를 수정합니다. 공개 사이트에는 빌드·배포 후 반영됩니다. 취소하면 이번 변경을 버립니다. 기존 출처와 미확인 상태는 유지됩니다.';
      document.querySelector('.editor-heading [data-action="finish"]').textContent = '원본 저장';
    },
    async save() {
      if (busy || !api.validate()) return;
      busy = true;
      const content = document.querySelector('#content'); content.inert = true;
      const label = document.querySelector('#save-status'); label.textContent = '원본 저장 중…';
      try {
        const response = await fetch('/__admin/library', {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
          body: JSON.stringify({ revision: api.revision(), method: api.draft().method })
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || '저장하지 못했습니다.');
        api.accept(result); active = false; api.finish();
        api.status('기본 자료 원본을 저장했습니다. 공개 사이트에는 빌드·배포 후 반영됩니다.');
      } catch (error) {
        label.textContent = '저장 실패 · 편집 내용 유지';
        const box = document.querySelector('#form-errors');
        box.hidden = false; box.textContent = error.message;
        content.inert = false; box.focus();
      } finally { busy = false; content.inert = false; }
    }
  };
  document.addEventListener('click', event => { if (busy) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  return admin;
}
