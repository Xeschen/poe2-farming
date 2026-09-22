# 파밍법 5종 추가 조사 · 2026-09-21

> **과거 조사 기록입니다.** 2026-09-22에 아래 5편 모두 자막을 확보해 재검토했습니다. 심연 챕터 뒤바뀜, 균열 수치 미반영, 통달한 영토를 물 전용으로 판단한 오류를 수정했습니다. 아래의 자막 미확보·수치 미확정·명칭 미특정 설명은 당시 상태이며 현재 데이터의 상태가 아닙니다. [최신 대조 결과와 변경 내역](caption-review-2026-09-22.md)을 기준으로 사용하세요.

## 선별 기준과 한계

한국어 또는 영어 영상, 확인 시점 조회수 10,000회 이상을 선별 기준으로 삼았다. 조회수는 공개 노출 여부의 기준이며 정확성·수익·현재 유효성을 보증하지 않는다.

여러 영상을 조사했지만 자막 추출 도구와 공개 자막 응답에서 본문을 확보하지 못했다. 최종 5종은 **같은 0.5.5 정리 영상에서 소개한 서로 다른 파밍법**이다. 영상 제작자가 설명란에 직접 연결한 세팅 가이드의 각 탭을 대조했다. 독립적인 영상 다섯 편으로 교차 검증하거나 영상 전체를 시청·자막 검증한 자료가 아니다.

- 주 영상: [Fubgun — Going over The Best Currency Farms in 0.5.5](https://www.youtube.com/watch?v=2IvZ4D9b5bs), 영어, 2026-09-08 게시, **142,501회**.
- 세부 조건: [Fubgun Atlas Tree and Strats for 0.5](https://mobalytics.gg/poe-2/atlas-trees/fubgun-atlas-tree-strats). 페이지 갱신일 표시는 2026-09-10. 문서 제목은 0.5이며, 0.5.5 영상에서 링크했다. 문서 제목의 패치를 임의로 바꾸지 않았다.
- 조회수는 2026-09-21 YouTube 원본 watch 페이지의 공개 `videoDetails.viewCount`로 확인했다. 이후 변할 수 있다.
- 추가분은 `data/library-additions.ko.json`에서 관리한다. `refresh:library`가 기존 6종과 합쳐 `data/library.ko.json`을 재생성한다.

## 등록 항목

| ID | 이름 | 영상 챕터 | 제작자 문서 탭 |
|---|---|---|---|
| abyss-currency | 심연 화폐 파밍 | 03:06 Abyss Omens | Currency Abyss |
| abyss-rare-equipment | 심연 희귀 아이템 파밍 | 05:51 Abyss Exiles | Abyss Rares, 첫 번째 자도 구성 |
| breach-rare-equipment | 균열 희귀 아이템 파밍 | 05:08 Breach Rares | Breach Rares |
| delirium-rush | 환영 보스 순회 파밍 | 04:17 Deli & Lineage Boss Rushing | Deli Rush |
| lineage-boss-rush | 혈통 보조 보스 파밍 | 04:17 Deli & Lineage Boss Rushing | Lineage Gems |

챕터 시각은 영상 설명란의 주제 위치이며, 개별 수치를 그 시각의 화면에서 직접 확인했다는 의미가 아니다. 세부 기록의 근거는 각 항목의 `creatorGuide`에 남겼다. 비용과 시간당 순이익은 `null`, 전체 아틀라스·대가 구성 확인은 `false`를 유지한다.

## DB와 대조한 차이

1. 균열 서판의 안정화 후 추가 희귀 몬스터 수는 문서에서 3마리, [한국어 DB](https://poe2db.tw/kr/Tablet)에서 1~2마리다. 효과 종류만 등록하고 검색 최소값은 `null`로 남겼다. 고유 서판의 5마리 선호는 별도 메모이며 자동 검색 수치로 위장하지 않았다.
2. 혈통 보조 문서의 숲 전환용 고유 서판을 현재 한국어 DB에서 특정하지 못했다. 통달한 영토는 물 환경이므로 대체품으로 지정하지 않았다. 종류가 없는 서판을 임의로 방사능 노출 서판에 매핑하지 않았다. 이 항목은 **완성 구매 세팅이 아닌 부분 초안**이다.
3. 6~8개 속성 범위는 메모에 보존하고 단일 선택값은 `null`로 두었다. 환영 순회처럼 6개가 명확한 경우만 숫자로 등록했다.
4. 대가는 제작자가 명시한 능력만 기록했다. 4개를 채우려고 나머지를 추측하지 않았다.
5. 심연 희귀 아이템의 자도 구성과 힐다 대안을 합치지 않았다. 문서의 전체 서판 조건을 네 장의 구매 예시로 나눴음을 메모했다. 균열의 세 부가 조건 역시 모두 강제하지 않고 우선 조건과 선택 사항으로 구분했다.

## 고유명사 확인

다음 신규 명칭을 한국어 DB에서 확인해 사전에 ID·설명·확인일과 함께 추가했다.

- [혈통 보조](https://poe2db.tw/kr/Lineage_Supports)
- [라키아타의 흐름](https://poe2db.tw/kr/Rakiatas_Flow)
- [가루칸의 투지](https://poe2db.tw/kr/Garukhans_Resolve)
- [웅장한 거울](https://poe2db.tw/kr/Grand_Mirror)
- [포위당한 레이클라스트](https://poe2db.tw/kr/Wraeclast_Besieged)
- [낙원의 환영](https://poe2db.tw/kr/Visions_of_Paradise)

[숲 숙련과 산업의 진보의 환경·레벨 조건](https://poe2db.tw/kr/Biome), [자도의 능력](https://poe2db.tw/kr/Masters_of_the_Atlas), [서판 속성](https://poe2db.tw/kr/Tablet)도 한국어 DB 및 기존 확인 카탈로그와 대조했다. 산업의 진보는 고정 효과이므로 선택형 노드 대신 전제 메모로 기록했다.

## 조사했으나 확정 세팅으로 채택하지 않은 영상

다음 조회수도 2026-09-21 원본 영상 페이지에서 확인했다. 제목·설명란은 확인했으나 자막을 확보하지 못했으며, 이전 영상의 세팅을 최신 문서와 동일하다고 간주하지 않았다.

| 영상 | 제작자 | 출처 패치 | 조회수 |
|---|---|---|---:|
| [Abyss & Rogue Exiles Full Guide](https://www.youtube.com/watch?v=d520vnC93Yo) | Fubgun | 0.5 | 179,893 |
| [Breach is PRINTING Divine Orbs in 0.5](https://www.youtube.com/watch?v=tRlH7v8_r4c) | Fubgun | 0.5 | 139,643 |
| [RUSH Farm PRINTS Currency!](https://www.youtube.com/watch?v=UfJflMmJ1BM) | ronarray | 설명란 챕터에 0.5 | 90,093 |
| [The Easiest Omen of Light Farm in POE 2 Patch 0.5](https://www.youtube.com/watch?v=CRL7ZBdw37U) | TheMidTierGamer | 0.5 | 47,687 |

## 검증

단위 테스트 57개 및 catalog·navigation 브라우저 스위트 통과. 11종 상세·개인 복사·편집 저장, 출처·제작자 문서 정보 유지, JSON 왕복, 이전 개인 자료 보존, 검색·비교·이동과 모바일 탐색을 점검했다. 기존 원본 추출 파일과 사용자 개인 저장소는 수정하지 않았다. 조회수·원문 제목·문서 출처는 선택 필드여서 기존 백업도 계속 읽는다.
