# Paper Researcher Skill

**논문 검색 → 수집 → 정리 → 분석**을 자동화하는 스킬입니다.

## 목적

- 논문 검색 효율화 (주제별 검색, 데이터베이스 활용)
- 논문 메타데이터 자동 추출
- 주제별 분류 및 정리
- 논문 요약 및 핵심 내용 추출

## 사용 흐름

1. **검색** — 주제 키워드로 논문 데이터베이스 검색 (PubMed, Google Scholar 등)
2. **수집** — PDF 다운로드, 메타데이터 정리
3. **분류** — 주제/저자별로 자동 정렬
4. **분석** — 논문 요약, 핵심 결과 추출

## 주요 기능

- 다중 데이터베이스 검색 자동화
- PDF 메타데이터 추출 (제목, 저자, 발행년 등)
- 주제별 자동 분류
- 논문 요약 생성
- 인용 형식 자동화 (APA, Vancouver 등)

## 저장 구조

```
Research/library/
├─ papers/              (PDF, 메타데이터)
├─ by-topic/            (주제별 폴더)
│  └─ [topic-name]/
│     ├─ papers.md     (논문 목록)
│     └─ summary.md    (주제별 요약)
└─ by-author/           (저자별 폴더)
   └─ [author-name]/
```

## 참고

- 논문 저장소: `Research/library/`
- 논문 작성: `Research/writing/`
- APA 형식: `Shared/skills/apa-writer/`
