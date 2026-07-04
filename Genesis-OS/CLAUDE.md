# Genesis OS — 구현 프로젝트 규칙

> Handoff Package (Dogfooding Cycle #1) · 생성일 2026-07-04
> 이 파일은 Genesis OS 웹앱 구현 세션의 프로젝트 규칙이다.

## 1. 제품 한 줄 정의

**Genesis OS는 아이디어를 "개발이 바로 시작될 수 있는 설계 산출물"로 전환하는 Product Engineering Operating System이다.** MVP는 1인 사용 웹앱: 프로젝트 생성 → 5단계 파이프라인(Discover→Define→Design→Engineer→Handoff) → AI 질문 세션 → 표준 6종 문서 생성 → Handoff 패키지 export.

## 2. 확정 스택 & 개발 규칙

**스택**: Next.js 15 App Router · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Auth·PostgreSQL·RLS·Storage) · Claude API (`@anthropic-ai/sdk`) · Vercel

**규칙 (위반 = 버그)**:
- TypeScript `any` 금지 — 도메인 타입 명시 (`Project`, `PipelinePhase`, `ContextEntry`, `GenesisDocument`, `HandoffPackage`, `MemoryAsset`)
- Server Component 기본, `'use client'`는 상태 필요 시만
- 전 테이블 RLS 활성화 + `user_id` 정책 (docs/Architecture.md §4)
- 환경변수: `NEXT_PUBLIC_` prefix는 클라이언트 노출 필요 시만. API 키는 서버 전용
- **엔진 경계**: `src/engine/`에서 react/next import 금지 — ESLint 규칙으로 강제 (T01)
- 파이프라인 상태 전이는 엔진 `pipeline.transition()`만 수행 — UI의 직접 UPDATE 금지
- 문서 저장은 append-only 버전, 결정 수정은 invalidate + insert

## 3. 핵심 결정 10선

1. **Engine/Interface 분리** — 엔진은 순수 TS 모듈, API Route는 얇은 어댑터. V2 MCP/CLI의 전제
2. **1인 MVP + 멀티유저 대비 RLS** — 인증은 단일 계정, 스키마는 user_id 기반으로 확장 준비
3. **질문 세션 UI = 하이브리드** — 대화 스트림 + 구조화 답변 카드 + Decision Panel (순수 채팅·순수 폼 기각)
4. **한 화면 한 질문** — 동시에 하나의 질문만 활성화, 답변 후 다음 질문 생성
5. **건너뛴 질문은 "미정"으로 기록** — AI가 임의로 채우지 않음. 승인 시 경고하되 차단하지 않음
6. **Memory 주입 = 구조화 결정 전체 + 토큰 상한(4,000) 시 카테고리 필터** — 대화 원문 재전송 금지, 미정 결정은 항상 주입
7. **Markdown이 SSOT** — 모든 화면은 문서·Memory의 투영. 화면에만 존재하는 데이터 금지
8. **AI 응답은 구조화 출력(JSON)** — 파싱 실패 시 1회 재요청 후 자유 텍스트 폴백
9. **Handoff 패키지 = CLAUDE.md · docs/ · tasks.md · START_PROMPT.md** — 문서 버전 스냅샷 고정
10. **코드 생성은 영구 범위 외** — Genesis OS는 설계까지. 구현 기능을 추가하지 말 것

## 4. 문서 색인

| 문서 | 내용 |
|---|---|
| [docs/PRD.md](docs/PRD.md) | 제품 정의 · Genesis OS DNA(헌법·계층·Memory·Flywheel) · MoSCoW · 로드맵 |
| [docs/IA.md](docs/IA.md) | 화면 10개 · URL · 내비게이션 · phase/document 상태 머신 |
| [docs/UX.md](docs/UX.md) | 핵심 플로우 F1~F6 · 와이어프레임 · 인터랙션 규칙 · 엣지 상태 |
| [docs/Architecture.md](docs/Architecture.md) | 디렉토리 구조 · DDL·RLS · 엔진 모듈 · 주입 전략 · env |
| [docs/API.md](docs/API.md) | 엔진 API 명세 · SSE 이벤트 · 에러 규약 |
| [tasks.md](tasks.md) | 개발 태스크 T01~T23 (의존성 순, 수용 기준 포함) |

## 5. 충돌 및 작업 규칙

- **설계 문서와 코드가 충돌하면 문서가 우선한다.** 문서 변경이 필요하다고 판단되면 구현하지 말고 `docs/retro-notes.md`에 기록한다 (Flywheel ③ — 이 기록이 Cycle #1 회고의 원료다).
- 태스크는 tasks.md 순서대로 진행하고, 수용 기준을 실제 검증한 후 태스크 단위로 커밋한다.
- MoSCoW의 Won't 목록(PRD §10)에 있는 기능은 "간단해 보여도" 구현하지 않는다.
