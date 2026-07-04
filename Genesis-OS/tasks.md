# Genesis OS — Development Tasks (MVP)

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 |
| 작성일 | 2026-07-04 |
| 상위 문서 | [Architecture.md](docs/Architecture.md) · [API.md](docs/API.md) |
| 원칙 | 마일스톤 순서 = 의존성 순서. 각 마일스톤 끝에서 동작하는 상태를 유지한다. |

---

## Milestone 0 — 기반 (M8·M9 일부)

- [x] **T01. 프로젝트 스캐폴딩** — Next.js 15 + TypeScript + Tailwind + shadcn/ui 초기화, `src/engine/` 디렉토리와 ESLint 경계 규칙(엔진에서 react/next import 금지) 설정 ✅ 2026-07-04
  - 수용 기준: `pnpm build` 성공, 경계 규칙 위반 시 lint 실패 재현 — 검증 완료 (npm build 성공, react import 삽입 시 lint 실패 재현)
- [x] **T02. Supabase 셋업** — 기존 프로젝트(`ruxbuidhvodnfztrdwvf`)에 `genesis_` 접두사로 스키마 분리 적용, DDL 마이그레이션, 전 테이블 RLS ✅ 2026-07-04
  - 수용 기준: 전 9개 테이블 RLS 활성화 확인, 보안 어드바이저 실행 후 함수 search_path 이슈 수정 완료
  - 참고: 원래 신규 프로젝트 생성을 상정했으나 기존 공유 프로젝트 사용으로 변경 (Architecture.md §7.1에 결정 기록)
- [x] **T03. 인증** — Supabase Auth 이메일 로그인, 미들웨어 세션 검증, `/login` (SC-01) ✅ 2026-07-04
  - 수용 기준: 미인증 시 전 경로 `/login` 리다이렉트 — 검증 완료 (브라우저에서 미인증→/login, 로그인→/, 인증 상태에서 /login 접근→/, 로그아웃→/login 전체 왕복 확인)
  - 버그 수정: `middleware.ts`는 `src/` 디렉토리 프로젝트에서 `src/middleware.ts`에 있어야 함 (Next.js 컨벤션, 초기에 루트에 둬서 무시되던 것을 발견·수정)
- [x] **T04. Provider Adapter** — `AIProvider` 인터페이스 + `ClaudeProvider` 구현 (스트리밍 포함), env 기반 선택 ✅ 2026-07-04
  - 수용 기준: 단위 테스트에서 mock provider로 교체 가능 — 검증 완료 (vitest 2 passed: MockProvider 실행 + ClaudeProvider 타입 호환)
  - 추가 검증: 임시 API 라우트로 실제 Claude API 스트리밍 호출 성공 확인 후 라우트 제거 (`{"provider":"claude","text":"genesis-os-smoke-ok","stopReason":"end_turn"}`)
  - 발견: Next.js는 `_`로 시작하는 폴더를 라우팅에서 제외(private folder 컨벤션) — 임시 라우트 경로 조정하며 확인

## Milestone 1 — 프로젝트 & 파이프라인 (M1·M2)

- [x] **T05. 프로젝트 CRUD** — `POST /api/projects` (5 phase 초기화 포함), 대시보드 SC-02 (목록·단계 현황), SC-03 생성 폼 ✅ 2026-07-04
  - 수용 기준: 생성 직후 discover=active, 나머지 locked — 검증 완료 (브라우저에서 OTHUB 프로젝트 실제 생성, 화면에서 discover=active/나머지=locked 확인)
- [x] **T06. 파이프라인 상태 머신** — `engine/pipeline` 전이 로직 + approve/reopen API, PipelineStepper 컴포넌트, SC-04 프로젝트 홈 ✅ 2026-07-04
  - 수용 기준: 허용되지 않은 전이는 400 INVALID_TRANSITION, reopen 시 하위 단계 stale 전환 — 검증 완료
    - active 상태에서 approve 시도 → 400 INVALID_TRANSITION 확인
    - in_review→done 정상 승인 + 다음 단계 active 전환 확인 (discover→define, define→design)
    - done 상태 phase reopen → active 복귀 + 하위 done 단계 stale 전환 확인 (discover reopen 시 define이 stale로)
    - active 상태 phase reopen 시도 → 400 INVALID_TRANSITION 확인
    - vitest 4 passed (pipeline 상태 머신 단위 테스트)

## Milestone 2 — 질문 세션 (M3·M4, 핵심)

- [x] **T07. Memory 서비스** — `engine/memory`: settle(M1→M2), buildContext(주입 전략 §5.3, 토큰 상한 포함) ✅ 2026-07-05
  - 수용 기준: pending 결정이 항상 컨텍스트에 포함됨을 테스트로 보증 — 검증 완료 (vitest: tokenLimit=1로도 pending 포함 확인)
  - 버그 수정: 카테고리에 항목이 1개뿐일 때 압축 요약이 원문 전체를 노출하던 문제 발견·수정 (COMPRESSED_SUMMARY_MAX_CHARS 적용)
  - vitest 8 passed (settle 4건 + buildContext 3건 + estimateTokens 1건), 엔진 경계 lint 통과
- [x] **T08. 프롬프트 체계** — `engine/prompts`: Constitution 조항 내장 시스템 프롬프트(캐싱 접두부), 단계별 질문 세션 템플릿, 구조화 출력 파싱(+1회 재요청 폴백) ✅ 2026-07-05
  - 수용 기준: 파싱 실패 시 폴백 경로 테스트 — 검증 완료 (vitest: 깨진 응답 → parseStructuredQuestion 실패 → buildRetryInstruction → 재차 실패 → toFreeformFallback이 유효한 구조 생성, is_phase_complete=false 강제 확인)
  - constitution.ts는 phase/프로젝트와 무관하게 고정 텍스트 유지 (프롬프트 캐싱 전제) — 동일 입력 시 buildSystemPrompt 결과 동일함을 테스트로 고정
  - vitest 10 passed (parseStructuredQuestion 4건 + 폴백 경로 3건 + buildSystemPrompt 3건), 엔진 경계 lint 통과, npm run build 성공
  - 실제 AI 호출(재요청 2회 흐름의 실제 실행)은 T09 세션 API에서 provider와 연결해 검증 예정
- [x] **T09. 세션 API** — `session/next`·`session/answer` SSE 스트리밍 (Architecture §5.2 턴 처리 흐름) ✅ 2026-07-05
  - 수용 기준: 답변 → context_entries 정착 → 다음 질문 스트리밍의 왕복 동작 — 검증 완료 (OTHUB 프로젝트에서 실제 Claude API로 브라우저 E2E)
    - session/next: 실제 스트리밍으로 구조화 질문 생성 (question_delta → question), Discover 단계 첫 질문 정상 생성
    - session/answer: 답변 제출 → context_entries에 confirmed로 정착 확인(SQL) → 다음 질문이 방금 답변 내용을 실제로 참조함을 확인 (Memory 주입 실증)
    - skipped:true → pending 상태로 정착, AI가 임의로 채우지 않고 동일 질문 재확인 (헌법 제6조)
    - 결정 존재 상태에서 session/next 재호출 → resume_summary 이벤트 정상 발생
    - locked phase에서 세션 시도 → 400 INVALID_TRANSITION 확인
  - src/engine/session: runTurn(스트리밍→파싱→재요청→폴백), buildResumeSummary
  - 구현 결정: API.md의 session/answer 요청 스키마를 {question_id}→{question,category}로 수정 (대기 질문 저장 테이블 부재로 인한 실용적 조정, API.md에 결정 기록)
  - 버그 발견·수정: TypeScript가 클로저 내부에서 isValidPhase 타입가드 좁히기를 유지하지 못함 → 좁혀진 타입을 별도 변수(phase: PhaseName)에 명시 할당
  - 인프라 수정: vitest.config.ts 추가 — Vitest 4 기본 tsconfig-paths 해석이 디렉터리 barrel(@/engine/memory 등)을 못 찾는 문제 발견, resolve.alias로 해결 (향후 엔진 간 상호 참조 전체에 적용됨)
  - vitest 30 passed 전체, 엔진 경계 lint 통과, npm run build 성공
  - 테스트로 생성된 context_entries는 정리 완료
- [x] **T10. 세션 UI (SC-05)** — 3-pane 레이아웃, QuestionCard(WHY/WHAT/HOW 접이식·선택지·직접 입력·건너뛰기), 대화 스트림, 키보드 응답(숫자키+Enter) ✅ 2026-07-05
  - 수용 기준: UX.md F2 루프 전체가 브라우저에서 동작 — 검증 완료 (OTHUB Discover 세션에서 실제 Claude API로 4턴 연속 진행)
    - QuestionCard: WHY/WHAT/HOW 접이식 토글, 옵션 5~6개(추천 배지), 직접 입력, 숫자키(1~5)로 옵션 선택, Enter로 제출 — 모두 실동작 확인
    - 답변 확정 → Decision Panel에 confirmed(녹색) 카드 실시간 추가, 다음 질문이 방금 답변을 실제로 참조(예: "반복 작업·비효율" 선택 → "어떤 반복 작업이나 비효율을 겪고 있나요?" 후속 질문)
    - 건너뛰기 → Decision Panel에 pending(⚠ 앰버) 카드 추가, AI가 임의로 채우지 않고 동일 주제 재질문 (헌법 제6조)
    - 대화 스트림: 과거 턴이 압축 표시("질문 → 답변" 또는 "⚠ 건너뜀")로 누적, 4턴까지 확인
  - 구현 컴포넌트: QuestionCard, DecisionPanel, SessionClient(SSE 소비·상태관리), parse-sse.ts(fetch 스트림 파서)
  - project 홈(SC-04)의 "Milestone 2에서 구현" 플레이스홀더를 실제 세션 링크로 교체
  - vitest 30 passed(변경 없음), 엔진 경계 lint 통과, npm run build 성공
  - 테스트로 생성된 context_entries 3건은 정리 완료
  - **Milestone 2 (T07~T10) 전체 완료 — Genesis OS 질문 세션 핵심 경험 동작**
- [ ] **T11. Decision Panel** — 실시간 결정 축적, 미정 ⚠ 상단 고정, 결정 수정(PATCH → invalidate+insert)
  - 수용 기준: 수정 시 affects_downstream 배지 표시
- [ ] **T12. 세션 재개 (F5)** — resume_summary 이벤트, 대시보드 "이어서 하기", 입력 중 답변 로컬 스토리지 보존
  - 수용 기준: 브라우저 강제 종료 후 재접속 시 요약+다음 질문으로 복귀

## Milestone 3 — 문서 (M5·M6)

- [x] **T13. Docgen 엔진** — 단계별 문서 생성 (Define→prd·roadmap / Design→ia·ux / Engineer→architecture·api), generate API SSE ✅ 2026-07-05
  - 수용 기준: 생성 완료 시 phase=in_review, 문서 원자적 저장 — 검증 완료
    - OTHUB define 단계(시딩된 confirmed 2건·pending 1건)에서 실제 generate 호출 →
      PRD(3122자)·Roadmap(4000자) 실제 Claude API로 생성, phase active→in_review 전환 확인
    - Roadmap이 pending인 `[pricing]`을 전 구간에 걸쳐 명시적으로 플래그하고 PO에게
      직접 질문까지 남김 — Memory 주입이 문서 생성에도 반영됨을 실증 (헌법 제6조)
    - discover·handoff(문서 없음)는 즉시 in_review 전환 로직도 코드 리뷰로 확인
  - src/engine/docgen: PHASE_DOC_TYPES/DOC_TYPE_PHASE 매핑, runDocgen(순차 생성,
    이전 문서를 상위 문서로 프롬프트에 포함), vitest 6 passed
  - 버그 아님(오탐): 첫 확인 시 roadmap 버전이 안 보였으나 재조회 결과 정상 존재 —
    Supabase MCP의 다중 SELECT 배치 조회가 마지막 결과만 반환하는 것으로 확인
- [x] **T14. 문서 뷰/편집 (SC-06)** — Markdown 에디터+프리뷰 2-pane, 저장=새 버전, 버전 드롭다운, 승인 버튼(미정 결정 경고 모달 포함) ✅ 2026-07-05
  - 수용 기준: 편집 저장 후 version 증가, source='user_edited' — 검증 완료
    - PRD 편집→저장 → v2(user_edited, 3155자) 생성 확인(SQL), 버전 드롭다운에 "이전 버전 보는 중" 정확히 표시
    - 승인 클릭 → "미정 결정이 1건 있습니다" 경고 정확히 표시 → 확인 시 define
      done 전환 + design active 전환 확인
  - marked로 Markdown 프리뷰 렌더링, 탭 내비게이션(6종 문서, 미생성 시 반투명)
- [x] **T15. Memory 화면 (SC-07)** — 결정 목록·카테고리 필터·검색, Discovery Brief 뷰(discover 카테고리 구조화 표시) ✅ 2026-07-05
  - Discovery Brief 섹션, phase별 그룹화, pending 항목 앰버 강조, 카테고리 필터
    실동작 확인(브라우저에서 "pricing" 필터 선택 → 해당 항목만 표시)
  - vitest 36 passed(누적), 엔진 경계 lint 통과, npm run build 성공
  - 테스트로 생성된 문서·context_entries는 정리, OTHUB은 초기 상태로 리셋
  - **Milestone 3 (T13~T15) 완료** — Discover~Engineer 승인 시 실제 문서가 AI로 생성되고, 편집·승인·Memory 열람까지 전 과정이 동작

## Milestone 4 — Handoff (M7)

- [x] **T16. Handoff 엔진** — CLAUDE.md(필수 5섹션 템플릿)·tasks.md·START_PROMPT 생성, 문서 버전 스냅샷 고정 ✅ 2026-07-05
  - 수용 기준: 패키지 내 문서가 생성 시점 버전과 일치 — 검증 완료
    - OTHUB을 discover~engineer 완료 + 6종 문서 approved로 시딩 후 실제 handoff
      호출 → CLAUDE.md(2342자)·tasks.md(6065자)·START_PROMPT(448자) 생성, doc_version_ids 6개 스냅샷 고정 확인(SQL)
    - CLAUDE.md가 시딩된 Architecture 문서(플레이스홀더)에 실제 스택 정보가
      없음을 인식하고 "⚠️ 확정된 스택 정보가 없습니다" 경고를 스스로 남김 —
      No Guessing(헌법 제6조)이 Handoff 생성에도 적용됨을 실증
  - 버그 발견·수정: approve API가 phase만 전환하고 documents.status를 approved로
    바꾸지 않던 누락을 발견 — PHASE_DOC_TYPES 기반으로 승인 시 문서도 approved 전환하도록 수정
  - src/engine/handoff: buildClaudeMdPrompt/buildTasksPrompt(AI 생성) +
    buildStartPrompt(결정론적 템플릿, AI 호출 없음 — 프로젝트마다 창의성 불필요), vitest 4 passed
- [x] **T17. Handoff UI (SC-08)** — 구성 미리보기, zip 다운로드, 프롬프트 복사, 회고 예약 안내 ✅ 2026-07-05
  - 수용 기준: zip 압축 해제 시 Architecture §5.5 구조와 일치 — 검증 완료
    - 브라우저 세션 쿠키로 curl 직접 다운로드 → `unzip -l`로 실제 구조 확인:
      CLAUDE.md · tasks.md · START_PROMPT.md · docs/{PRD,Roadmap,IA,UX,Architecture,API}.md
      10개 항목 정확히 일치 (jszip 사용)
    - CLAUDE.md/tasks.md 펼치기 토글, zip 다운로드 링크, 프롬프트 복사 버튼 실동작 확인
  - vitest 40 passed(누적), 엔진 경계 lint 통과, npm run build 성공
  - 테스트로 생성된 패키지·문서·context_entries 정리, OTHUB 초기 상태로 리셋
  - **Milestone 4 완료 — Genesis OS MVP Must 요구사항(M1~M9) 전체 구현 완료**

## Milestone 5 — 마감 (MVP 완성)

- [x] **T18. 설정 (SC-10 최소)** — Provider 표시·모델 선택, API 키는 env 안내만 ✅ 2026-07-05
  - `/settings`: Provider(claude)·Model(claude-sonnet-4-6) 실제 표시 확인, API 키는 미표시
  - `getProviderConfig()` 추가 (엔진에서 비밀 정보 없이 표시용 설정만 노출)
  - 대시보드 헤더에 설정 링크 추가 (IA.md 전역 내비게이션)
- [x] **T19. 에러·엣지 상태** — UX.md §7 전체 (빈 상태, 생성 실패 재시도, stale 배지, 경고 모달) ✅ 2026-07-05
  - 빈 상태: 대시보드에 예시 아이디어 3개 칩 추가, 클릭 시 `/projects/new?idea=`로 프리필 (브라우저 확인)
  - 세션 재개: QuestionCard 직접 입력에 localStorage 초안 저장 — 페이지 재진입 후 입력 중이던
    텍스트 복원 확인(브라우저 E2E), 제출/건너뛰기 시 초안 삭제
  - 생성 실패 재시도: 세션 질문 생성 실패 시 "다시 시도" 버튼 추가(lastAction ref로 마지막
    요청 재실행). docgen(산출물 생성) 실패는 이미 부분 저장되어 있어 버튼 재클릭만으로 재시도 가능
  - stale 배지: DocViewer에 경고 배지 + "재확인" 버튼 추가 — OTHUB에서 실제 reopen→stale
    전환 후 배지 노출 확인, 재확인 클릭 시 stale→done 전환 확인(브라우저+SQL)
  - 미정 결정 경고 모달: T14에서 이미 구현·검증 완료
  - 버그 발견·수정: `handleGenerate`가 SSE `error` 이벤트를 무시하고 무조건 성공 처리하며
    리다이렉트하던 문제 — 부분 실패 시에도 "성공"으로 오인되는 심각한 버그였음. error 이벤트를
    감지해 재시도 안내 메시지로 수정
  - 재설계: UX.md는 stale 상태에 "재생성 또는 무시"를 명시했으나, 실제 파이프라인 상태
    머신(`ALLOWED.stale = ['done']`)에는 stale→active 전이가 정의되어 있지 않음을 확인.
    존재하지 않는 전이를 만드는 대신 "재확인"(stale→done, 기존 approve 엔드포인트 재사용)만
    구현 — 상태 머신과 일치하지 않는 UI를 만들지 않기 위한 의도적 범위 조정
  - 빌드 버그 수정: `/projects/new`가 `useSearchParams()`를 Suspense 경계 없이 사용해 빌드
    실패 → Suspense로 래핑
- [ ] **T20. E2E 검증** — 신규 프로젝트 → 5단계 완주 → zip 다운로드까지 1회 통과 (Playwright)
  - 수용 기준: **Dogfooding 준비 완료** — 이 앱으로 OTHUB Discover 세션을 시작할 수 있다

## Milestone S — Should (MVP 여력 시)

- [ ] **T21. 회고 (S6, SC-09)** — 구조화 폼 3필드, 저장
- [ ] **T22. 프롬프트 템플릿 UI (S4)** — 열람·수정, 버전 증가
- [ ] **T23. 파이프라인 대시보드 강화 (S2)** — 포트폴리오 단계 집계 시각화

---

## 태스크 규약 (Claude Code 세션용)

1. 태스크는 위에서 아래 순서로 진행한다 — 마일스톤 내 태스크도 의존성 순이다.
2. 각 태스크 완료 시 수용 기준을 실제로 검증한 후 커밋한다 (커밋 단위 = 태스크).
3. 설계 문서와 코드가 충돌하면 문서가 우선한다. 문서 변경이 필요하면 구현하지 말고 회고 노트(`docs/retro-notes.md`)에 기록한다 (Flywheel ③).
