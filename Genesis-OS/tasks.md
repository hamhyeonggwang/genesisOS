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

- [ ] **T05. 프로젝트 CRUD** — `POST /api/projects` (5 phase 초기화 포함), 대시보드 SC-02 (목록·단계 현황), SC-03 생성 폼
  - 수용 기준: 생성 직후 discover=active, 나머지 locked
- [ ] **T06. 파이프라인 상태 머신** — `engine/pipeline` 전이 로직 + approve/reopen API, PipelineStepper 컴포넌트, SC-04 프로젝트 홈
  - 수용 기준: 허용되지 않은 전이는 400 INVALID_TRANSITION, reopen 시 하위 단계 stale 전환

## Milestone 2 — 질문 세션 (M3·M4, 핵심)

- [ ] **T07. Memory 서비스** — `engine/memory`: settle(M1→M2), buildContext(주입 전략 §5.3, 토큰 상한 포함)
  - 수용 기준: pending 결정이 항상 컨텍스트에 포함됨을 테스트로 보증
- [ ] **T08. 프롬프트 체계** — `engine/prompts`: Constitution 조항 내장 시스템 프롬프트(캐싱 접두부), 단계별 질문 세션 템플릿, 구조화 출력 파싱(+1회 재요청 폴백)
  - 수용 기준: 파싱 실패 시 폴백 경로 테스트
- [ ] **T09. 세션 API** — `session/next`·`session/answer` SSE 스트리밍 (Architecture §5.2 턴 처리 흐름)
  - 수용 기준: 답변 → context_entries 정착 → 다음 질문 스트리밍의 왕복 동작
- [ ] **T10. 세션 UI (SC-05)** — 3-pane 레이아웃, QuestionCard(WHY/WHAT/HOW 접이식·선택지·직접 입력·건너뛰기), 대화 스트림, 키보드 응답(숫자키+Enter)
  - 수용 기준: UX.md F2 루프 전체가 브라우저에서 동작
- [ ] **T11. Decision Panel** — 실시간 결정 축적, 미정 ⚠ 상단 고정, 결정 수정(PATCH → invalidate+insert)
  - 수용 기준: 수정 시 affects_downstream 배지 표시
- [ ] **T12. 세션 재개 (F5)** — resume_summary 이벤트, 대시보드 "이어서 하기", 입력 중 답변 로컬 스토리지 보존
  - 수용 기준: 브라우저 강제 종료 후 재접속 시 요약+다음 질문으로 복귀

## Milestone 3 — 문서 (M5·M6)

- [ ] **T13. Docgen 엔진** — 단계별 문서 생성 (Define→prd·roadmap / Design→ia·ux / Engineer→architecture·api), generate API SSE
  - 수용 기준: 생성 완료 시 phase=in_review, 문서 원자적 저장
- [ ] **T14. 문서 뷰/편집 (SC-06)** — Markdown 에디터+프리뷰 2-pane, 저장=새 버전, 버전 드롭다운, 승인 버튼(미정 결정 경고 모달 포함)
  - 수용 기준: 편집 저장 후 version 증가, source='user_edited'
- [ ] **T15. Memory 화면 (SC-07)** — 결정 목록·카테고리 필터·검색, Discovery Brief 뷰(discover 카테고리 구조화 표시)

## Milestone 4 — Handoff (M7)

- [ ] **T16. Handoff 엔진** — CLAUDE.md(필수 5섹션 템플릿)·tasks.md·START_PROMPT 생성, 문서 버전 스냅샷 고정
  - 수용 기준: 패키지 내 문서가 생성 시점 버전과 일치
- [ ] **T17. Handoff UI (SC-08)** — 구성 미리보기, zip 다운로드, 프롬프트 복사, 회고 예약 안내
  - 수용 기준: zip 압축 해제 시 Architecture §5.5 구조와 일치

## Milestone 5 — 마감 (MVP 완성)

- [ ] **T18. 설정 (SC-10 최소)** — Provider 표시·모델 선택, API 키는 env 안내만
- [ ] **T19. 에러·엣지 상태** — UX.md §7 전체 (빈 상태, 생성 실패 재시도, stale 배지, 경고 모달)
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
