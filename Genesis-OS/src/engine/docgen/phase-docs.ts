// 단계 → 생성 문서 매핑 (docs/PRD.md §9.1 5단계 파이프라인 표)
// discover·handoff는 6종 문서에 속하지 않는다 (Discovery Brief는 IA.md §2 결정에 따라
// Memory의 뷰일 뿐 별도 문서가 아니며, handoff 산출물은 Milestone 4의 Handoff 패키지).

import type { DocType, PhaseName } from "@/types/domain";

export const PHASE_DOC_TYPES: Record<PhaseName, DocType[]> = {
  discover: [],
  define: ["prd", "roadmap"],
  design: ["ia", "ux"],
  engineer: ["architecture", "api"],
  handoff: [],
};

/** PHASE_DOC_TYPES의 역매핑 — 문서가 어느 단계에 속하는지 (승인 버튼 등에서 사용). */
export const DOC_TYPE_PHASE: Record<DocType, PhaseName> = {
  prd: "define",
  roadmap: "define",
  ia: "design",
  ux: "design",
  architecture: "engineer",
  api: "engineer",
};

export const DOC_TITLES: Record<DocType, string> = {
  prd: "PRD",
  roadmap: "Roadmap",
  ia: "IA",
  ux: "UX",
  architecture: "Architecture",
  api: "API",
};

export const DOC_INSTRUCTIONS: Record<DocType, string> = {
  prd:
    "Vision, Problem Statement, Target Users, Value Proposition, 핵심 기능을 " +
    "MoSCoW(Must/Should/Could/Won't)로 정리한 PRD를 작성하라.",
  roadmap:
    "확정된 결정을 근거로 MVP / Version 1 / Version 2 / Future 범위를 구분한 " +
    "로드맵을 작성하라.",
  ia:
    "필요한 화면 목록, 각 화면의 목적, 내비게이션 구조를 정리한 정보 구조(IA) " +
    "문서를 작성하라. 이미 승인된 PRD의 기능 범위를 벗어나지 말 것.",
  ux:
    "핵심 사용자 플로우 2~4개와 각 플로우의 주요 인터랙션을 정리한 UX 문서를 " +
    "작성하라. 승인된 IA의 화면 구조를 전제로 할 것.",
  architecture:
    "기술 스택, 핵심 데이터 모델(테이블 개요), 시스템 구성을 정리한 기술 " +
    "아키텍처 문서를 작성하라. 승인된 IA·UX의 화면·플로우를 구현 가능한 " +
    "구조로 번역할 것.",
  api:
    "핵심 엔드포인트 목록(메서드·경로·목적)을 정리한 API 명세를 작성하라. " +
    "승인된 Architecture의 데이터 모델을 전제로 할 것.",
};
