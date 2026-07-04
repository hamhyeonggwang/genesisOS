# Genesis OS — Information Architecture

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 |
| 작성일 | 2026-07-04 |
| 상태 | Draft — Product Owner 승인 대기 |
| 상위 문서 | [PRD.md](PRD.md) v1.1 |
| 파이프라인 단계 | Design (3/5) |

---

## 1. IA 원칙

1. **파이프라인이 곧 내비게이션이다.** 프로젝트 내부의 정보 구조는 5단계 파이프라인(Discover→Handoff)을 그대로 따른다. 사용자가 "지금 어느 단계인가"를 항상 알 수 있어야 한다.
2. **Markdown is the Single Source of Truth (헌법 제10조).** 모든 화면은 Markdown 문서와 Project Memory의 투영(view)이다. 화면에만 존재하는 데이터는 없다.
3. **깊이 3 제한.** Portfolio → Project → Phase/Document. 그보다 깊은 계층은 만들지 않는다.
4. **백지 금지 (§7 M3).** 모든 진입 화면은 다음 행동을 제안한다 — 빈 목록, 빈 문서, 빈 세션 상태에서도 사용자가 무엇을 해야 할지 화면이 말해준다.

## 2. 정보 계층

```
Genesis OS
└── Portfolio (전체 프로젝트)
    └── Project (제품 1개 = 파이프라인 1회전)
        ├── Pipeline Phase ×5 (Discover · Define · Design · Engineer · Handoff)
        │   └── AI Question Session (단계당 1개 이상)
        ├── Documents ×6 (PRD · Roadmap · IA · UX · Architecture · API)
        ├── Project Memory (결정사항 · Discovery Brief 뷰)
        ├── Handoff Package
        └── Retrospective (S6)
```

**Discovery Brief의 위치 (PRD Open Question 4 결정)** — Discovery Brief는 7번째 문서가 아니라 **Project Memory의 구조화 뷰**다. Discover 단계의 결정사항(문제·사용자·가치·지표)이 Memory에 정착되고, Define 단계에서 PRD.md 서두로 자동 투영된다. 문서 스키마는 6종으로 고정 유지한다.

## 3. 화면 인벤토리 & URL 설계

| # | 화면 | URL | 목적 | MVP |
|---|---|---|---|---|
| SC-01 | 로그인 | `/login` | Supabase Auth (단일 계정) | Must |
| SC-02 | 포트폴리오 대시보드 | `/` | 전체 프로젝트 목록 + 단계 현황, 새 프로젝트 진입점 | Must (M1) |
| SC-03 | 새 프로젝트 | `/projects/new` | 아이디어 한 문단 입력 → Discover 세션 자동 시작 | Must (M1) |
| SC-04 | 프로젝트 홈 | `/projects/[id]` | 파이프라인 오버뷰: 5단계 진행 상태, 문서 목록, 다음 행동 제안 | Must (M2) |
| SC-05 | 질문 세션 | `/projects/[id]/session/[phase]` | 단계별 AI 질문 세션 (하이브리드 UI) | Must (M3·M4) |
| SC-06 | 문서 뷰/편집 | `/projects/[id]/docs/[type]` | 6종 문서의 열람·Markdown 편집 (`type: prd\|roadmap\|ia\|ux\|architecture\|api`) | Must (M5·M6) |
| SC-07 | Project Memory | `/projects/[id]/memory` | 확정 결정사항 전체 목록·검색, Discovery Brief 뷰 | Must (M4) |
| SC-08 | Handoff | `/projects/[id]/handoff` | 패키지 구성 확인 → zip 다운로드 / 클립보드 복사 | Must (M7) |
| SC-09 | 회고 | `/projects/[id]/retro` | 구현 피드백 기록 (Flywheel ③) | Should (S6) |
| SC-10 | 설정 | `/settings` | AI Provider 설정(M9), 프롬프트 템플릿 열람·수정(S4) | Must(M9) / Should(S4) |

> V1 이후 추가 예정: `/memory` (M3 Genesis Memory 전역 뷰), `/dashboard/flywheel` (Flywheel 지표).

## 4. 내비게이션 구조

### 글로벌 내비게이션 (모든 화면 상단)
```
[Genesis OS 로고 → /]   [포트폴리오]   [설정]   [계정]
```

### 프로젝트 로컬 내비게이션 (SC-04~09 공통, 파이프라인 스테퍼)
```
프로젝트명
[① Discover] ─ [② Define] ─ [③ Design] ─ [④ Engineer] ─ [⑤ Handoff]
   ✓ 완료        ● 진행 중      ○ 잠김        ○ 잠김         ○ 잠김
보조 탭: [문서] [Memory] [회고]
```

- 스테퍼의 각 단계 클릭 → 해당 단계의 세션(SC-05) 또는 완료된 단계의 산출물로 이동
- **잠김 규칙**: 이전 단계가 완료 조건을 충족해야 다음 단계가 열린다. 단, 완료된 단계는 언제든 재진입·재개정 가능 (개정 시 하위 단계에 "상위 변경됨" 배지 표시)

## 5. 화면 ↔ 데이터 모델 매핑

| 화면 | 읽기 | 쓰기 |
|---|---|---|
| SC-02 대시보드 | `projects` + `project_phases` 집계 | — |
| SC-03 새 프로젝트 | — | `projects`, `project_phases`(5행 초기화), 첫 `context_entries` |
| SC-04 프로젝트 홈 | `project_phases`, `documents` 메타 | — |
| SC-05 질문 세션 | `context_entries`(M2 주입), `prompt_templates` | `context_entries` (M1→M2 정착) |
| SC-06 문서 | `documents` | `documents` (버전 증가) |
| SC-07 Memory | `context_entries` | `context_entries` (수정·무효화) |
| SC-08 Handoff | `documents` 전체, `context_entries` | `handoff_packages` |
| SC-09 회고 | `handoff_packages` | `retrospectives` |
| SC-10 설정 | `prompt_templates`, provider 설정 | 동일 |

## 6. 상태 정의

### Phase 상태 (project_phases.status)
```
locked → active → in_review → done
                     │
                     └─ (상위 단계 개정 시) → stale
```

- `locked`: 이전 단계 미완료
- `active`: 질문 세션 진행 가능
- `in_review`: 산출물 생성됨, PO 검토 대기
- `done`: PO 승인 — 다음 단계 잠금 해제
- `stale`: 상위 단계가 개정되어 재검토 필요 (차단은 아님, 배지만)

### Document 상태
```
draft → approved → (재편집 시) draft
```

문서는 phase의 `in_review→done` 전환과 함께 `approved`로 승격된다. 모든 저장은 새 버전을 생성한다 (S1).

## 7. MVP 경계

- **MVP 화면**: SC-01~08, SC-10(Provider 설정만)
- **Should**: SC-09 회고, SC-10 템플릿 UI
- **명시적 제외 (Won't)**: 전역 Genesis Memory 화면, Flywheel 대시보드, 멀티 프로젝트 비교, 팀/공유 화면

---

*다음 문서: [UX.md](UX.md) — 핵심 플로우와 와이어프레임.*
