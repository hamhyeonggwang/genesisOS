# Genesis OS — Technical Architecture

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 |
| 작성일 | 2026-07-04 |
| 상태 | Draft — Product Owner 승인 대기 |
| 상위 문서 | [PRD.md](PRD.md) v1.1 · [IA.md](IA.md) · [UX.md](UX.md) |
| 파이프라인 단계 | Engineer (4/5) |

---

## 1. 아키텍처 원칙

1. **Engine / Interface 분리 (헌법 제9조).** 엔진은 `src/engine/`에 UI 의존성 없는 순수 TypeScript 모듈로 구현한다. Next.js API Route는 엔진을 호출하는 얇은 어댑터일 뿐이다. `src/engine/`에서 React·Next.js를 import하면 빌드가 실패해야 한다 (ESLint 경계 규칙).
2. **읽기는 직접, 실행은 API 경유.** 단순 조회는 Supabase 클라이언트가 RLS 하에서 직접 수행하고, AI 실행·상태 전이·패키지 생성 등 엔진 로직은 반드시 API Route를 경유한다. V2에서 이 API가 그대로 MCP Server / CLI의 기반이 된다.
3. **모든 쓰기는 이벤트다.** 문서 저장은 새 버전 생성, 결정은 append + 무효화 플래그. 파괴적 UPDATE/DELETE를 피해 Flywheel의 원료(이력)를 보존한다.

## 2. 시스템 구성

```
┌─ Browser ─────────────────────────────────────────────┐
│  Next.js 15 App Router (Server Components 기본)        │
│  QuestionCard · DecisionPanel · PipelineStepper ·      │
│  DocViewer ('use client')                              │
└───────┬──────────────────────────────┬────────────────┘
        │ 조회 (RLS 직접)                │ 실행 (SSE 스트리밍)
┌───────▼────────┐            ┌────────▼────────────────┐
│ Supabase       │◄───────────│ Next.js API Routes      │
│ · Auth         │   읽기/쓰기  │  /api/* (얇은 어댑터)     │
│ · PostgreSQL   │            ├─────────────────────────┤
│ · RLS          │            │ src/engine/  (핵심 자산)  │
│ · Storage      │            │ · pipeline   · prompt    │
└────────────────┘            │ · memory     · docgen    │
                              │ · handoff    · provider  │
                              └────────┬────────────────┘
                                       │
                              ┌────────▼────────┐
                              │ AI Provider     │
                              │ Claude API (기본)│
                              └─────────────────┘
```

## 3. 디렉토리 구조

```
genesis-os/
├── src/
│   ├── app/                      # Next.js App Router (L5 Interface)
│   │   ├── (auth)/login/
│   │   ├── page.tsx              # SC-02 대시보드
│   │   ├── projects/
│   │   │   ├── new/              # SC-03
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # SC-04 프로젝트 홈
│   │   │       ├── session/[phase]/  # SC-05
│   │   │       ├── docs/[type]/  # SC-06
│   │   │       ├── memory/       # SC-07
│   │   │       ├── handoff/      # SC-08
│   │   │       └── retro/        # SC-09
│   │   ├── settings/             # SC-10
│   │   └── api/                  # 엔진 어댑터 (API.md 참조)
│   ├── engine/                   # L4 Engine — UI 의존성 금지
│   │   ├── pipeline/             # 상태 머신, 완료 조건
│   │   ├── session/              # 질문 세션 오케스트레이션
│   │   ├── memory/               # M1→M2 정착, 컨텍스트 주입
│   │   ├── docgen/               # 6종 문서 생성
│   │   ├── handoff/              # 패키지 조립
│   │   ├── prompts/              # L2 Constitution 내장 템플릿
│   │   └── provider/             # AI Provider Adapter
│   ├── components/               # QuestionCard, DecisionPanel 등
│   ├── lib/                      # supabase 클라이언트, utils
│   └── types/                    # 도메인 타입 (any 금지)
├── supabase/migrations/
└── docs/                         # 본 설계 문서들
```

## 4. 데이터 모델 (DDL)

> 전 테이블 `user_id uuid not null references auth.users` + RLS. `updated_at`은 트리거로 자동 갱신.

```sql
-- 파이프라인 단계 enum
create type phase_name as enum ('discover','define','design','engineer','handoff');
create type phase_status as enum ('locked','active','in_review','done','stale');
create type doc_type as enum ('prd','roadmap','ia','ux','architecture','api');
create type doc_status as enum ('draft','approved');
create type entry_status as enum ('confirmed','pending','invalidated'); -- 확정/미정/무효화

create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  name        text not null,
  idea        text not null,              -- 최초 아이디어 한 문단
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table project_phases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  project_id  uuid not null references projects on delete cascade,
  phase       phase_name not null,
  status      phase_status not null default 'locked',
  -- 완료 조건 체크리스트: [{key, label, met}] (엔진이 관리)
  checklist   jsonb not null default '[]',
  approved_at timestamptz,
  unique (project_id, phase)
);

-- M2 Project Memory: 질문·답변·결정의 append-only 저장소
create table context_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  project_id  uuid not null references projects on delete cascade,
  phase       phase_name not null,
  question    text not null,               -- AI가 던진 질문 (WHY/WHAT/HOW 포함)
  answer      text,                        -- PO 답변 원문 (미정이면 null)
  decision    text,                        -- 정착된 결정 요약 (엔진이 구조화)
  category    text not null,               -- 예: 'problem','users','scope','stack'
  status      entry_status not null default 'confirmed',
  created_at  timestamptz not null default now()
);

create table documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  project_id  uuid not null references projects on delete cascade,
  type        doc_type not null,
  status      doc_status not null default 'draft',
  unique (project_id, type)
);

-- 모든 저장 = 새 버전 (S1). 최신 버전이 현재 내용.
create table document_versions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  document_id uuid not null references documents on delete cascade,
  version     int not null,
  content_md  text not null,               -- Markdown SSOT (헌법 제10조)
  source      text not null,               -- 'ai_generated' | 'user_edited'
  created_at  timestamptz not null default now(),
  unique (document_id, version)
);

create table handoff_packages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  project_id  uuid not null references projects on delete cascade,
  claude_md   text not null,
  tasks_md    text not null,
  start_prompt text not null,
  doc_version_ids uuid[] not null,          -- 스냅샷 시점의 문서 버전 고정
  created_at  timestamptz not null default now()
);

create table retrospectives (                -- S6, Flywheel ③
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  project_id  uuid not null references projects on delete cascade,
  went_well   text,
  design_gaps text,                          -- 재작업 유발 누락
  new_questions text,                        -- 다음에 물어야 할 질문 (M3 승격 후보)
  created_at  timestamptz not null default now()
);

create table prompt_templates (              -- L2 실행형 (S4)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  phase       phase_name not null,
  kind        text not null,                 -- 'question_session' | 'doc_generation'
  doc_type    doc_type,                      -- doc_generation일 때만
  content     text not null,
  version     int not null default 1
);

create table memory_assets (                 -- M3 Genesis Memory (MVP: 테이블만, V1: 본격화)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users,
  kind        text not null,                 -- 'question' | 'pattern' | 'checklist' | 'failure'
  content     text not null,
  source_project_id uuid references projects,
  created_at  timestamptz not null default now()
);
```

### RLS 정책 (전 테이블 동일 패턴)

```sql
alter table projects enable row level security;
create policy "owner_all" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- 나머지 테이블에 동일 정책 반복 적용
```

MVP는 단일 계정이지만 이 정책만으로 V2 멀티유저가 무변경 동작한다 (PRD §3).

## 5. 엔진 모듈 설계

### 5.1 Pipeline (상태 머신)

```typescript
// src/types/pipeline.ts
type PhaseTransition =
  | { from: 'locked';    to: 'active';    trigger: 'prev_phase_done' }
  | { from: 'active';    to: 'in_review'; trigger: 'artifacts_generated' }
  | { from: 'in_review'; to: 'done';      trigger: 'po_approved' }
  | { from: 'done';      to: 'stale';     trigger: 'upstream_revised' }
  | { from: 'stale';     to: 'done';      trigger: 'po_reconfirmed' };
```

전이는 엔진의 `pipeline.transition()`만 수행한다 — UI가 status를 직접 UPDATE하는 것은 금지 (API 경유 강제).

### 5.2 Session (질문 오케스트레이션)

한 턴의 처리 흐름:

```
POST /api/.../answer
 → memory.settle(answer)           # M1→M2 정착: context_entries insert
 → memory.buildContext(project)    # §6 주입 전략으로 컨텍스트 조립
 → prompts.render('question_session', phase, context)
 → provider.stream(...)            # 다음 질문 생성 (SSE로 클라이언트 전달)
 → pipeline.updateChecklist()      # 완료 조건 충족 검사
```

AI 응답은 구조화 출력(JSON)으로 받는다: `{ question, why, what, how, options[], is_phase_complete, summary? }`. 파싱 실패 시 1회 재요청 후 자유 텍스트 폴백.

### 5.3 Memory 주입 전략 (PRD Open Question 2 — 결정)

**결정: 구조화 결정 요약 전체 주입 + 카테고리 필터 (하이브리드).**

- 주입 단위는 대화 원문이 아니라 `context_entries.decision` (구조화 요약 1~2문장). 헌법 제3조의 구현이자 비용 통제 수단 — 전체 대화 재전송 금지.
- MVP 규모(프로젝트당 결정 수십 개)에서는 **confirmed 결정 전체**를 카테고리별로 묶어 주입한다. 예산 초과 대비로 컨텍스트 빌더에 토큰 상한(기본 4,000 토큰)을 두고, 초과 시 현재 단계와 관련 category 우선 + 나머지는 카테고리별 1줄 요약으로 압축한다.
- `pending`(미정) 결정은 항상 주입한다 — AI가 임의로 채우지 않도록 "미정" 표시와 함께 (헌법 제6조).
- 시스템 프롬프트(Constitution 조항 포함)는 고정 접두부로 두어 **프롬프트 캐싱** 적중률을 확보한다.

### 5.4 Provider Adapter (M9)

```typescript
// src/engine/provider/types.ts
interface AIProvider {
  stream(req: CompletionRequest): AsyncIterable<CompletionChunk>;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}
// 구현체: ClaudeProvider (기본, @anthropic-ai/sdk) · 추후 OpenAIProvider
// 선택은 env GENESIS_AI_PROVIDER, 모델·키는 서버 전용 env (NEXT_PUBLIC_ 금지)
```

### 5.5 Docgen & Handoff

- **Docgen**: 단계 완료 시 해당 단계의 문서를 순차 생성 (Define→prd·roadmap, Design→ia·ux, Engineer→architecture·api + tasks). 입력 = Memory 컨텍스트 + 상위 승인 문서 최신 버전. 출력 = `document_versions` insert (source: 'ai_generated').
- **Handoff 패키지 구성 (PRD Open Question 3 — 결정)**:

```
{project}-handoff.zip
├── CLAUDE.md          # 프로젝트 규칙: 스택·개발 규칙·핵심 결정 요약·문서 색인
├── docs/              # 승인된 6종 문서 (버전 고정 스냅샷)
│   ├── PRD.md · Roadmap.md · IA.md · UX.md · Architecture.md · API.md
├── tasks.md           # 마일스톤별 개발 태스크 (수용 기준 포함)
└── START_PROMPT.md    # Claude Code 첫 세션에 붙여넣을 구현 시작 프롬프트
```

CLAUDE.md 템플릿의 필수 섹션: ① 제품 한 줄 정의 ② 확정 스택·개발 규칙 ③ 핵심 결정 10선 (Memory에서 추출) ④ 문서 색인 ⑤ "설계 문서와 충돌 시 문서가 우선, 변경 필요 시 회고에 기록" 규칙.

## 6. 스트리밍 & 에러 처리

- AI 응답은 Route Handler에서 SSE로 스트리밍 (`ReadableStream`), 클라이언트는 EventSource가 아닌 fetch 스트림 소비 (POST 필요).
- 생성 실패: 부분 결과를 `document_versions`에 `source: 'ai_generated_partial'`로 보존하지 않는다 — 문서는 원자적으로만 저장하고, 세션 답변만 로컬 스토리지에 보존 (UX.md §5).
- 재시도: provider 레벨 1회 자동 재시도(지수 백오프), 이후 사용자에게 [다시 시도] 노출.

## 7. 환경 변수

| 변수 | 노출 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | Supabase 접속 (RLS가 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | 마이그레이션·관리 작업만 |
| `ANTHROPIC_API_KEY` | 서버 전용 | Claude API |
| `GENESIS_AI_PROVIDER` | 서버 전용 | `claude`(기본) \| `openai` |

## 8. 결정 기록 (이 문서에서 확정된 것)

| # | 결정 | 근거 |
|---|---|---|
| A1 | 엔진은 `src/engine/` 순수 TS 모듈 + ESLint 경계 규칙 | 헌법 제9조를 컴파일 타임에 강제 |
| A2 | Memory 주입 = 구조화 결정 전체 + 토큰 상한 시 카테고리 필터 | MVP 규모 최적 + 비용 통제 |
| A3 | 문서 저장 = append-only 버전, 결정 = append + 무효화 플래그 | Flywheel 원료 보존 |
| A4 | Handoff 패키지 4요소 (CLAUDE.md·docs·tasks·START_PROMPT) | Claude Code 즉시 착수 조건 |
| A5 | AI 구조화 출력(JSON) + 1회 재요청 폴백 | 질문 카드 UI의 안정적 렌더링 |

---

*동반 문서: [API.md](API.md) · [tasks.md](tasks.md)*
