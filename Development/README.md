# Development Domain

AI 개발, 자동화, 인프라 영역입니다.

## 구조

- **projects/** — 개발 프로젝트 (Next.js, GAS 등)
- **workflows/** — n8n 워크플로우, GitHub Actions 자동화
- **docs/** — 아키텍처, 개발 표준, 배포 가이드
- **.claude/** — 개발 도메인 설정 (settings.json)
- **memory/** — 개발 작업 피드백 및 규칙

## 빠른 시작

- `Ctrl+D` — `/deploy` 배포 자동화
- projects/[project-name]/ 생성:
  - Next.js App: `next-app/`
  - Supabase: `supabase/`
  - API: `api/`

## 참고

- Next.js 개발: `Shared/skills/nextjs-builder/`
- n8n 자동화: `Shared/skills/n8n-builder/`
- GAS 개발: `Shared/skills/gas-architect/`
- 아키텍처: 이 폴더의 docs/

## 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- n8n
- Vercel
