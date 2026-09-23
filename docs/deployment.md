# GitHub Pages 배포

저장소는 `Xeschen/poe2-farming`, 공개 주소는 https://xeschen.github.io/poe2-farming/ 이다. 2026-09-22 첫 게시 이후에도 아래의 검증·수동 배포 절차로 업데이트한다.

## 공개할 구성

공개 사이트는 HTML·CSS·JavaScript와 데이터·로컬 이미지를 제공한다. `npm run build`는 이전 `dist/`를 비운 뒤 `scripts/release-files.mjs`의 허용 목록만 생성한다. 2026-09-23 기준 이미지 185개를 포함한 209개 파일, 약 2.09 MiB다.

로컬 관리 API·관리 모듈·관리 초기화 코드는 배포에서 제외한다. 운영자가 수정한 `data/library-overrides.ko.json`은 기본 라이브러리에 병합하고, 수정 원본 파일 자체는 게시하지 않는다. 개인 기록은 방문자의 브라우저에 저장한다. 서버·DB·사용자 로그인·자료 제출 API는 이번 배포에 포함하지 않는다.

공개 저장소에서는 `dist/`에 들어가지 않는 소스·문서도 열람할 수 있다. 개인 백업, 토큰, 환경 파일, 테스트 결과를 Git에 포함하지 않는다. `check:release`는 공개 파일 목록, 관리 코드 잔류, 데이터 유효성, 상대 경로 모듈, Git 업로드 후보의 제외 경로와 대표적인 자격 증명 형식을 검사한다. 모든 비밀 정보 형식을 탐지하는 검사는 아니므로 업로드할 변경 내용도 검토한다.

## 데이터 상태

현재 라이브러리는 파밍법 11개, 영상 출처 10개다. 데이터 구조 검증을 통과했고 자막 재검토 기록과 미확인 항목을 보존한다. 이번 배포 준비에서 영상을 다시 검토하거나 직접 플레이 검증을 하지는 않았다.

- 대탐험 상자 파밍, 대탐험 룬 중첩 파밍은 출처 패치가 미확인이다.
- 전체 아틀라스 경로는 11개 모두 검증되지 않았다.
- 2026-09-23 원본 영상의 활성 아이콘과 제작자 가이드를 재검토해, 대가가 지정된 모든 구성에 능력 4개를 반영했다. 혈통 보조의 대가는 ronarray 0.5 대안임을 구분한다. 서판 수집은 기본 구성 하나와 상황별 교체 안내로 정리했다. 근거와 범위는 `docs/master-review-2026-09-23.md`에 기록한다.
- 아즈메리 혼백 금고 파밍은 도리아니·힐다 각각 4개 능력이 반영돼 있다.
- 현재 패치에서의 유효성과 시간당 순이익을 검증한 데이터로 소개하지 않는다. 상세 한계는 `docs/caption-review-2026-09-22.md`와 각 항목의 미확인 사항에 남아 있다.

초안 자료를 포함한 첫 공개가 가능한 기술 상태이며, 전체 게임 정보의 검증 완료를 뜻하지 않는다.

## 공개 전 검증

Node.js 22 이상에서 실행한다. 브라우저 검증에만 개발 의존성을 사용하며 공개 사이트에는 패키지를 설치하지 않는다.

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm test
npm run build
npm run check:release
npm run test:browser
```

Linux CI는 `npx playwright install --with-deps chromium`으로 브라우저 실행에 필요한 시스템 패키지도 설치한다. 절차는 [Playwright 공식 CI 안내](https://playwright.dev/docs/ci-intro)를 따른다.

`test:browser`는 별도 임시 포트에 공개용 `dist/` 서버를 띄운다. 실제 Pages와 같은 `/poe2-farming/` 경로로 조회·편집·저장/취소·공유·비교·이전 백업 변환·백업/복원·모바일·관리 기능 제외를 확인한다. 로컬 관리 테스트는 별도 임시 프로젝트를 사용한다. 기존 4173 서버와 실제 개인 데이터는 사용하지 않는다. 설치된 Edge 등으로 확인하려면 `BROWSER_PATH`, 별도 Playwright 설치를 사용하려면 `PLAYWRIGHT_MODULE`을 설정할 수 있다.

2026-09-22 잠금 파일을 사용한 `npm ci --ignore-scripts` 설치, 단위 테스트 84개, 빌드·공개 파일 검사, 로컬 Windows/Edge에서 8개 브라우저 검증 묶음을 통과했다. GitHub의 Linux/Chromium 실행과 실제 공개 주소 검증은 원격 업로드 후 진행한다. 거래소 검색 조건과 URL 생성은 자동 검증하지만 외부 거래소 검색 결과 자체는 이번 검증 범위가 아니다.

## 첫 게시 순서

1. 변경한 소스·기본 데이터·문서·`package-lock.json`·`.github/workflows/pages.yml`을 검토해 커밋하고 `main`에 업로드한다. `dist/`나 개인 JSON 백업은 올리지 않는다.
2. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택한다. [GitHub 공식 사용자 지정 워크플로 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 따른다.
3. **Actions → Validate and deploy Pages**의 검증 성공 여부를 확인한다. 기본 설정에서는 `main` 업로드와 PR이 검증만 수행하고 공개하지 않는다.
4. 같은 워크플로의 **Run workflow**에서 `main`과 **Publish the validated build to GitHub Pages**를 선택해 실행한다. 검증을 다시 통과한 동일 빌드만 배포한다.
5. 워크플로가 반환한 공개 주소에서 홈 → 라이브러리 → 상세 → 내 데이터 복사/편집, 공유 링크 새 탭, 거래소 링크, 모바일을 확인한다.
6. 로컬에서 만든 개인 데이터가 필요하면 로컬 사이트에서 JSON을 내보낸 뒤 공개 사이트에서 가져온다. 주소가 달라 브라우저 저장 공간이 분리된다.

워크플로 배포 작업에만 `pages: write`, `id-token: write`를 부여한다. 개인 GitHub 토큰을 앱이나 저장소에 추가할 필요는 없다. `github-pages` 환경의 보호 규칙이 설정돼 있다면 그 규칙도 적용된다.

## 이후 업데이트

1. `npm run admin`으로 로컬 관리 모드를 실행한다.
2. 기본 자료의 **원본 편집 → 원본 저장**으로 수정한다.
3. 변경된 `data/library-overrides.ko.json` 등 관련 파일을 검토하고 위 검증을 실행한다.
4. 변경을 커밋·업로드하고 수동 배포를 실행한다. 로컬에서 원본 저장만 해서는 공개 사이트가 바뀌지 않는다.

자동 배포를 원하면 저장소 **Settings → Secrets and variables → Actions → Variables**에 `PAGES_AUTO_DEPLOY`를 값 `true`로 추가한다. 이후 `main` 업로드는 검증 성공 후 배포한다. 변수를 삭제하거나 `false`로 바꾸면 다시 수동 배포로 돌아간다.

배포 후 오류를 발견하면 문제 변경을 되돌리는 커밋(`git revert`)을 만들어 업로드하고 다시 배포한다. 이전 Git 기록이나 방문자의 개인 저장본을 삭제할 필요는 없다. 기본 자료 업데이트는 개인 수정본을 덮어쓰지 않는다.

## 후속 범위

로그인 없는 자료 제출은 첫 정적 배포와 분리한다. 도입할 때 Cloudflare Worker·Turnstile 검증·GitHub PR 생성·운영자 검토 흐름을 구현한다. 현재 저장소에 제출 서버나 관련 비밀 키를 추가하지 않는다.
