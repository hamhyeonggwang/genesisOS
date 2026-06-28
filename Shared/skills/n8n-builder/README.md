# n8n Builder Skill

**n8n 자동화 워크플로우**를 설계하고 구축하는 스킬입니다.

## 목적

- 반복 업무 자동화 (주간 보고서, 문헌 정리 등)
- 도메인 간 데이터 연동
- 에러 모니터링 및 알림

## 사용 흐름

1. **업무 분석** — 반복 작업 식별
2. **워크플로우 설계** — n8n 노드 구성
3. **연동 설정** — API, Supabase, Google Sheets 등
4. **테스트 & 배포** — 에러 핸들링, 스케줄 설정

## 주요 기능

- Trigger: 일정, Webhook, 수동 실행
- Nodes: 데이터 처리, API 호출, 조건 분기
- Error Trigger + Slack 알림
- 로그 기록 및 모니터링

## 사용 사례

- **[Clinical] Weekly Report** — 매주 월요일 클라이언트별 진행 요약
- **[Research] Literature Summary** — 매주 새 논문 요약 생성
- **[Education] Lecture Prep** — 강의 전 체크리스트 자동 생성

## 참고

- n8n 워크플로우: `Development/workflows/n8n/`
- n8n 문서: https://docs.n8n.io
- 에러 핸들링: Error Trigger + 알림 필수
