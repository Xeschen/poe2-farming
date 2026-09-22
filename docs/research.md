# PoE2 파밍 영상 5개 데이터 추출

> 이 문서는 최초 추출 당시의 기록이다. 2026-09-22에 기존 영상 5편을 포함한 10편의 자막을 재검토했다. 원본 파일은 보존하며, 앱에는 [최신 수정 내역](caption-review-2026-09-22.md)을 반영한 라이브러리를 사용한다.

작성일: 2026-09-21 · 1차 추출본 · 파밍법 6개

영상의 자동 자막·설명란·제작자 정정과 일부 세팅 화면을 확인해 정리했다. **고유명사는 PoEDB 한국어 표기를 기준으로 정규화했다.** 속성 문장은 검색을 위한 의미 요약이며 게임 문구의 완전한 전사는 아니다. 전체 아틀라스 연결 경로와 모든 화면의 세팅은 검증하지 않았으며, 현재 패치에서 직접 플레이로 검증한 자료도 아니다.

기계가 읽는 원본은 [farming-methods.ko.json](../data/farming-methods.ko.json)이다. 미확인 수치는 `null`로 두었으며, 0이나 '필요 없음'을 뜻하지 않는다. 투자 수준은 현재 가격 조사가 아닌 준비물에 따른 상대 분류다.

## 비교표

| 파밍법 | 서판 조합 | 경로석 | 지도·환경 | 대가 | 영상 패치 |
|---|---|---|---|---|---|
| 아즈메리 혼백 금고 파밍 | 탐험 서판 3개 + 감독관 서판 1개 | 15등급 / 8속성 / 몬스터 희귀도 100% 이상 | 에조미어 도시 / 풀 | 도리아니 / 힐다 | 0.5.5 |
| 대탐험 상자 파밍 | 미사용 | 15등급 / 속성 수 미확인 | 대탐험 / 산 | 자도 | 미확인 |
| 대탐험 룬 중첩 파밍 | 방사능 노출 서판 3개 | 등급 미확인 / 8속성 | 대탐험 | 도리아니 | 미확인 |
| 이름 없는 자의 의례 파밍 | 의식 서판 개수 미확인 + 신념의 자유 1개 | 15등급 / 속성 수 미확인 | 이름 없는 자의 의례 | 자도 | 0.5 |
| 서판 수집 파밍 | 방사능 노출 서판 3개 | 15등급 / 6속성 / 경로석 출현 확률 100% 이상 | 일반 지도 / 일반 탐험 지도 / 산 | 자도 | 0.5.5 |
| 정화된 지역 분열의 오브 파밍 | 환영 서판 1개 + 의식 서판 1개 + 균열 서판 1개 | 등급 미확인 / 속성 수 미확인 / 몬스터 희귀도 100% 이상 | 정화된 지역 | 힐다 | 0.5.5 |

## 먼저 반영할 정정과 차이

- **금고 파밍:** 제작자 고정 댓글에서 룬 잔류물 사용을 지연 현상 때문에 줄이도록 정정했다. [제작자 정정](https://www.youtube.com/watch?v=Mi3d9GtgwkI&lc=Ugzr_mzuTCEgYtI-_UN4AaABAg)
- **대탐험:** 저투자 상자 파밍과 고투자 룬 중첩 파밍은 세팅이 달라 별도 항목이다. 큰 수익 사례는 6인 조건이다. [수익 조건 18:25](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=1105s)
- **의식:** 0.5 영상이므로 보류 보상 규칙을 현재 패치에 그대로 적용하기 전 재확인이 필요하다. [보류 보상 관련 5:12](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=312s)
- **서판 판매:** 설명란에서 통달한 영토의 유망 환경을 풀에서 숲으로 정정했다. [영상·설명란](https://www.youtube.com/watch?v=rgrR5ty_O9Q)
- **수익:** 제작자의 표본과 당시 환산가를 기록했으며, 비교 가능한 시간당 순이익은 어느 항목도 확정하지 않았다.

## 1. 아즈메리 혼백 금고 파밍

금고에 아즈메리 혼백을 유도하고 난해한 열쇠로 반복 개방하며, 탐험에 묻힌 금고까지 활용한다.

출처: [조선펭귄 · 아즈메리 혼백 금고 파밍 가이드](https://www.youtube.com/watch?v=Mi3d9GtgwkI) · 2026-09-19 · 패치 0.5.5

- 목적: 화폐, 통과의례, 고가 고유 아이템
- 투자 수준: 높음
- 인원 조건: 영상은 1인 플레이 기준으로 설명

### 서판

**[탐험 서판](https://poe2db.tw/kr/Tablet) — 3개**

- 필수: 탐험에 묻힌 금고 2개 등장
- 권장: 아즈메리 혼백 등장 확률 증가

**[감독관 서판](https://poe2db.tw/kr/Tablet) — 1개**

- 필수: 아즈메리 혼백 2개 추가

- 네 번째 서판 사용에는 도시 환경의 산업의 진보 조건을 갖춘다.
- 영상은 서판 효과 증가로 묻힌 금고 수를 늘리는 구성을 사용한다. 서판 3개만으로 같은 금고 수가 보장되지는 않는다.
- 영상 예시는 서판 효과 54% 증가에서 금고 2개가 3개로 증가하고, 탐험 2회에 총 18개가 등장하는 구성이다.

근거: [7:38](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=458s)

### 경로석과 지도

경로석: 15등급 / 8속성 / 타락 여부 미확인.

- 필수: 몬스터 희귀도 100% 이상
- 아이템 희귀도와 몬스터 희귀도를 서로 다른 검색 항목으로 취급한다.

근거: [10:42](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=642s)

지도: 에조미어 도시 / 환경: 풀.

- 조건: 에조미어인의 역사에서 풀 선택
- 선택: 환영 200%는 제작자 선호 세팅
- 선택: 신성한 꽃을 통한 야생림은 선택 사항

근거: [12:06](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=726s) · [13:06](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=786s)

### 아틀라스와 대가

- [산업의 진보](https://poe2db.tw/kr/Industrial_Improvements) — PoEDB로 보충한 전제
- [살아있는 금속](https://poe2db.tw/kr/Living_Metal) — PoEDB로 보충한 전제
- [에조미어인의 역사](https://poe2db.tw/kr/History_of_the_Ezomytes) → 풀 — 영상 설명
- [손을 흔드는 곡물의 속삭임](https://poe2db.tw/kr/Whispers_of_the_Waving_Grains) — 효과 대조로 식별
- [바람을 타고](https://poe2db.tw/kr/On_the_Wind) → 주변에 플레이어가 없을 때 혼백이 형체를 잃지 않음 — 영상 설명
- [성스러운 진액](https://poe2db.tw/kr/Sacred_Sap) → 성스러운 혼백에 사로잡히면 다른 무작위 혼백 추가 — 영상 설명
- [대군주의 영향력](https://poe2db.tw/kr/Overlords_Influence) → 아즈메리 혼백 — 영상 설명
- [선택받은 길](https://poe2db.tw/kr/The_Chosen_Path) → 아즈메리 혼백 — 영상 설명
- [보이지 않는 강](https://poe2db.tw/kr/Azmeri_Spirit) → 야생 혼백; 다른 선택도 가능 — 영상 설명
- [꾸준한 개발](https://poe2db.tw/kr/Steady_Development) → 폭발물 — 영상 설명

전체 아틀라스 할당 경로: **미검증**. 근거: [17:13](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=1033s)

- **[도리아니](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 생존과 재도전 중심
- **[힐다](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 교배철 · 혼백의 부름 · 치명적인 적응 · 점령한 영역. 혼백의 부름을 이용해 여우와 산토끼 양쪽을 진행하는 대안.

대가 근거: [14:00](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=840s), [힐다 선택 화면 14:12](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=852s). 대가별 4개 선택은 영상 기준으로 확인했으며 현재 패치의 실전 유효성은 미검증이다.

### 진행 순서

준비물: 난해한 열쇠, 사냥의 징조, 금고 속성을 변경할 화폐, 액체 베리시움은 선택 사항.

1. 성스러운 혼백을 먼저 소모하지 않도록 주변 몬스터와 지도 보스를 정리한다.
2. 성스러운 혼백이 없다면 해당 지도의 금고 반복 파밍을 중단하는 방식이다.
3. 금고를 희귀 몬스터 무리 2개 또는 전체 몬스터 무리 7~8개 수준으로 조정한다. 몬스터가 떨어뜨리는 아이템 희귀도와 몬스터 효과 관련 속성도 살핀다.
4. 첫 금고에서 사냥의 징조와 난해한 열쇠를 활용하고, 방출된 혼백이 다음 금고로 이어지는지 확인하며 반복한다.
5. 탐험에 묻힌 금고는 난해한 열쇠로 추가 개방한 뒤 마지막 탐험 폭발 순서까지 관리한다.

근거: [19:11](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=1151s)

- 제약: 즉시 시체를 파괴하거나 산산조각 내는 빌드는 부활 반복과 충돌한다. [32:24](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=1944s)
- 제약: 지도 하나가 30~60분 이상 걸릴 수 있고 지연 현상이 심하다. [1:30](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=90s)
- **정정:** 제작자 고정 댓글은 룬 잔류물이 지연 현상에 관여하므로 가급적 터뜨리지 않는 쪽으로 정정했다. 본문 29:43의 보상 강화 권장보다 이 정정을 우선한다. [출처](https://www.youtube.com/watch?v=Mi3d9GtgwkI&lc=Ugzr_mzuTCEgYtI-_UN4AaABAg)

### 수익 사례와 미확인 사항

지도 1개에서 신성한 오브 약 200개 상당을 얻은 사례를 소개하지만, 한 시간 이상 걸렸으며 결과 편차가 크다고 설명한다. [1:30](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=90s)

비용 예시: 회당 신성한 오브 약 9개 상당(서판 사용분과 경로석). 난해한 열쇠 등 추가 소모품 전부를 포함한 총비용은 미확인. 2026-09-19 당시 설명이다. [근거](https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=160s)

- 미확인: 전체 아틀라스 할당 경로·포인트 수
- 미확인: 도리아니·힐다 구성의 현재 패치 실전 유효성
- 미확인: 자격 있는 사냥꾼을 빼면 유리하다는 후반 발언은 미검증 추측이므로 필수 세팅에 포함하지 않음
- 미확인: 성스러운 혼백의 세부 동물별 공식 명칭과 부활·고유 몬스터 전환 조건의 완전한 대조

## 2. 대탐험 상자 파밍

저렴한 경로석으로 들어가 확정 보상과 화폐 상자를 먼저 평가하고, 불필요한 전투와 재료 지출을 줄인다.

출처: [SFAM 스팸 · 대탐험 파밍 설명](https://www.youtube.com/watch?v=YHYYZI_qGuQ) · 2026-09-14 · 패치 미확인

- 목적: 화폐 상자, 베리시움 잔류물 보상
- 투자 수준: 낮음
- 인원 조건: 미확인

### 서판

저투자 방식은 서판을 사용하지 않는다.

- 저투자 방식에서는 서판을 사용하지 않는 쪽을 추천한다.

근거: [13:44](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=824s)

### 경로석과 지도

경로석: 15등급 / 속성 수 미확인 / 타락 여부 미확인.

- 저렴한 경로석 사용. 세부 속성과 수치 기준은 명시하지 않는다.

근거: [1:28](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=88s)

지도: 대탐험 / 환경: 산.

- 조건: 탐험 일지로 접근하는 대탐험
- 선택: 바다 개발에서 산 선택과 잊힌 고원 조합

근거: [6:26](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=386s)

### 아틀라스와 대가

- [바다 개발](https://poe2db.tw/kr/Cultivate_the_Sea) → 산 — 영상 설명
- [잊힌 고원](https://poe2db.tw/kr/Forgotten_Heights) — 영상 설명

전체 아틀라스 할당 경로: **미검증**. 근거: [6:26](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=386s)

- **[자도](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 베리시움 잔류물 보상 재선택 기회 — [동방의 지식](https://poe2db.tw/kr/Masters_of_the_Atlas)

대가 근거: [15:55](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=955s) · 전체 선택 조합은 미검증

### 진행 순서

준비물: 탐험 일지, 액체 베리시움은 선택 사항.

1. 전체 베리시움 잔류물의 보상을 살펴 확정 고가 보상이 있는지 먼저 판단한다.
2. 가치가 불분명하면 화폐 상자가 많은 구역에 폭발물을 집중한다.
3. 액체 베리시움을 사용할 때 기대 보상보다 재료비가 커지지 않도록 중단 기준을 둔다.
4. 필요한 상자만 회수하고 다음 지역으로 이동한다.

근거: [1:28](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=88s)

- 제약: 산 환경과 상자 수량 조합의 실제 효율은 제작자도 확정적인 실험 결과로 제시하지 않는다. [6:26](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=386s)

### 수익 사례와 미확인 사항

고투자 6인 사례의 수익 수치를 이 저투자 방식에 적용하지 않는다. [18:25](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=1105s)

- 미확인: 정확한 적용 패치 번호
- 미확인: 전체 아틀라스 할당 경로
- 미확인: 상자 보상에 대한 환경 효과의 실험 검증
- 미확인: 세부 경로석 속성

## 3. 대탐험 룬 중첩 파밍

이전 폭발의 룬 효과를 이어받는 경로를 구성하고 마지막 보상 지점에 서로 다른 룬을 쌓는다.

출처: [SFAM 스팸 · 대탐험 파밍 설명](https://www.youtube.com/watch?v=YHYYZI_qGuQ) · 2026-09-14 · 패치 미확인

- 목적: 화폐, 강화한 탐험 몬스터 보상
- 투자 수준: 높음
- 인원 조건: 수익 사례는 6인

### 서판

**[방사능 노출 서판](https://poe2db.tw/kr/Tablet) — 3개**

- 권장: 무작위 지도 속성 2개 추가
- 권장: 몬스터 효과 증가
- 선택: 아이템 희귀도 증가

- 대탐험에 적용되는 서판으로 방사능 노출 서판을 사용한다는 영상 설명에 따른다.
- 예산이 낮으면 몬스터 효과와 아이템 희귀도 중심으로 타협한다.

근거: [14:29](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=869s) · [15:25](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=925s) · [16:54](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=1014s)

### 경로석과 지도

경로석: 등급 미확인 / 8속성 / 타락 여부 미확인.

- 서판 3개에서 추가 속성 6개와 경로석 8개 속성을 합쳐 진화 압력에 활용한다.

근거: [16:54](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=1014s)

지도: 대탐험.

- 조건: 탐험 일지로 접근하는 대탐험

근거: [7:41](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=461s)

### 아틀라스와 대가

- [계산된 투자](https://poe2db.tw/kr/Calculated_Investment) → 룬 속성당 아이템 수량 — 영상 설명
- [묻고 더블로 가](https://poe2db.tw/kr/Double_or_Nothing) → 추가 룬 속성 확률 — 영상 설명

전체 아틀라스 할당 경로: **미검증**. 근거: [7:41](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=461s)

- **[도리아니](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 많은 지도 속성을 몬스터 보상 강화로 전환 — [진화 압력](https://poe2db.tw/kr/Masters_of_the_Atlas), [살점 꿰매기](https://poe2db.tw/kr/Masters_of_the_Atlas) (재도전 여유를 위한 선택)

대가 근거: [15:55](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=955s) · [16:54](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=1014s) · 전체 선택 조합은 미검증

### 진행 순서

준비물: 탐험 일지, 액체 베리시움.

1. 최종 보상을 받을 베리시움 잔류물을 먼저 정한다.
2. 다른 룬을 이어받을 수 있는 연결 지점을 찾고 폭발 순서를 역으로 계획한다.
3. 풍요 룬과 권능 룬을 초반 경로에서 확보하는 것을 우선한다.
4. 같은 룬을 반복하는 것보다 서로 다른 룬의 효과를 누적한다.
5. 강화가 모인 마지막 지점의 몬스터와 보상을 처리한다.

근거: [7:41](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=461s) · [12:35](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=755s)

- 제약: 룬 중첩으로 몬스터가 크게 강화되므로 전투 성능이 충분해야 한다. [7:41](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=461s)

### 수익 사례와 미확인 사항

6인 고투자 사례로 약 20시간에 신성한 오브 1,000개 상당, 이후 7시간에 400개 이상을 소개한다. 회당 비용은 약 5~6개 상당이라고 설명한다. 비용을 전부 뺀 시간당 순이익은 검증되지 않았다. [18:25](https://www.youtube.com/watch?v=YHYYZI_qGuQ&t=1105s)

- 미확인: 정확한 적용 패치 번호
- 미확인: 고투자 세팅의 경로석 등급
- 미확인: 전체 아틀라스 및 대가 선택
- 미확인: 1인 플레이 수익

## 4. 이름 없는 자의 의례 파밍

이름 없는 자의 의례의 지도 효과를 누적하며 고가 헌정품을 보류하고, 주변 의식에서 회수한다.

출처: [디넬 · 의식 저투자 파밍](https://www.youtube.com/watch?v=JIVK4A5g7YU) · 2026-07-22 · 패치 0.5

- 목적: 징조, 고가 의식 헌정품
- 투자 수준: 낮음
- 인원 조건: 미확인

### 서판

**[의식 서판](https://poe2db.tw/kr/Tablet) — 개수 미확인**

- 권장: 징조 등장 확률 60% 이상

**[신념의 자유](https://poe2db.tw/kr/Tablet) — 1개**

- 필수: 헌정품 무작위 변경 횟수 증가를 활용

- 일반 의식 서판의 정확한 개수는 추가 화면 확인 필요.
- 회수 단계에서는 공물 점수 증가·보류 비용 감소 중심 서판으로 전환한다.

근거: [3:18](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=198s) · [4:17](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=257s)

### 경로석과 지도

경로석: 15등급 / 속성 수 미확인 / 타락 여부 미확인.

- 15등급 지도 보스를 처치할 전투력을 요구한다. 모든 의례 지도에 같은 경로석 속성을 강제한 것으로 해석하지 않는다.

근거: [0:00](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=0s) · [1:29](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=89s)

지도: 이름 없는 자의 의례.

- 조건: 왕의 머리로 시작
- 조건: 6개 지도 진행 후 주변 일반 지도에서 보류 헌정품 회수
- 선택: 환영 200% 등 추가 강화는 선택 사항

근거: [2:03](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=123s) · [4:17](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=257s) · [7:23](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=443s)

### 아틀라스와 대가

- [나그네의 비애](https://poe2db.tw/kr/Travellers_Woe) → 더럽혀진 — 영상 설명
- [고무된 제물](https://poe2db.tw/kr/Invigorated_Sacrifices) → 헌정품 수 증가가 포함된 선택 — 영상 설명

전체 아틀라스 할당 경로: **미검증**. 근거: [1:13](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=73s)

- **[자도](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 영상 추천 대가

대가 근거: [3:15](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=195s) · 전체 선택 조합은 미검증

### 진행 순서

준비물: 왕의 머리, 직접 조달할 경우 왕 알현.

1. 왕의 머리를 구매하거나 왕 알현에서 연무 속의 왕을 처치해 준비한다.
2. 예견된 하사품의 확정 보상과 예견된 확산의 누적 이득을 비교해 순서를 정한다.
3. 공물 점수 증가, 보류·무작위 변경 비용 감소, 야생림 몬스터 추가를 우선 검토한다.
4. 고가 헌정품은 보류한다. 같은 지도 안에서 중복 보류할 필요는 없지만 다음 지도에 다시 나오면 다시 관리한다.
5. 6개 지도를 마친 뒤 주변 일반 지도 약 3~5개에서 보류한 헌정품을 회수한다.
6. 다음 왕의 머리를 사용하기 전에 보류 보상 회수를 끝낸다.

근거: [1:29](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=89s) · [2:03](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=123s) · [2:55](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=175s) · [4:17](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=257s) · [5:12](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=312s)

- 제약: 0.5 영상이다. 보류 보상 유지·초기화 규칙과 현재 비용은 재확인해야 한다. [5:12](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=312s)
- 제약: 캐릭터의 아이템 희귀도보다 15등급 지도 보스 처치 능력을 우선한다. [0:00](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=0s)

### 수익 사례와 미확인 사항

하드코어 당시 시세로 100개 지도·약 7시간에 신성한 오브 665개 상당, 헤드헌터를 제외하면 545개 상당을 제시한다. 순이익 여부는 불명확하다. [6:53](https://www.youtube.com/watch?v=JIVK4A5g7YU&t=413s)

- 미확인: 0.5.5 이후 보류 보상 규칙의 재검증
- 미확인: 일반 의식 서판 개수
- 미확인: 전체 아틀라스 및 자도 선택
- 미확인: 경로석 속성 기준

## 5. 서판 수집 파밍

서판 수량과 경로석 보상을 높이고 일반 지도와 탐험 지역을 순회한다.

출처: [EasyBabi · 서판 수집 파밍](https://www.youtube.com/watch?v=rgrR5ty_O9Q) · 2026-09-17 · 패치 0.5.5

- 목적: 서판, 판매용 경로석
- 투자 수준: 낮음~중간
- 인원 조건: 미확인

### 서판

**[방사능 노출 서판](https://poe2db.tw/kr/Tablet) — 3개, 잔여 사용 10회**

- 권장: 경로석 수량 35% 이상
- 선택: 몬스터 효과 증가
- 선택: 무리 규모 증가
- 선택: 희귀 몬스터 수 증가


근거: [10:33](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=633s)

### 경로석과 지도

경로석: 15등급 / 6속성 / 타락 여부 타락.

- 권장: 경로석 출현 확률 100% 이상
- 90% 수준은 예산상 타협 가능.
- 연금술의 오브 → 엑잘티드 오브 → 바알 오브 순으로 준비.
- 16등급이나 좋은 8속성 결과는 판매하고, 14등급으로 내려간 결과는 이 방식에서 제외한다.

근거: [10:33](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=633s)

지도: 일반 지도, 일반 탐험 지도 / 환경: 산.

- 조건: 탐험 일지로 섬 지역을 드러낸 뒤 바다 개발의 산 선택 활용
- 선택: 이상 지역은 전해지지 않은 역사로 전환

근거: [12:54](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=774s)

### 아틀라스와 대가

- [산 숙련](https://poe2db.tw/kr/Mountain_Mastery) → 서판 수량 50% — 영상 설명
- [바다 개발](https://poe2db.tw/kr/Cultivate_the_Sea) → 산 — 영상 설명

전체 아틀라스 할당 경로: **미검증**. 근거: [12:54](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=774s)

- **[자도](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 기본 구성 — [뜻밖의 임무](https://poe2db.tw/kr/Masters_of_the_Atlas), [예기치 못한 위협](https://poe2db.tw/kr/Masters_of_the_Atlas), [부분적인 해독](https://poe2db.tw/kr/Masters_of_the_Atlas), [기나긴 나날](https://poe2db.tw/kr/Masters_of_the_Atlas)
- **[자도](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 이상 지역에서는 기나긴 나날을 전해지지 않은 역사로 교체 — [전해지지 않은 역사](https://poe2db.tw/kr/Masters_of_the_Atlas)
- **[자도](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 탐험에서는 예기치 못한 위협 대신 동방의 지식 선택 가능 — [동방의 지식](https://poe2db.tw/kr/Masters_of_the_Atlas)

대가 근거: [12:20](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=740s) · [12:54](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=774s)

### 진행 순서

준비물: 연금술의 오브, 엑잘티드 오브, 바알 오브, 탐험 일지는 섬 지역 확보용.

1. 조건에 맞는 방사능 노출 서판 3개와 타락한 15등급 경로석을 준비한다.
2. 일반 지도에서 서판을 모으고 좋은 서판 속성을 분류한다.
3. 산 환경의 서판 수량 효과를 갖추고 일반 탐험 지도도 순회한다.
4. 이상 지역이나 탐험에 들어가기 전 자도의 선택을 해당 목적에 맞게 교체한다.
5. 경로석 제작 중 나온 고가 결과물은 별도로 판매 대상으로 분류한다.

근거: [10:33](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=633s) · [12:20](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=740s) · [12:54](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=774s)

- 제약: 일반 탐험 지도 순회와 대탐험 고투자 파밍을 별도 전략으로 관리한다. [12:54](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=774s)

### 수익 사례와 미확인 사항

현재 시세로 환산할 수 있는 통일된 순수익 표본은 확보하지 못했다.

- 미확인: 전체 아틀라스 연결 경로
- 미확인: 플레이 시간 대비 실제 판매 완료 수익

## 6. 정화된 지역 분열의 오브 파밍

정화된 지역에 야생림과 소환의 원을 더하고, 추가 속성이 있는 몬스터의 분열의 오브 보상을 노린다.

출처: [Bellumbr · 분열의 오브 파밍](https://www.youtube.com/watch?v=EdOOPRJIoQ4) · 2026-09-21 · 패치 0.5.5

- 목적: 분열의 오브, 징조, 환영 보상
- 투자 수준: 중간~높음
- 인원 조건: 미확인

### 서판

**[환영 서판](https://poe2db.tw/kr/Tablet) — 1개**

- 필수: 무작위 지도 속성 2개 추가
- 권장: 무리 규모 증가
- 권장: 몬스터 효과 증가
- 선택: 비용이 높으면 아이템 희귀도로 타협

**[의식 서판](https://poe2db.tw/kr/Tablet) — 1개**

- 필수: 무작위 지도 속성 2개 추가
- 권장: 무리 규모 증가
- 권장: 몬스터 효과 증가
- 선택: 비용이 높으면 아이템 희귀도로 타협

**[균열 서판](https://poe2db.tw/kr/Tablet) — 1개**

- 필수: 무작위 지도 속성 2개 추가
- 권장: 무리 규모 증가
- 권장: 몬스터 효과 증가
- 선택: 비용이 높으면 아이템 희귀도로 타협

- 세 종류 사용은 고대 명문의 서판 효과 증가와 연결된다.
- 무리 규모·몬스터 효과·아이템 희귀도는 비용에 따라 조합한다.

근거: [0:39](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=39s) · [1:10](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=70s)

### 경로석과 지도

경로석: 등급 미확인 / 속성 수 미확인 / 타락 여부 미확인.

- 권장: 몬스터 희귀도 100% 이상
- 대안: 무리 규모 증가로 대체 가능
- 등급과 전체 속성 개수는 자막에서 명시하지 않는다.

근거: [1:17](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=77s)

지도: 정화된 지역.

- 조건: 타락한 연결부를 완료해 정화된 지역 확보
- 조건: 신성한 꽃으로 야생림 추가

근거: [1:27](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=87s)

### 아틀라스와 대가

- [숨겨진 흉터](https://poe2db.tw/kr/Hidden_Scars) — PoEDB로 보충한 전제
- [머나먼 거리에서](https://poe2db.tw/kr/From_Distances_Untold) — 효과 대조로 식별
- [대군주의 영토](https://poe2db.tw/kr/Overlords_Domain) → 소환의 원 — 효과 대조로 식별
- [선택받은 길](https://poe2db.tw/kr/The_Chosen_Path) → 소환의 원 — 효과 대조로 식별
- 추가 방향: 희귀 몬스터 무리의 추가 희귀 몬스터
- 추가 방향: 마법 몬스터의 추가 속성
- 추가 방향: 무리 규모·몬스터 효과·희귀 몬스터 수

전체 아틀라스 할당 경로: **미검증**. 근거: [2:07](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=127s) · [3:07](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=187s)

- **[힐다](https://poe2db.tw/kr/Masters_of_the_Atlas)**: 서판 세 종류 효과와 소환의 원 재발동 활용 — [고대 명문](https://poe2db.tw/kr/Masters_of_the_Atlas) [효과 대조로 식별], [교배철](https://poe2db.tw/kr/Masters_of_the_Atlas) [화면·효과 대조], [점령한 영역](https://poe2db.tw/kr/Masters_of_the_Atlas) [효과 대조로 식별]

대가 근거: [2:46](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=166s) · 전체 선택 조합은 미검증

### 진행 순서

준비물: 신성한 꽃.

1. 타락한 연결부를 완료해 파밍할 정화된 지도를 확보한다.
2. 신성한 꽃의 연결 지도 적용 범위를 확인하고 야생림을 준비한다.
3. 먼저 야생림을 진행해 도깨비불을 모은다.
4. 환영의 거울을 활성화하고 지도 내 희귀 몬스터와 지도 보스를 빠짐없이 처치한다.
5. 소환의 원을 진행한다. 의식 원 안의 정화된 몬스터를 처치한 경우 의식도 수행한다.
6. 환영을 종료해 보상을 회수한 뒤 다음 지도로 이동한다.

근거: [1:27](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=87s) · [3:29](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=209s) · [4:38](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=278s)

- 제약: 영상의 수익 표본은 10개 지도로 작다. 분열의 오브 가격과 실제 드롭 편차에 크게 영향을 받는다. [4:22](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=262s)

### 수익 사례와 미확인 사항

10개 지도에서 분열의 오브 9개. 당시 개당 신성한 오브 10개 이상으로 계산한다. 제목의 시간당 수익은 비용·시간 산정 전체를 검증하지 못했으므로 순이익 필드에 넣지 않는다. [4:22](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=262s) · [5:57](https://www.youtube.com/watch?v=EdOOPRJIoQ4&t=357s)

- 미확인: 경로석 등급·전체 속성 수
- 미확인: 전체 아틀라스 연결 경로
- 미확인: 힐다의 네 가지 최종 선택: 화면에 보이는 배분과 음성의 추천 대안이 완전히 일치하지 않아 4개 확정 세팅으로 제공하지 않음
- 미확인: 야생림 도깨비불의 종류별 공식 한국어 명칭 대조가 끝나지 않아 영상의 세부 수집 우선순위는 미수록


## 서판 판매용 분류 기준

아래는 [서판 영상의 1:36 이후](https://www.youtube.com/watch?v=rgrR5ty_O9Q&t=96s)를 요약한 선별 기준이다. 현재 가격표나 게임 속성 원문의 완전한 전사가 아니다.

| 서판 | 우선 검토할 속성 |
|---|---|
| [방사능 노출 서판](https://poe2db.tw/kr/Tablet) | 무작위 지도 속성 추가 / 몬스터 효과 / 희귀 몬스터 수 / 아이템 희귀도 |
| [의식 서판](https://poe2db.tw/kr/Tablet) | 헌정품 무작위 변경 추가 횟수 / 징조 등장 확률 / 공물 점수 / 무작위 변경·보류 비용 감소 |
| [심연 서판](https://poe2db.tw/kr/Tablet) | 무작위 지도 속성 추가 / 닫은 구덩이 수에 따른 강화 / 보상 반복 / 추가 심연 |
| [균열 서판](https://poe2db.tw/kr/Tablet) | 안정된 균열의 추가 희귀 몬스터 |
| [환영 서판](https://poe2db.tw/kr/Tablet) | 분열의 거울 등장 확률 / 파편 보상 / 몬스터 효과 |
| [사원 서판](https://poe2db.tw/kr/Tablet) | 수정 관련 확률 / 고유 몬스터의 추가 속성 / 추가 고유 몬스터 |
| [탐험 서판](https://poe2db.tw/kr/Tablet) | 무작위 지도 속성 추가 / 몬스터 효과 / 추가 베리시움 잔류물 / 추가 룬 효과 |

## 명칭과 데이터 운영

- 노드명·아이템명은 아래 PoEDB 연결을 기준으로 관리한다. 자동 자막의 오기와 커뮤니티 약칭을 표시용 이름으로 쓰지 않는다.
- 베리시움 잔류물은 PoEDB 상세 페이지 제목을 채택했다. 일부 PoEDB 본문에는 베리시움 유적으로 표시되는 차이가 있다. [PoEDB](https://poe2db.tw/kr/Verisium_Remnant)
- 숫자 검색을 위해 몬스터 희귀도, 아이템 희귀도, 경로석 수량, 경로석 출현 확률을 서로 다른 필드로 저장한다.
- 영상 근거, 효과 대조로 식별한 노드, PoEDB로 보충한 전제를 구별한다. 명칭이 확인됐다는 사실만으로 영상의 할당을 확인한 것으로 취급하지 않는다.
- GitHub 저장소에서 JSON을 버전 관리하고 웹앱이 이를 읽으면 된다. 처음에는 목적·서판 종류·대가·패치·투자 수준·재검증 여부를 검색 조건으로 삼는 구성이 적합하다.

### PoEDB 명칭 연결

| 공식 한국어 표기 | 분류 | 근거 |
|---|---|---|
| 선택받은 길 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/The_Chosen_Path) |
| 대군주의 영향력 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Overlords_Influence) |
| 대군주의 영토 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Overlords_Domain) |
| 손을 흔드는 곡물의 속삭임 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Whispers_of_the_Waving_Grains) |
| 산 숙련 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Mountain_Mastery) |
| 에조미어인의 역사 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/History_of_the_Ezomytes) |
| 산업의 진보 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Industrial_Improvements) |
| 바람을 타고 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/On_the_Wind) |
| 성스러운 진액 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Sacred_Sap) |
| 자격 있는 사냥꾼 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Worthy_Hunter) |
| 살아있는 금속 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Living_Metal) |
| 머나먼 거리에서 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/From_Distances_Untold) |
| 숨겨진 흉터 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Hidden_Scars) |
| 나그네의 비애 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Travellers_Woe) |
| 고무된 제물 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Invigorated_Sacrifices) |
| 꾸준한 개발 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Steady_Development) |
| 계산된 투자 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Calculated_Investment) |
| 묻고 더블로 가 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Double_or_Nothing) |
| 바다 개발 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Cultivate_the_Sea) |
| 잊힌 고원 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Forgotten_Heights) |
| 보이지 않는 강 | 아틀라스 패시브 | [PoEDB](https://poe2db.tw/kr/Azmeri_Spirit) |
| 자도 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 도리아니 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 힐다 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 혼백의 부름 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 동방의 지식 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 진화 압력 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 살점 꿰매기 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 뜻밖의 임무 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 예기치 못한 위협 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 부분적인 해독 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 기나긴 나날 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 전해지지 않은 역사 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 고대 명문 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 교배철 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 점령한 영역 | 아틀라스의 대가 또는 패시브 | [PoEDB](https://poe2db.tw/kr/Masters_of_the_Atlas) |
| 탐험 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 감독관 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 방사능 노출 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 의식 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 환영 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 균열 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 심연 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 사원 서판 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 신념의 자유 | 서판 | [PoEDB](https://poe2db.tw/kr/Tablet) |
| 아즈메리 혼백 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Azmeri_Spirit) |
| 통과의례 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Azmeri_Spirit) |
| 신성한 꽃 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Sacred_Bloom) |
| 분열의 오브 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Fracturing_Orb) |
| 사냥의 징조 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Omen_of_the_Hunt) |
| 이름 없는 자의 의례 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Rite_of_the_Nameless) |
| 예견된 하사품 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Foretold_Bounty) |
| 예견된 확산 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Foretold_Proliferation) |
| 왕의 머리 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Ritual) |
| 왕 알현 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Ritual) |
| 연무 속의 왕 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Ritual) |
| 베리시움 잔류물 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Verisium_Remnant) |
| 풍요 룬 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Opulent_Rune) |
| 권능 룬 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Verisium_Remnant) |
| 액체 베리시움 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Expedition) |
| 탐험 일지 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Expedition) |
| 마법사의 피 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Foretold_Proliferation) |
| 헤드헌터 | 아이템 또는 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Foretold_Proliferation) |
| 신성한 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 진화의 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 확장의 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 제왕의 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 엑잘티드 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 카오스 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 바알 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 연금술의 오브 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 난해한 열쇠 | 화폐 | [PoEDB](https://poe2db.tw/kr/Currency_Exchange) |
| 통달한 영토 | 고유 서판 | [PoEDB](https://poe2db.tw/kr/Mastered_Domain) |
| 에조미어 도시 | 지역 | [PoEDB](https://poe2db.tw/kr/Citadel) |
| 소환의 원 | 콘텐츠 | [PoEDB](https://poe2db.tw/kr/Summoning_Circle) |
