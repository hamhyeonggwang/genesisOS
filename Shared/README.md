# Shared Resources

모든 도메인(Clinical, Research, Education, Development)이 함께 사용하는 공유 자산입니다.

## 구조

### skills/ — 재사용 가능한 전문성 (16개)

**Phase 1 (고우선순위)**
- `team-report-writer/` — 팀 주간/월간 보고서 자동화
- `paper-researcher/` — 논문 검색, 수집, 정리
- `design-prototyper/` — UI/UX 디자인 → 프로토타입
- `nextjs-builder/` — 앱/웹 개발

**Phase 2 & 3**
- Leadership: project-manager, decision-logger
- Design: design-system-builder, ux-reviewer
- Research: evidence-reviewer, apa-writer, data-analyst
- Clinical: icf-mapper, ot-report-writer, intervention-designer
- Cross: n8n-builder, delphi-facilitator, protocol-designer

### knowledge/ — 고정 지식 베이스

- `ot-standards/` — 한국 OT 표준, 용어
- `icf-coding/` — ICF 코딩 규칙 및 예시
- `assessment-tools/` — BOT-2, SIPT, Sensory Profile 등
- `evidence-base/` — 근거자료, 논문 요약

### commands/ — 반복 명령 (도메인별 도구)

- `/report` — Clinical 보고서 생성
- `/paper` — Research 논문 작성
- `/lecture` — Education 강의 준비
- `/deploy` — Development 배포

### templates/ — 재사용 템플릿

- Clinical: 평가 보고서, 중재 계획, 퇴원 요약
- Research: 논문 작성, 문헌 검토 양식
- Education: 강의계획서, 슬라이드 템플릿
- Development: API 명세, n8n 워크플로우
