# Architecture

## 1. 프로젝트 목적

빈집지킴이는 멀리 있는 농촌 빈집 소유자가 현지 관리인을 비교하고 점검 준비 정보를 확인하도록 돕는 Next.js 프로토타입이다. 현재 주소 가능 여부, 관리인·견적·정비 결과는 **예시 데이터**이며 실제 예약·지역 조회·인증은 구현되어 있지 않다.

`docs/v1-progress.md` 외에 최종 딥리서치·CODEX DEVELOPMENT BRIEF 문서는 프로젝트에서 확인되지 않았다. 따라서 이 문서는 현재 코드와 검증 결과를 기준으로 한다.

## 2. 전체 구조

```mermaid
flowchart LR
  U[사용자] --> UI[Next.js 페이지·컴포넌트]
  UI --> CS[클라이언트 서비스]
  CS --> API[Route Handler]
  API --> AS[Application Service]
  AS --> CE[Core Engine: 검증·정규화]
  AS --> P[Provider Interface]
  P --> EX[Example Provider]
  EX --> UI
  UI --> LS[브라우저 localStorage]
  UI --> CHAT[/api/chat]
  CHAT --> OAI[OpenAI Responses API]
```

## 3. 핵심엔진과 대표 흐름

주소 확인은 실제로 새 구조를 통과하는 대표 흐름이다.

`AddressSearch → inspection-availability-client → POST /api/inspection-availability → checkInspectionAvailability → validateInspectionAddress → Example Provider → API 응답 → Hero 결과 UI`

- `core/inspection-availability.ts`: 주소 검증과 공백 정규화. React·Next·저장소에 의존하지 않는다.
- `services/inspection-availability-service.ts`: 입력 검증 뒤 제공자 결과를 도메인 결과에 결합한다.
- `infrastructure/example-inspection-availability-provider.ts`: 현재 예시 지역 결과의 유일한 제공자다. 실제 DB·외부 지역 API 도입 시 이 구현만 교체한다.

## 4. Backend와 API

Route Handler는 HTTP 파싱·상태 코드만 담당하고 규칙은 서비스로 보낸다. 새 API는 다음 계약을 사용한다.

```ts
type ApiSuccess<T> = { success: true; data: T }
type ApiFailure = { success: false; error: { code: string; message: string } }
```

`POST /api/inspection-availability`는 `address`를 받고 검증 오류에 400, 예상하지 못한 오류에 500을 반환한다. `/api/chat`은 기존 호환 응답을 유지하는 이전 경계이며, 다음 P1에서 같은 계약과 외부 어댑터로 이전한다.

## 5. Frontend와 상태

- `app/`: Next.js App Router의 페이지와 HTTP route.
- `components/`: 화면 조합과 표시만 담당한다. 페이지 전용 기능은 하위 폴더에 둔다.
- `services/client/`: 브라우저에서 호출하는 API 클라이언트다.
- 입력 중·오류·성공은 컴포넌트의 local UI state이다.
- 관리인 검색 조건은 URL state, 저장 관리인은 `localStorage`, 챗봇 대화는 `sessionStorage`다.
- DB·서버 state·전역 상태 라이브러리는 현재 없다.

## 6. 데이터 저장

| 데이터 | 저장 위치 | 수명 | 이유 |
|---|---|---|---|
| 저장한 관리인 | `localStorage` | 브라우저 지속 | 로그인 없이 다시 비교 가능 |
| 챗봇 대화 | `sessionStorage` | 탭 세션 | 임시 대화 복원 |
| 관리인·견적·점검 예시 | 코드의 Example Provider / `lib/mock-data.ts` | 배포본 | 프로토타입 예시 데이터 |
| 실제 점검 요청·사용자 정보 | 없음 | 해당 없음 | 인증·DB 미구현 |

## 7. 오류·보안·외부 서비스

- 사용자 입력 오류는 UI와 API에서 모두 검증한다.
- API는 사용자용 `code`·`message`만 반환하며 내부 오류 원문을 노출하지 않는다.
- `OPENAI_API_KEY`는 서버의 `/api/chat`에서만 읽는다. `NEXT_PUBLIC_` 접두사가 없는 secret은 client 코드에 두지 않는다.
- 인증·권한은 아직 없다. 사용자별 데이터, 실제 요청, 결제 기능을 만들기 전에 서버 측 인증과 데이터 격리를 먼저 도입한다.
- 외부 API는 현재 OpenAI만 사용한다. 새 제공자는 `services` 인터페이스와 `infrastructure` 어댑터로 분리한다.

## 8. 테스트

- `tests/inspection-availability.test.mjs`: 순수 검증 엔진·서비스 계약.
- `tests/saved-managers.test.mjs`: localStorage 파싱·저장·삭제.
- `tests/v1-progress.test.mjs`: 진행률 계산과 근거 규칙.
- `tests/v1-routes.test.mjs`: 개발 서버에서 등록 경로와 전역 패널.

`pnpm build`는 현재 Google Fonts 네트워크 접근 실패로 환경상 중단될 수 있다. `tsc --noEmit`과 Node 테스트를 기본 검증으로 사용한다.

## 9. 디렉터리 책임

| 디렉터리 | 넣을 코드 | 넣지 않을 코드 |
|---|---|---|
| `app/` | 페이지, route handler, 레이아웃 | 도메인 규칙·직접 저장소 접근 |
| `components/` | UI와 local UI state | API URL 조합·핵심 판정 규칙 |
| `core/` | 순수 타입, 검증, 정규화, 엔진 | React, Next, DB, 외부 SDK |
| `services/` | use case, 제공자 인터페이스, client API 호출 | JSX·HTTP route 구현 |
| `infrastructure/` | 예시/DB/외부 제공자 구현 | UI 상태 |
| `lib/contracts/` | 공통 API 계약 | 비즈니스 흐름 |
| `tests/` | core·service·통합 검증 | 프로덕션 코드 |

## 10. 향후 개발 규칙

1. 핵심 규칙은 `core/`에 두고 UI에서 직접 구현하지 않는다.
2. 새 API는 `ApiSuccess` / `ApiFailure` 계약을 사용한다.
3. Route Handler는 입력 파싱과 HTTP 변환만 담당한다.
4. 외부 API·DB 구현은 `infrastructure/`로 격리한다.
5. 컴포넌트는 `services/client/` 외의 HTTP 호출을 만들지 않는다.
6. 예시 데이터는 실제 데이터처럼 표현하지 않고 제공자를 분리한다.
7. 새 영구 데이터는 저장소·수명·소유자를 문서에 먼저 기록한다.
8. validation 변경에는 core 테스트를 추가한다.
9. secret은 server-only config 경계에서만 읽는다.
10. P0는 실제 주소·점검 요청·사용자 데이터의 안전한 저장이고, P1은 견적·결과 고도화다.
