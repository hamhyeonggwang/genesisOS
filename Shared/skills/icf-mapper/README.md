# ICF Mapper Skill

작업치료 평가 결과를 **ICF(국제기능분류)** 코드로 자동 매핑하는 스킬입니다.

## 목적

- 평가 소견 → ICF 코드 매핑
- 문제 확인 → 체계적 분류
- 목표 설정 → ICF 기반 기능 목표

## 사용 흐름

1. **평가 데이터 입력** — BOT-2, SIPT 등 평가 결과
2. **ICF 매핑** — 신체기능(b), 활동/참여(d) 코드 할당
3. **문맥 요인 분석** — 환경 요인(e), 개인 요인 고려
4. **목표 수립** — ICF 기반 SMART 목표

## 주요 기능

- 감각운동 → ICF b1-b7 (신경근골격계, 감각기능)
- 활동/역할 → ICF d1-d9 (일상생활, 직업)
- 환경 요인 → ICF e1-e5 (지원/방해 요인)

## 참고

- ICF 코딩 규칙: `Shared/knowledge/icf-coding/`
- 한국 OT 표준: `Shared/knowledge/ot-standards/`
