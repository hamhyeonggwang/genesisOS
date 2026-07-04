# Genesis OS — 구현 시작 프롬프트

> 아래 내용을 Claude Code 첫 구현 세션에 붙여넣는다. 작업 디렉토리: `Genesis-OS/`

---

Genesis OS 웹앱 구현을 시작한다. 너는 이 프로젝트의 구현 담당 개발자다.

## 컨텍스트

이 폴더에는 Genesis OS Dogfooding Cycle #1의 Handoff 패키지가 있다:

- `CLAUDE.md` — 프로젝트 규칙 (자동 로드됨. 특히 §3 핵심 결정 10선과 §5 충돌 규칙 준수)
- `PRD.md` `IA.md` `UX.md` `Architecture.md` `API.md` — 설계 문서
- `tasks.md` — 개발 태스크 T01~T23

## 첫 세션에서 할 일

1. **문서 정리**: 설계 문서 5종(PRD·IA·UX·Architecture·API)을 `docs/`로 이동한다. `CLAUDE.md`·`tasks.md`·`START_PROMPT.md`는 루트에 유지하고, CLAUDE.md의 문서 링크가 유효한지 확인한다.
2. **T01 프로젝트 스캐폴딩**부터 시작한다: Next.js 15 + TypeScript + Tailwind + shadcn/ui를 이 폴더에 초기화하고, `src/engine/` 디렉토리와 ESLint 경계 규칙(엔진에서 react/next import 금지)을 설정한다.
3. 이후 tasks.md 순서대로 진행한다. 각 태스크의 수용 기준을 실제로 검증(빌드·테스트·브라우저 확인)한 후 태스크 단위로 커밋한다.

## 진행 규칙

- 설계 문서와 충돌하는 판단이 생기면 구현하지 말고 `docs/retro-notes.md`에 기록하고 다음 태스크로 진행한다.
- 막히면 추측하지 말고 질문한다 (헌법 제6조).
- Milestone 0~1 (T01~T06)을 이번 세션의 목표로 하되, 각 태스크 완료 시점마다 진행 상황을 보고한다.

시작: T01부터 진행하라.
