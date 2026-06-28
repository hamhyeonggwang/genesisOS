# Next.js Builder Skill

**Next.js 15 App Router** 기반 웹앱/앱을 빠르게 구축하는 스킬입니다.

## 목적

- Occupation Flow AI OS 앱 개발
- 팀 협업 플랫폼 개발
- 빠른 프로토타이핑 및 배포

## 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript (any 금지)
- **스타일**: Tailwind CSS
- **DB**: Supabase (RLS 필수)
- **배포**: Vercel
- **API**: Claude API 연동

## 사용 흐름

1. **프로젝트 설정** — Next.js 프로젝트 생성, 환경 설정
2. **페이지 구축** — Server Components 기본, 상태 필요 시만 'use client'
3. **API 라우트** — Claude API, Supabase 연동
4. **배포** — Vercel에 자동 배포

## 개발 원칙

- TypeScript: 타입 명시 (도메인 타입 사용)
- Supabase: RLS 기본 활성화
- Next.js: Server Component 기본 사용
- 환경변수: `NEXT_PUBLIC_` prefix는 클라이언트 노출 시만
- 코드: 간결하고 명확한 구조

## 프로젝트 구조

```
projects/[project-name]/
├── next-app/
│   ├── app/              (페이지, 레이아웃)
│   ├── components/       (UI 컴포넌트)
│   ├── lib/             (유틸, 타입)
│   └── public/          (정적 자산)
├── supabase/            (DB 스키마, 마이그레이션)
└── api/                 (Claude API 통합)
```

## 참고

- 코딩 표준: `Shared/knowledge/` (준비 중)
- 아키텍처: `Development/docs/architecture.md`
- 배포: `Development/docs/deployment-guide.md`
- 디자인: `Design/` (Figma 프로젝트)
