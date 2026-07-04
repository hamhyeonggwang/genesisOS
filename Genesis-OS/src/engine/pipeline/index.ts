// 파이프라인 상태 머신 (M2) — docs/Architecture.md §5.1
// 엔진 모듈이므로 react/next 의존성 금지. Supabase 호출도 하지 않는다 (순수 로직).

import type {
  ChecklistItem,
  PhaseName,
  PhaseStatus,
} from "@/types/domain";

export const PHASE_ORDER: PhaseName[] = [
  "discover",
  "define",
  "design",
  "engineer",
  "handoff",
];

export function nextPhase(phase: PhaseName): PhaseName | null {
  const i = PHASE_ORDER.indexOf(phase);
  return i >= 0 && i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : null;
}

export function phaseOrderIndex(phase: PhaseName): number {
  return PHASE_ORDER.indexOf(phase);
}

export class PipelineTransitionError extends Error {
  constructor(
    public readonly from: PhaseStatus,
    public readonly to: PhaseStatus,
  ) {
    super(`Invalid phase transition: ${from} -> ${to}`);
    this.name = "PipelineTransitionError";
  }
}

const ALLOWED: Record<PhaseStatus, PhaseStatus[]> = {
  locked: ["active"],
  active: ["in_review"],
  in_review: ["done"],
  done: ["stale"],
  stale: ["done"],
};

/** 요청된 전이가 허용되는지 검증한다. 허용되지 않으면 던진다 (API가 400으로 매핑). */
export function assertTransition(from: PhaseStatus, to: PhaseStatus): void {
  if (!ALLOWED[from]?.includes(to)) {
    throw new PipelineTransitionError(from, to);
  }
}

/** 신규 프로젝트의 초기 5단계: discover만 active, 나머지 locked. */
export function initialPhaseStatuses(): Record<PhaseName, PhaseStatus> {
  return {
    discover: "active",
    define: "locked",
    design: "locked",
    engineer: "locked",
    handoff: "locked",
  };
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [];
