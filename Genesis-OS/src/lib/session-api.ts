// 세션 API 라우트 2개(next/answer)가 공유하는 얇은 헬퍼.
// 엔진 모듈이 아니므로 Supabase/Next 의존 가능 (API 라우트 어댑터 계층).

import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/supabase/tables";
import type { ContextEntry, PhaseName, PipelinePhase } from "@/types/domain";

export const VALID_PHASES: PhaseName[] = [
  "discover",
  "define",
  "design",
  "engineer",
  "handoff",
];

export function isValidPhase(phase: string): phase is PhaseName {
  return (VALID_PHASES as string[]).includes(phase);
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  retryable = false,
) {
  return Response.json({ error: { code, message, retryable } }, { status });
}

/** 세션은 active 상태의 phase에서만 진행할 수 있다. */
export async function requireActivePhase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  projectId: string,
  phase: PhaseName,
): Promise<{ phase: PipelinePhase } | { error: Response }> {
  const { data, error } = await supabase
    .from(TABLES.projectPhases)
    .select()
    .eq("project_id", projectId)
    .eq("phase", phase)
    .single<PipelinePhase>();

  if (error || !data) {
    return { error: errorResponse(404, "NOT_FOUND", "단계를 찾을 수 없습니다.") };
  }

  if (data.status !== "active") {
    return {
      error: errorResponse(
        400,
        "INVALID_TRANSITION",
        `세션은 active 상태에서만 진행할 수 있습니다 (현재: ${data.status}).`,
      ),
    };
  }

  return { phase: data };
}

export async function fetchProjectEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  projectId: string,
): Promise<ContextEntry[]> {
  const { data } = await supabase
    .from(TABLES.contextEntries)
    .select()
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .returns<ContextEntry[]>();

  return data ?? [];
}
