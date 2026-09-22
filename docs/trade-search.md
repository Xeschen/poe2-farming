# 세팅으로 거래소 검색 · 2026-09-21

개인 세팅을 **저장**하고 상세로 돌아가면 경로석과 각 서판에 **거래소 검색** 버튼이 표시된다. 기본 자료에서도 사용할 수 있다. 검색 창에서 반영할 속성과 리그를 확인하고 카카오 거래소로 새 탭을 열거나 주소를 복사한다. 이 선택은 파밍법의 저장 내용을 수정하지 않는다. 팝업 바깥 클릭·닫기 버튼·Escape로 닫을 수 있다. 내부에서 시작한 드래그가 바깥에서 끝나는 동작은 닫기로 처리하지 않는다.

검색 객체의 `status.option`은 **즉시 구입 전용 `securable`**이다. 직접 거래인 `online`이나 두 종류를 함께 포함하는 `available`을 사용하지 않는다. 기존에 대조한 공개 URL 생성 구현의 기본값과 [실제 API 조회를 기록한 구현 자료](https://github.com/SebRogala/ProfitOfExile/blob/main/docs/RESEARCH-poe-trade-api.md)의 해당 필드를 대조했다. 경로석과 서판 모두 같은 설정을 사용하며, 압축 URL을 해제하여 이를 검증한다. 카카오 화면에서의 실제 선택 상태·검색 결과 확인은 아래 한계와 같다.

기본 리그는 [PoEDB 리그 목록](https://poe2db.tw/League)의 Forbidden Rites이며 [한국어 목록](https://poe2db.tw/kr/League)의 표기는 금단의 의식이다. 0.5.5는 패치 번호로, URL의 리그 식별자와 분리한다. 최신 시즌 기본값은 확인 날짜 기준 정적 데이터다. 다음 시즌에는 `tradeData.defaultLeague`와 검색 창의 표시를 갱신한다. 스탠다드·하드코어 선택 및 다른 리그 영문 이름 입력도 지원한다.

## 검색 범위

- 경로석: 종류, 지정된 등급, 속성 수, 타락 여부, 선택한 주요 옵션과 별도 수치 조건. null은 경계값을 생략하고 false/0은 그대로 반영한다. 수치 구간별 80개 옵션은 주요 효과 35개로 통합했다. 새 옵션은 등급·수치를 제한하지 않는다. 기존 저장본은 원문 범위를 보존하며 편집에서 명시적으로 해제할 수 있다. 아이템 희귀도 등 합계 속성은 아래 지도 필터로 지정한다. 옵션의 부가 보상을 임의로 계산·합산하지 않는다.
- 서판: 한국어 아이템 종류, 고유 서판의 이름과 베이스, 속성 및 지정된 최소 수치. 서판 개수·아틀라스·대가 증폭은 개별 아이템의 검색 조건에 넣지 않는다.
- 필수·권장은 기본 포함, 회피는 수치에 관계없이 해당 속성이 없는 아이템을 검색한다. 나머지 우선순위는 직접 선택한다. 동일 효과에 복수 거래소 ID가 등록된 경우 하나 이상 일치하도록 OR 그룹을 만들며, 회피는 모든 ID를 각각 제외한다.
- 거래소 ID 연결 미확인 속성은 체크를 비활성화하고 검색 제외를 표시한다. 기존 수기 기록은 카탈로그와 정규화한 문구가 일치하고 연결이 단일하게 확인될 때만 연결한다. 임의 유사 문구 매칭은 하지 않는다. 미등록 서판 종류는 주소 생성 대신 안내한다.
- 현재 연결은 서판 79개 중 76개, 경로석 80개 중 80개 주요 효과다. 서판의 베리시움 수량 증가(상류 데이터 부호 불일치), 베리시움 유적 추가 확률, 심연 1개 추가 등장 속성은 미연결이다. 일반 서판 8종과 고유 2종의 아이템 명칭을 연결했다.

## 지도 수치 필터

경로석 편집에서 저장한 최소·최대를 검색 창에 불러온다. 검색 창에서 조정하면 이번 검색에만 적용된다. 빈칸은 제한 없음, 0은 실제 경계값이다. 최소>최대·음수·비수치·부활의 소수는 저장/검색을 차단하며 마지막 정상 저장본을 유지한다.

| 화면 항목 | 거래소 map_filters 필드 | 단위 |
| --- | --- | --- |
| 아이템 희귀도 | map_iir | % |
| 몬스터 희귀도 | map_rare_monsters | % |
| 무리 규모 | map_packsize | % |
| 몬스터 효율 | map_magic_monsters | % |
| 경로석 출현 확률 | map_bonus | % |
| 골드 | map_gold | % |
| 경험치 | map_experience | % |
| 부활 | map_revives | 회 |

현재 필터 명칭·카테고리별 지원 목록은 [2026-09-15 거래소 필터 스냅샷](https://github.com/slickdomi/poe2-better-trade-filter/blob/ae8f72832392000ed6259d0d758bc8d8a3739c88/packages/web/src/data/filters.json)의 mapFilters/mapFilterIdsByCategory로 확인했다. 내부 필드명 map_rare_monsters/map_magic_monsters는 남아 있지만 현재 표시명은 Monster Rarity/Monster Effectiveness이다. 과거의 마법·희귀 몬스터 수로 오해하여 저장하지 않는다. [몬스터 효율](https://poe2db.tw/kr/Monster_Effectiveness)과 기존 [서판 속성](https://poe2db.tw/kr/Irradiated_Tablet)·경로석 PoEDB 자료로 한국어 명칭을 대조했다.

## 구조와 근거

`src/trade.js`가 검색 객체를 만들고 gzip + base64url로 인코딩하여 카카오 거래소 `https://poe.kakaogames.com/trade2/search/poe2/` URL 경로에 넣는다. 중간 API 서버, 토큰, 계정 연동이나 자동 검색 요청은 없다. 주소를 직접 열기 전까지 외부 요청을 하지 않는다. URL에는 선택한 아이템 조건만 담고 개인 ID·파밍법 이름·메모·영상 출처를 넣지 않는다. 인코딩은 암호화가 아니므로 주소를 전달하면 아이템 조건은 공유된다.

속성 ID, 영문 아이템 명칭, 감소 효과의 음수 부호 및 검색 필터 형식은 [Exiled Exchange 2의 고정 커밋](https://github.com/Kvan7/Exiled-Exchange-2/tree/cca30662bf31eaf38bd711e2ec1a6b899a06c40e)에서 `renderer/public/data/ko/stats.ndjson`, `items.ndjson`과 `renderer/src/web/price-check/trade/pathofexile-trade.ts`를 대조했다. 파생 데이터의 MIT 고지는 `src/trade-data-LICENSE.txt`에 포함하며 배포본에도 복사된다. 화면의 게임 명칭과 효과 원문은 기존 한국어 PoEDB 카탈로그를 유지한다.

URL 인코딩 형식은 [poe2-better-trade-filter의 공개 구현](https://github.com/slickdomi/poe2-better-trade-filter/blob/ae8f72832392000ed6259d0d758bc8d8a3739c88/packages/web/src/lib/tradeUrl.ts)을 참고했다. JSON은 `query` 래퍼 없이 `status`, `type`, `name`, `stats`, `filters` 객체를 직접 담는다.

`scripts/refresh-trade-catalog.mjs [폴더]`는 위 고정 커밋의 공개 스냅샷을 `trade-ko-stats.ndjson`, `trade-ko-items.ndjson`으로 저장한 뒤 실행한다. 기본 폴더는 `test-results`다. 스크립트는 `src/trade-data.js`를 생성하며 ID 중복·부호·미연결 목록과 테스트를 검토해야 한다. 상류 파일을 바꿀 때는 sourceCommit/checkedAt도 실제 확인한 값으로 함께 변경한다.

카카오 거래소 주소는 [한국 거래소 검색 도구의 공개 Configure.cs](https://github.com/cheonmux/poe2tradesearch/blob/main/Configure.cs)의 한국 검색 호스트를 확인했다. [프로젝트 설명](https://github.com/cheonmux/poe2tradesearch)은 한국/글로벌 엔드포인트와 글로벌에서 영문 이름 변환을 구분한다. 카카오용 쿼리는 한국어 아이템명으로 구성한다. 압축 URL 형식의 카카오 적용은 같은 거래소 경로 구조에 근거한 구현이며 실제 결과 수신은 아직 검증하지 못했다.

## 검증과 한계

이전 글로벌 거래소 검증은 HTTP 403/보안 확인 화면에 막혔다. 이번 카카오 화면 확인은 회원·인증 호스트로 이동하면서 자동 승인 검토가 계정 세션 접근 위험을 이유로 거부했다. 인증 접근을 우회하지 않고 공개 소스와 스냅샷을 사용했다. 따라서 **실제 카카오 거래소에 조건이 적용되고 결과가 나오는지는 검증하지 못했다**. 이를 `liveVerified: false`와 검색 창에 표시한다. 미확인 조건을 숨기거나 검색 결과가 검증됐다고 표시하지 않는다. 사용자는 열린 공식 거래소에서 실제 조건을 확인해야 한다. 거래소의 비공개 URL/필터 형식이 바뀌면 연결을 갱신해야 한다.

단위 테스트는 gzip 왕복, 리그 인코딩, null/0/false, 음수 범위, 동일 효과 복수 ID, 회피, 미연결과 수기 기록, 원본 불변 및 개인 메모 제외를 검증한다. 브라우저 테스트는 저장→상세→주소 생성, 복사, 조건 변경, 잘못된 리그 시 이전 링크 제거, 개별 서판 구분, 편집·새로고침, 390px 화면과 Escape 닫기, `/dist/` 하위 경로를 검증한다. 생성된 URL을 해제하여 검색 객체를 검사하며 외부 거래소 결과 검증을 대신한다고 간주하지 않는다.
