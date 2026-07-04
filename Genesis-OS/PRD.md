# Genesis OS — Product Requirements Document

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.1 |
| 작성일 | 2026-07-04 |
| 개정 이력 | v1.0 초안 → v1.1 OS 승격: Part II. Genesis OS DNA(Constitution·Layer Architecture·Knowledge & Memory·Flywheel) 추가 |
| 상태 | Draft — Product Owner 승인 대기 |
| Product Owner | 함형광 |
| 설계 책임 | Claude (PM · UX Researcher · IA · Product Designer · Solution Architect · Technical Lead) |
| 생성 방식 | Genesis OS Discover→Define 프로세스 (Dogfooding Cycle #1) |

---

# Part I. Product Definition

## 1. Vision

**Genesis OS는 아이디어를 "개발이 바로 시작될 수 있는 설계 산출물"로 전환하는 Product Engineering Operating System이다.**

Genesis OS는 단순한 설계 도구(Engine)가 아니라 운영체제(OS)다. 이 구분은 본질적이다:

- **Engine**은 입력을 산출물로 변환하고 멈춘다.
- **OS**는 불변의 법(Constitution) 위에서, 계층 구조(Layer Architecture)로 조직되고, 모든 실행을 기억(Knowledge & Memory)하며, 실행할수록 스스로 강해진다(Flywheel).

하나의 애플리케이션이 아니라, 동일한 핵심 엔진을 여러 인터페이스(Web App, Claude Skill, MCP Server, CLI 등)에서 사용할 수 있는 멀티 인터페이스 운영체제를 지향한다.

```
Genesis Ecosystem
├── Genesis OS                 ← 본 문서의 대상 (제품 설계 운영체제)
│
└── Genesis OS로 설계될 제품 포트폴리오
    ├── Occupation Flow AI OS   (임상 AI 플랫폼)
    ├── OTHUB                   (교육 플랫폼) ← 첫 외부 검증 프로젝트
    ├── ORION                   (개인 AI Workspace)
    ├── Link IT                 (IADL 훈련 플랫폼)
    ├── 병원 Dashboard
    └── Future Products...
```

## 2. Problem Statement (WHY)

**문제.** 제품 아이디어는 많지만, 아이디어에서 개발 착수까지의 과정이 매번 임기응변으로 진행된다.

1. **프로세스 비표준화** — 프로젝트마다 설계 깊이와 산출물이 다르다. 어떤 프로젝트는 PRD 없이 코딩부터 시작하고, 어떤 프로젝트는 철학 문서만 있고 실행 설계가 없다 (예: Occupation Flow AI OS v0.1은 Constitution은 있으나 PRD·IA·기술 설계가 없음).
2. **AI 협업의 휘발성** — Claude와의 설계 대화는 강력하지만 세션이 끝나면 맥락이 사라진다. 질문-답변으로 축적된 제품 결정사항이 자산화되지 않는다.
3. **설계-구현 단절** — 설계 문서가 있어도 Claude Code / Cursor가 바로 구현을 시작할 수 있는 형태(CLAUDE.md, 태스크 분해, 컨텍스트 패키지)로 정리되어 있지 않아 핸드오프마다 재작업이 발생한다.
4. **포트폴리오 확장 불가** — OTHUB, ORION, Link IT 등 대기 중인 제품이 늘어날수록 1인 Product Owner의 설계 병목이 심화된다.

**기회.** 이 설계 과정 자체를 제품화하면, 모든 후속 제품의 설계 속도와 품질이 표준화된다. 설계 프로세스는 1회 구축, 무한 재사용 자산이 된다 ("Build once. Reuse everywhere.").

## 3. Target Users

### MVP (v0.x)
| 페르소나 | 설명 |
|---|---|
| **P1. Product Owner (본인)** | 작업치료사·연구자·교육자·AI 개발자. 다수의 제품 아이디어를 보유한 1인 메이커. Claude를 AI 팀(PM·UX·개발)으로 활용. 유일한 사용자. |

### 확장 (Version 2+)
| 페르소나 | 설명 |
|---|---|
| P2. 도메인 전문가 메이커 | 개발 역량은 제한적이지만 도메인 전문성과 제품 아이디어를 가진 전문직 (예: 작업치료사, 보건의료인) |
| P3. 1인 개발자 / 인디 해커 | 설계 단계를 건너뛰고 코딩부터 시작하는 습관을 가진 개발자 |

> MVP는 P1 단독 사용이지만, 데이터 모델은 처음부터 멀티유저(user_id 기반 RLS)로 설계한다.

## 4. Value Proposition

> **"아이디어를 넣으면, 개발을 바로 시작할 수 있는 설계 패키지가 나온다.
> 그리고 제품을 만들 때마다, Genesis OS 자신이 더 강해진다."**

| 기존 방식 | Genesis OS |
|---|---|
| 프로젝트마다 다른 설계 프로세스 | 표준 5단계 파이프라인 (Discover→Handoff) |
| 휘발되는 AI 설계 대화 | Knowledge & Memory System에 결정사항 영구 축적 |
| 산출물 형식 제각각 | 표준 6종 문서 (PRD·IA·UX·Architecture·API·Roadmap) |
| 핸드오프마다 재작업 | Claude Code / Cursor가 즉시 구현 가능한 Handoff 패키지 |
| 프로젝트 경험이 개인 기억에만 남음 | Flywheel: 프로젝트마다 프로세스·프롬프트·패턴이 시스템 자산으로 진화 |

---

# Part II. Genesis OS DNA

> 이 파트는 프로젝트별 기능이 아니라 Genesis OS의 **영구적인 DNA**를 정의한다.
> 기능(Part III)은 버전마다 바뀌지만, DNA는 모든 버전·모든 인터페이스·모든 제품에 걸쳐 지속된다.
> 기능이 DNA와 충돌하면 기능이 진다.

## 5. Genesis Constitution

Genesis OS의 최상위 법. 모든 프롬프트, 모든 파이프라인, 모든 산출물, 그리고 Genesis OS 자신의 개발은 이 헌법을 따른다.

### 제1장 — 존재 이유

**제1조 (목적)** Genesis OS는 아이디어를 개발 가능한 설계로 전환한다. 코드 생성과 운영을 대체하지 않으며, 설계의 완결성으로 승부한다.

**제2조 (Workflow First, AI Second)** 워크플로우가 먼저 정의되고, AI는 그 흐름을 가속하는 엔진이다. AI 기능을 위해 워크플로우를 왜곡하지 않는다.

**제3조 (지식의 자산화)** 모든 질문, 답변, 결정, 실패는 휘발되지 않고 시스템의 자산이 된다. 한 번 배운 것은 다시 묻지 않는다.

### 제2장 — 설계 행동 규범

**제4조 (WHY → WHAT → HOW)** 모든 단계, 모든 질문, 모든 산출물은 이유(WHY), 대상(WHAT), 방법(HOW)을 먼저 밝힌 후 진행한다.

**제5조 (One Question at a Time)** 질문은 우선순위 순서로 한 번에 하나씩 던지고, 답변을 반영하여 다음 질문을 생성한다.

**제6조 (No Guessing)** 정보가 부족하면 절대 추측하지 않고 질문한다. 추측으로 만든 설계는 설계가 아니다.

**제7조 (MoSCoW)** 모든 기능은 Must / Should / Could / Won't로 우선순위화한다. Won't 목록이 없는 범위 정의는 완성되지 않은 것이다.

**제8조 (Versioned Scope)** 모든 설계는 MVP / Version 1 / Version 2 / Future로 구분한다. 확장성은 고려하되, 구현은 현재 버전만 한다.

### 제3장 — 시스템 구조 규범

**제9조 (Engine / Interface 분리)** 엔진은 어떤 인터페이스에도 종속되지 않는다. 웹앱은 엔진의 첫 번째 껍질일 뿐이다.

**제10조 (Markdown is the Single Source of Truth)** 모든 산출물의 원본은 Markdown이다. UI·DB·export는 Markdown의 투영이다.

**제11조 (Build Once, Reuse Everywhere)** 반복되는 것은 템플릿이 되고, 템플릿은 패턴이 되고, 패턴은 시스템의 일부가 된다.

**제12조 (Dogfooding)** Genesis OS는 자신의 프로세스로 자신을 설계·개선한다. 자신에게 적용할 수 없는 프로세스는 다른 제품에도 강요하지 않는다.

### 제4장 — 개정

**제13조 (개정 절차)** 헌법은 Product Owner의 명시적 승인으로만 개정된다. 개정 시 사유와 날짜를 기록하며, 개정 이력 자체도 Knowledge & Memory System에 축적된다. 프롬프트·템플릿·기능은 자유롭게 진화하지만, 헌법 위반은 버그로 취급한다.

## 6. Layer Architecture

Genesis OS는 6계층으로 조직된다. 하위 계층은 상위 계층보다 느리게 변한다 — 헌법은 거의 불변이고, 생태계는 매일 자란다. **의존성은 항상 위에서 아래로만 흐른다.**

```
L6  Ecosystem        제품 포트폴리오: Occupation Flow · OTHUB · ORION · Link IT ...
                     Genesis OS가 존재하는 이유이자 Flywheel의 연료
────────────────────────────────────────────────────────────────
L5  Interfaces       Web App(MVP) · Claude Skill · MCP Server · CLI ·
                     ChatGPT GPT · Cursor/VS Code Extension (V2+)
────────────────────────────────────────────────────────────────
L4  Engine (Kernel)  Pipeline State Machine (5단계) · Prompt Template Engine ·
                     Document Generator (6종) · Handoff Packager
────────────────────────────────────────────────────────────────
L3  Knowledge &      Session Memory · Project Memory · Genesis Memory
    Memory           (§7에서 상세 정의)
────────────────────────────────────────────────────────────────
L2  Constitution     §5의 13개 조항 — 프로세스 정의·행동 규범·구조 규범
────────────────────────────────────────────────────────────────
L1  Foundation       Supabase (Auth·PostgreSQL·RLS·Storage) · Vercel ·
                     AI Provider Adapter (Claude 기본, 교체 가능)
```

### 계층 규칙

1. **L4 Engine은 L5 Interfaces를 모른다.** 엔진은 API-first로 설계되며, 어떤 인터페이스에서 호출되는지 인식하지 않는다 (헌법 제9조의 구조적 구현).
2. **L2 Constitution은 L4 Engine의 프롬프트 체계에 주입된다.** 헌법 조항은 문서가 아니라 실행 규칙이다 — 예: 제5조는 질문 세션 프롬프트의 하드 제약으로 구현된다.
3. **L3 Memory는 L4 Engine의 모든 실행에 읽기·쓰기로 개입한다.** 엔진은 상태 없는(stateless) 변환기가 아니라 기억하는 시스템이다.
4. **L6 Ecosystem의 모든 제품은 L4를 통해서만 태어난다.** 파이프라인을 우회한 제품은 Genesis Ecosystem의 구성원이 아니다.

### 로드맵 매핑

| 계층 | MVP | V1 | V2+ |
|---|---|---|---|
| L1 Foundation | 전체 구축 | — | 멀티유저 스케일 |
| L2 Constitution | 프롬프트 체계에 내장 | 템플릿 UI에서 열람 | 개정 이력 관리 |
| L3 Memory | Session + Project Memory | Genesis Memory (패턴 승격) | 자동 승격 제안 |
| L4 Engine | 5단계 전체 | 품질 체크리스트 | 엔진 API 공개 |
| L5 Interfaces | Web App | GitHub export | MCP · Skill · CLI |
| L6 Ecosystem | Genesis OS 자신 | OTHUB, Link IT... | 외부 사용자 제품 |

## 7. Knowledge & Memory System

OS와 엔진을 가르는 결정적 차이. Genesis OS는 3계층 기억 구조를 가지며, 지식은 아래에서 위로 **승격(promotion)**된다.

```
                    ┌─────────────────────────────────────┐
  영구 · 전역        │  M3. Genesis Memory (시스템 기억)      │
                    │  검증된 패턴 · 질문 은행 · 템플릿 개정판  │
                    │  헌법 개정 이력 · 프로세스 개선 기록      │
                    └──────────────△──────────────────────┘
                            승격 (Handoff/회고 시 추출)
                    ┌──────────────┴──────────────────────┐
  프로젝트 수명 주기  │  M2. Project Memory (프로젝트 기억)    │
                    │  결정사항 · 질문-답변 로그 · 제약조건     │
                    │  페르소나 · 용어 정의 · 문서 버전 이력    │
                    └──────────────△──────────────────────┘
                            정착 (세션 종료 시 구조화 저장)
                    ┌──────────────┴──────────────────────┐
  대화 세션 동안     │  M1. Session Memory (작업 기억)        │
                    │  진행 중인 질문 세션의 실시간 컨텍스트    │
                    └─────────────────────────────────────┘
```

### M1. Session Memory — 작업 기억
현재 질문 세션의 실시간 대화 컨텍스트. 세션이 끝나면 원시 대화는 버려도 되지만, **결정사항은 반드시 M2로 정착**시킨다. "대화는 휘발되어도 결정은 휘발되지 않는다."

### M2. Project Memory — 프로젝트 기억
프로젝트의 모든 확정 사실의 저장소: 제품 정의, 사용자, 범위 결정, 기각된 대안과 그 이유, 용어 정의. 이후 모든 단계의 AI 호출에 **구조화 요약으로 주입**된다 (전체 대화 재전송 금지 — 비용·품질 모두의 문제). 이것이 "며칠 뒤 돌아와도 이어서 진행"을 가능하게 하는 실체다.

### M3. Genesis Memory — 시스템 기억
프로젝트를 초월해 Genesis OS 자체에 축적되는 지식:

| 자산 | 예시 |
|---|---|
| **질문 은행** | "이 유형의 제품에서 반드시 물어야 했던 질문" — 효과가 검증된 질문이 기본 질문 세트로 승격 |
| **패턴 라이브러리** | 반복 등장하는 설계 패턴 (예: "1인 MVP + 멀티유저 대비 RLS" 패턴) |
| **템플릿 개정판** | 프로젝트 경험으로 개선된 문서 템플릿·프롬프트 |
| **실패 기록** | 재작업을 유발한 설계 누락 — 다음 프로젝트의 체크리스트가 됨 |
| **헌법·프로세스 개정 이력** | 시스템 자체의 진화 기록 |

### 승격 규칙
- M1 → M2: 세션 종료 시 자동 (엔진의 의무)
- M2 → M3: Handoff 완료·회고 시점에 추출. MVP에서는 PO가 수동 승격, V2에서 AI가 승격 후보를 제안
- 하향 주입: 새 프로젝트 시작 시 M3의 질문 은행·패턴이 기본값으로 로드 — **새 프로젝트는 절대 백지에서 시작하지 않는다**

## 8. Genesis Flywheel

Genesis OS의 성장 엔진. 제품을 하나 설계할 때마다 시스템이 강해지고, 강해진 시스템이 다음 제품을 더 빠르고 깊게 설계하는 자기강화 순환이다.

```
        ① 설계 (Design a Product)
        아이디어가 5단계 파이프라인을 통과
                 │
                 ▼
        ② 구현·검증 (Build & Verify)
        Handoff 패키지로 Claude Code/Cursor가 구현
                 │
                 ▼
        ③ 피드백 (Feedback)
        구현 중 드러난 설계 누락·재작업·좋았던 결정을 회수
                 │
                 ▼
        ④ 지식 승격 (Promote to Genesis Memory)
        질문 은행·패턴·템플릿·체크리스트로 자산화
                 │
                 ▼
        ⑤ 시스템 개선 (Evolve the OS)
        프롬프트·프로세스·문서 템플릿 개정
                 │
                 └──────► ①로 복귀: 다음 제품은 더 빠르고, 더 깊고,
                          더 적은 재작업으로 설계된다
```

### Flywheel의 특성

1. **첫 회전이 가장 무겁다.** Dogfooding Cycle #1(본 PRD)이 첫 회전이며, 이후 매 회전마다 가속된다.
2. **바퀴를 돌리는 것은 제품 출시다.** Flywheel의 연료는 이론이 아니라 L6 Ecosystem의 실제 제품 — Occupation Flow, OTHUB, ORION, Link IT가 회전할 때마다 바퀴에 힘을 더한다.
3. **③ 피드백 없는 회전은 공회전이다.** Handoff 후 구현 피드백을 회수하는 절차(회고)는 선택이 아니라 파이프라인의 일부다.

### Flywheel 측정 지표

| 지표 | 의미 | 기대 방향 |
|---|---|---|
| 설계 사이클 타임 | 아이디어 입력 → Handoff 소요 시간 | 제품마다 감소 |
| 재작업률 | 구현 중 설계 문서로 되돌아온 횟수 | 제품마다 감소 |
| Genesis Memory 자산 수 | 질문 은행·패턴·체크리스트 항목 수 | 제품마다 증가 |
| 재사용률 | 새 프로젝트에서 M3 자산이 적용된 비율 | 제품마다 증가 |

> Flywheel 지표는 MVP에서 수동 기록으로 시작하고(측정 자체가 회고의 일부), V1에서 대시보드에 시각화한다.

---

# Part III. Product Specification

## 9. Core Concept: Product Engineering Engine

### 9.1 5단계 파이프라인

```
Discover → Define → Design → Engineer → Handoff
```

| 단계 | 목적 | 산출물 |
|---|---|---|
| **1. Discover** | 문제 정의, 사용자 분석, 가치 제안, 성공 지표 정의 | Discovery Brief (문제·사용자·가치·지표) |
| **2. Define** | PRD 작성, 기능 우선순위(MoSCoW), User Story, 요구사항 | `PRD.md`, `Roadmap.md` |
| **3. Design** | IA, User Flow, UX, Wireframe, Design System | `IA.md`, `UX.md` |
| **4. Engineer** | 기술 아키텍처, 데이터 모델, API 명세, 권한 모델, AI Workflow, 개발 태스크 | `Architecture.md`, `API.md`, Task List |
| **5. Handoff** | 구현 도구로 인계 + **구현 피드백 회수 예약 (Flywheel ③)** | Handoff Package (CLAUDE.md + 전체 문서 + 태스크 + 구현 프롬프트) |

**Definition of Done:** "개발이 바로 시작될 수 있는 수준의 설계 산출물"이 생성되면 해당 프로젝트의 Genesis OS 사이클이 완료된다.

**책임 경계 (MVP 원칙):** 코드 생성·자동 구현·출시 후 운영은 Genesis OS의 범위가 아니다 (헌법 제1조). Genesis OS는 설계까지, 구현은 Claude Code / Cursor / GitHub Copilot / Figma / 개발팀이 담당한다.

### 9.2 AI 인터랙션 모델

엔진의 각 단계는 헌법 제2장(제4~8조)을 프롬프트 체계의 하드 제약으로 내장한다. 본 PRD를 생성한 대화가 이 모델의 골든 레퍼런스다.

### 9.3 엔진 구현 원칙

헌법 제9조(Engine/Interface 분리)에 따라, 엔진(파이프라인 로직, 프롬프트 템플릿, 산출물 스키마, Memory System)은 웹앱 UI와 독립된 계층으로 구현한다. MVP에서는 Next.js API Route 계층으로 분리하며, 이는 L5 인터페이스 확장(MCP Server / CLI / Claude Skill)의 전제 조건이다.

## 10. Features — MoSCoW (MVP 기준)

### Must (없으면 MVP가 아님)

| ID | 기능 | 설명 | DNA 근거 |
|---|---|---|---|
| M1 | 프로젝트 생성·관리 | 제품 아이디어를 프로젝트로 등록, 포트폴리오 목록·상태 조회 | L6 |
| M2 | 5단계 파이프라인 상태 머신 | 프로젝트별 Discover→Handoff 단계 진행, 단계별 완료 조건 체크 | L4 |
| M3 | AI 질문 세션 | 단계별 우선순위 질문을 한 번에 하나씩 제시, 답변 반영형 대화 | 헌법 제4~6조 |
| M4 | Session→Project Memory | 질문-답변·결정사항을 구조화 저장(M1→M2 정착), 이후 모든 단계의 AI 컨텍스트로 자동 주입 | §7 M1·M2 |
| M5 | 문서 생성 | 표준 6종 Markdown 문서(PRD·IA·UX·Architecture·API·Roadmap) AI 생성 | 헌법 제10조 |
| M6 | 문서 편집·저장 | Markdown 에디터, Supabase 저장, 프로젝트별 문서 관리 | L1 |
| M7 | Handoff 패키지 export | CLAUDE.md + 전체 문서 + 개발 태스크 + 구현 시작 프롬프트를 zip/복사로 내보내기 | L4 |
| M8 | 인증 | Supabase Auth 단일 계정, 전 테이블 user_id 기반 RLS | L1 |
| M9 | AI Provider Adapter | Claude API 기본, provider 교체 가능한 어댑터 계층 | L1 |

### Should (MVP에 있으면 좋음, 없어도 성립)

| ID | 기능 | 설명 | DNA 근거 |
|---|---|---|---|
| S1 | 문서 버전 히스토리 | 문서 수정 이력 저장, 이전 버전 조회 | §7 M2 |
| S2 | 파이프라인 대시보드 | 포트폴리오 전체의 단계별 진행 현황 시각화 | L6 |
| S3 | MoSCoW 보드 | Define 단계에서 기능 우선순위를 드래그로 관리 | 헌법 제7조 |
| S4 | 프롬프트 템플릿 관리 | 단계별 질문·생성 프롬프트를 UI에서 열람·수정 | L2 |
| S5 | 첨부파일 | 참고자료(스케치, 문서)를 Supabase Storage에 프로젝트별 저장 | L1 |
| S6 | 회고 기록 | Handoff 후 구현 피드백을 프로젝트에 수동 기록 (Flywheel ③의 최소 구현) | §8 |

### Could (여유 시)

| ID | 기능 | 설명 | DNA 근거 |
|---|---|---|---|
| C1 | GitHub export | Handoff 패키지를 GitHub 저장소로 직접 push | L5 |
| C2 | 산출물 품질 체크리스트 | DoD 충족 여부를 AI가 자동 검증 | L4 |
| C3 | 문서 diff 뷰 | 버전 간 변경사항 비교 | §7 M2 |
| C4 | Genesis Memory 수동 승격 | 회고에서 질문·패턴을 M3로 승격하는 최소 UI | §7 M3 |

### Won't (MVP에서 명시적으로 하지 않음)

| ID | 기능 | 재검토 시점 |
|---|---|---|
| W1 | 코드 생성·자동 구현 | 영구 범위 외 (헌법 제1조) |
| W2 | 멀티유저·팀 협업·온보딩 | Version 2 |
| W3 | 과금·구독 | 공개 SaaS 결정 시 (Future) |
| W4 | MCP Server / CLI / Extensions / GPT | Version 2 (헌법 제9조로 준비만 해둠) |
| W5 | 출시 후 운영 지표·회고 추적 자동화 | Version 2 검토 |
| W6 | Genesis Memory 자동 승격 (AI 제안) | Version 2 |

## 11. Core User Stories (MVP)

1. **프로젝트 시작** — PO로서, 새 제품 아이디어를 한 문단으로 입력하면 Discover 세션이 시작되어, 아이디어를 잊기 전에 구조화된 설계 프로세스에 올릴 수 있다.
2. **질문 세션** — PO로서, AI가 WHY/WHAT/HOW와 함께 우선순위 질문을 하나씩 던지고 내 답변이 다음 질문에 반영되므로, 혼자서는 놓쳤을 제품 결정사항을 빠짐없이 확정할 수 있다.
3. **문서 생성** — PO로서, 단계가 완료되면 축적된 컨텍스트로 표준 문서가 자동 생성되어, 백지에서 문서를 쓰는 부담 없이 검토·수정만 하면 된다.
4. **컨텍스트 연속성** — PO로서, 며칠 뒤 다시 접속해도 프로젝트의 모든 결정사항이 보존되어 있어, 어느 단계에서든 이어서 진행할 수 있다.
5. **핸드오프** — PO로서, Engineer 단계가 끝나면 Handoff 패키지를 내려받아 Claude Code에 붙여넣는 것만으로 구현을 시작할 수 있다.
6. **회고와 축적** — PO로서, 구현 중 발견한 설계 누락을 프로젝트에 기록해 두면, 다음 제품 설계 때 같은 실수를 반복하지 않는다 (Flywheel의 최소 동작).

## 12. Success Metrics

### MVP 성공 기준 — Dogfooding Cycle 완주 (헌법 제12조)

Genesis OS는 자기 자신을 첫 파일럿으로 삼는다. 아래 순환이 한 번 완성되면 핵심 프로세스가 검증된 것으로 간주한다.

- [x] **1. Genesis OS로 Genesis OS의 PRD를 작성한다** ← 본 문서 (수동 프로세스로 Cycle #1 진행 중)
- [x] 2. 생성된 PRD 기반으로 IA · UX · Architecture를 설계한다 ← IA.md · UX.md · Architecture.md · API.md · tasks.md
- [x] 3. 개발 가능한 수준의 산출물(Handoff 패키지)을 생성한다 ← CLAUDE.md · docs 5종 · tasks.md · START_PROMPT.md
- [ ] 4. Claude Code 또는 Cursor로 실제 구현을 시작한다
- [ ] 5. 구현 결과를 다시 Genesis OS에 피드백하여 PRD와 프로세스를 개선한다 (Flywheel 첫 회전 완료)

### 외부 검증 (MVP 이후 즉시)

- [ ] **OTHUB**를 Genesis OS(웹앱)로 Discover→Handoff 완주 — 범용성 확인 (Flywheel 두 번째 회전)

### 운영 지표 (검증 사이클에서 측정 시작 — §8 Flywheel 지표와 연동)

| 지표 | 목표 |
|---|---|
| 아이디어 입력 → Handoff 패키지 생성 소요 | ≤ 5일 (1인 파트타임 기준) |
| Handoff 패키지 수정 없이 구현 착수 가능 여부 | 재작업 없이 착수 |
| 세션 재개 시 컨텍스트 손실 | 0건 |

## 13. Technical Overview

> 상세 설계는 `Architecture.md`(Engineer 단계 산출물)에서 확정. 여기서는 PRD 수준의 결정사항만 기록한다.

### 확정 스택 (L1 Foundation)

| 계층 | 기술 |
|---|---|
| Frontend | Next.js 15 App Router · React · TypeScript · Tailwind CSS · shadcn/ui |
| Backend / DB | Supabase (PostgreSQL · Auth · RLS · Storage) |
| AI Layer | AI Provider Adapter (Claude API 기본, OpenAI 교체 가능) · Prompt Template Engine · Knowledge & Memory System |
| Document | Markdown 기반 6종 산출물 |
| Deployment | Vercel |

### 개발 규칙 (Global Profile 준수)

- TypeScript `any` 금지 — 도메인 타입 명시 (`Project`, `PipelinePhase`, `GenesisDocument`, `ContextEntry`, `HandoffPackage`, `MemoryAsset`)
- Server Component 기본, `'use client'`는 상태 필요 시만
- RLS 전 테이블 기본 활성화
- 환경변수 `NEXT_PUBLIC_` prefix는 클라이언트 노출 시만

### 핵심 데이터 모델 (개요)

```
users ─┬─ projects ─┬─ project_phases      (단계 상태·완료조건)
       │            ├─ context_entries     (질문·답변·결정사항 = M2 Project Memory)
       │            ├─ documents           (type: prd|ia|ux|architecture|api|roadmap, 버전)
       │            ├─ attachments         (Storage 연결)
       │            ├─ retrospectives      (구현 피드백 = Flywheel ③, S6)
       │            └─ handoff_packages
       ├─ prompt_templates   (단계별 질문·생성 프롬프트 = L2 실행형)
       └─ memory_assets      (질문 은행·패턴·체크리스트 = M3 Genesis Memory, V1 본격화)
```

## 14. Release Roadmap

| 버전 | 범위 | 검증 |
|---|---|---|
| **MVP** | Web App: Must 전체(M1–M9) + 여력 시 Should(S6 회고 우선) | Dogfooding Cycle 완주 → OTHUB 설계 완주 |
| **Version 1** | Should/Could 완성: 버전 히스토리, 대시보드, MoSCoW 보드, GitHub export, 프롬프트 템플릿 UI, **Genesis Memory 승격(M3 계층 본격화)** | Link IT, ORION 등 포트폴리오 제품 설계에 상시 사용, Flywheel 지표 대시보드 |
| **Version 2** | 엔진 인터페이스 확장: MCP Server, Claude Skill, CLI · 소규모 멀티유저 베타 (RLS 이미 준비됨) · Memory 자동 승격 제안 | 외부 협업자 1~3인 사용 |
| **Future** | 공개 SaaS 검토 (과금·온보딩), ChatGPT GPT, Cursor/VS Code Extension, 출시 후 운영 추적 | 시장 검증 |

## 15. Risks & Constraints

| 리스크 | 영향 | 완화 |
|---|---|---|
| 엔진 로직이 웹앱 UI에 결합됨 | V2 인터페이스 확장 불가 | 헌법 제9조 + 계층 규칙 1을 Architecture.md에서 강제 |
| AI 질문 품질이 프로세스 가치를 결정 | 질문이 얕으면 산출물도 얕음 | 본 PRD 생성 세션을 골든 레퍼런스로 프롬프트 설계, 프롬프트를 데이터로 관리(S4), 질문 은행으로 지속 개선(§7 M3) |
| LLM API 비용 | 긴 컨텍스트 세션 반복 시 비용 증가 | M2 Memory를 구조화 요약으로 주입(전체 대화 재전송 금지), 프롬프트 캐싱 활용 |
| 1인 개발 리소스 | MVP 범위 초과 시 미완성 위험 | Must 9개로 엄격 제한, Should 이하는 Dogfooding 완주 후 |
| Dogfooding의 자기참조 함정 | 자기 자신만 잘 설계하는 도구가 될 위험 | OTHUB 외부 검증을 MVP 성공 기준에 포함 |
| Flywheel 공회전 | 회고 없이 제품만 찍어내면 시스템이 성장하지 않음 | 회고(S6)를 Handoff 단계의 공식 절차로 정의, 승격 규칙 명문화(§7) |
| DNA의 문서화 함정 | 헌법·계층이 선언에 그치고 코드에 반영되지 않을 위험 | 헌법 조항을 프롬프트 하드 제약·엔진 검증 규칙으로 구현 (계층 규칙 2), 위반은 버그로 취급 (제13조) |

## 16. Open Questions (다음 단계에서 결정)

1. ~~질문 세션의 UI 형태~~ — **결정됨 (UX.md §2)**: 하이브리드 — 대화 스트림 + 구조화 답변 카드 + Decision Panel
2. ~~M2 Project Memory의 주입 전략~~ — **결정됨 (Architecture.md §5.3)**: 구조화 결정 전체 주입 + 토큰 상한 초과 시 카테고리 필터, 미정 결정은 항상 주입
3. ~~Handoff 패키지 구성과 CLAUDE.md 템플릿~~ — **결정됨 (Architecture.md §5.5)**: CLAUDE.md·docs/·tasks.md·START_PROMPT.md 4요소, CLAUDE.md 필수 5섹션
4. ~~Discovery Brief의 문서화 여부~~ — **결정됨 (IA.md §2)**: 독립 문서가 아니라 Project Memory의 구조화 뷰, PRD.md 서두로 투영 (문서 스키마 6종 고정)
5. MVP 목표 일정 — PO 확정 필요
6. M3 Genesis Memory의 스키마 — memory_assets의 타입 체계와 승격 UI (→ V1 설계 시)

## 17. Next Steps (Genesis OS Pipeline 기준)

본 PRD로 **Define 단계 완료**. 다음 산출물:

1. **Design 단계** → `IA.md` (화면 구조·내비게이션), `UX.md` (질문 세션 UX·와이어프레임)
2. **Engineer 단계** → `Architecture.md` (데이터 모델 상세·RLS 정책·엔진 계층 설계), `API.md`, 개발 태스크 목록
3. **Handoff 단계** → Claude Code용 구현 패키지 생성, 구현 착수

---

*이 문서는 Genesis OS Dogfooding Cycle #1의 산출물이며, 구현 피드백에 따라 개정된다 (Flywheel ⑤).*
