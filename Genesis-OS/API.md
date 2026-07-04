# Genesis OS — API Specification

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 |
| 작성일 | 2026-07-04 |
| 상태 | Draft — Product Owner 승인 대기 |
| 상위 문서 | [Architecture.md](Architecture.md) v1.0 |
| 파이프라인 단계 | Engineer (4/5) |

---

## 1. 설계 원칙

1. **엔진 실행만 API로.** 단순 CRUD 조회는 Supabase 클라이언트 + RLS로 직접 수행한다. API Route는 AI 실행, 상태 전이, 패키지 생성 등 엔진 로직 전용이다.
2. **V2 호환.** 이 API 표면이 그대로 MCP Server 도구·CLI 명령의 기반이 된다. 인터페이스 특화 로직(리다이렉트, 쿠키 등)을 엔진 응답에 섞지 않는다.
3. **인증.** 전 엔드포인트는 Supabase 세션 필수 (미들웨어에서 검증). 401/403 표준 응답.
4. **에러 포맷.** `{ error: { code: string, message: string, retryable: boolean } }`

## 2. 엔드포인트

### 프로젝트

#### `POST /api/projects`
프로젝트 생성 + 5개 phase 초기화 + Discover 세션 준비.
```jsonc
// Request
{ "name": "OTHUB", "idea": "작업치료사를 위한 교육 플랫폼..." }
// Response 201
{ "project": { "id": "...", "name": "OTHUB" },
  "phases": [ { "phase": "discover", "status": "active" }, ... ] }
```

### 질문 세션 (SC-05)

#### `POST /api/projects/:id/phases/:phase/session/next`
다음 질문 생성 (세션 시작·재개 공용). **SSE 스트리밍.**
```jsonc
// Request (재개 시 body 없음)
{}
// SSE 이벤트 순서
// event: resume_summary  → { "decisions_count": 12, "summary": "..." }   (재개 시)
// event: question_delta  → { "text": "..." }                             (스트리밍)
// event: question        → 완성된 구조화 질문 (아래 스키마)
// event: phase_complete  → { "summary": "...", "unresolved": [...] }     (완료 조건 충족 시)
```
```jsonc
// question 스키마 (Architecture.md §5.2)
{ "id": "q_...", "question": "MVP 사용자는 누구입니까?",
  "why": "...", "what": "...", "how": "...",
  "category": "users",
  "options": [ { "label": "...", "description": "...", "recommended": true } ] }
```

#### `POST /api/projects/:id/phases/:phase/session/answer`
답변 제출 → 결정 정착 → 다음 질문 스트리밍 (위와 동일한 SSE).
```jsonc
{ "question_id": "q_...", "answer": "MVP는 나만...", "skipped": false }
// skipped: true → context_entries에 status: 'pending'으로 기록
```

### 결정 (Decision Panel)

#### `PATCH /api/context-entries/:id`
결정 수정 또는 무효화. 수정 시 기존 행을 `invalidated` 처리하고 새 행 insert (append-only).
```jsonc
{ "action": "revise", "answer": "수정된 답변..." }   // 또는 { "action": "invalidate" }
// Response: { "entry": {...}, "affects_downstream": true }  → UI가 stale 배지 판단
```

### 문서

#### `POST /api/projects/:id/phases/:phase/generate`
단계 산출물 생성 (Define→prd·roadmap 등). 문서별 순차 생성, **SSE 스트리밍**.
```jsonc
// SSE: event: doc_start {type} → doc_delta {text} → doc_saved {document_id, version}
// 전체 완료: event: generation_complete → phase status = 'in_review'
```

#### `POST /api/documents/:id/regenerate-section`
부분 재생성 (Should — C 마일스톤).
```jsonc
{ "heading": "## 5. Success Metrics", "instruction": "지표를 더 측정 가능하게" }
```

#### `PUT /api/documents/:id`
사용자 편집 저장 → 새 버전 생성.
```jsonc
{ "content_md": "# ..." }
// Response: { "version": 4, "source": "user_edited" }
```

### 단계 전이

#### `POST /api/projects/:id/phases/:phase/approve`
`in_review → done` + 다음 phase `locked → active` + 해당 문서 `approved`.
```jsonc
// Response 200: { "phase": "define", "status": "done", "next_phase": "design" }
// 미정 결정 존재 시 Response 200에 경고 포함 (차단하지 않음 — UX.md §7):
{ "warning": { "pending_decisions": [ { "id": "...", "question": "가격 정책..." } ] } }
```

#### `POST /api/projects/:id/phases/:phase/reopen`
완료된 단계 재개정. 하위 done 단계들을 `stale`로 전환.

### Handoff

#### `POST /api/projects/:id/handoff`
패키지 생성 (CLAUDE.md·tasks.md·START_PROMPT 생성 — AI 호출 포함).
```jsonc
// Response 201: { "package_id": "...", "preview": { "claude_md": "...", ... } }
```

#### `GET /api/handoff/:packageId/download`
zip 스트림 응답 (`Content-Type: application/zip`).

### 회고 (S6)

#### `POST /api/projects/:id/retrospectives`
```jsonc
{ "went_well": "...", "design_gaps": "...", "new_questions": "..." }
```

## 3. 직접 조회 (API를 만들지 않는 것)

아래는 Supabase 클라이언트 + RLS로 직접 조회한다 — API Route 금지가 아니라 **불필요**:

| 화면 | 쿼리 |
|---|---|
| SC-02 대시보드 | `projects` + `project_phases` join |
| SC-04 프로젝트 홈 | `project_phases`, `documents` 메타 |
| SC-06 문서 열람 | `documents` + 최신 `document_versions` |
| SC-07 Memory | `context_entries` (status/category 필터) |

## 4. 상태 코드 규약

| 코드 | 사용 |
|---|---|
| 200 / 201 | 성공 / 생성 |
| 400 | 잘못된 전이 (예: locked phase에 세션 요청) — `code: 'INVALID_TRANSITION'` |
| 401 | 미인증 |
| 409 | 동시 편집 충돌 (문서 버전 불일치) — `code: 'VERSION_CONFLICT'` |
| 429 | AI provider rate limit — `retryable: true` |
| 502 | AI provider 오류 — `retryable: true` |
