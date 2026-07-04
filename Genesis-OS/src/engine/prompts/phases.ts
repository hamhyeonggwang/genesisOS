// 단계별 질문 세션의 초점 — docs/PRD.md §9.1 5단계 파이프라인 표에 대응.

import type { PhaseName } from "@/types/domain";

export const PHASE_INSTRUCTIONS: Record<PhaseName, string> = {
  discover:
    "이번 단계의 목적: 문제 정의, 사용자 분석, 가치 제안, 성공 지표 정의. " +
    "\"무엇을 만들지\"가 아니라 \"왜 만들어야 하는지\"부터 확인한다.",
  define:
    "이번 단계의 목적: PRD 작성을 위한 기능 우선순위(MoSCoW), User Story, 요구사항 확정. " +
    "Discover에서 확정된 문제·사용자·가치를 전제로 기능 범위를 좁혀간다.",
  design:
    "이번 단계의 목적: 정보 구조(IA), User Flow, UX, Wireframe, Design System 확정. " +
    "Define의 기능 범위를 화면과 흐름으로 구체화한다.",
  engineer:
    "이번 단계의 목적: 기술 아키텍처, 데이터 모델, API 명세, 권한 모델, 개발 태스크 확정. " +
    "Design의 화면·흐름을 실제로 구현 가능한 구조로 번역한다.",
  handoff:
    "이번 단계의 목적: 구현 도구(Claude Code 등)로 인계할 패키지 구성 확인과 " +
    "구현 피드백 회수 시점을 예약한다. 새로운 설계 결정을 만들지 않는다.",
};
