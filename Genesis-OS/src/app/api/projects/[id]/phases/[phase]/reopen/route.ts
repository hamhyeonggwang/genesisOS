import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { PHASE_ORDER, phaseOrderIndex } from "@/engine/pipeline";
import type { PhaseName } from "@/types/domain";

const VALID_PHASES: PhaseName[] = ["discover", "define", "design", "engineer", "handoff"];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; phase: string }> },
) {
  const { id: projectId, phase } = await params;

  if (!VALID_PHASES.includes(phase as PhaseName)) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: `알 수 없는 phase: ${phase}`, retryable: false } },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "로그인이 필요합니다.", retryable: false } },
      { status: 401 },
    );
  }

  const { data: current, error: fetchError } = await supabase
    .from(TABLES.projectPhases)
    .select()
    .eq("project_id", projectId)
    .eq("phase", phase)
    .single();

  if (fetchError || !current) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "단계를 찾을 수 없습니다.", retryable: false } },
      { status: 404 },
    );
  }

  // reopen은 "완료된 단계 재개정"이므로 done 상태에서만 허용 (docs/Architecture.md §5.1)
  if (current.status !== "done") {
    return Response.json(
      {
        error: {
          code: "INVALID_TRANSITION",
          message: `Invalid phase transition: ${current.status} -> active (reopen requires done)`,
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  const { data: reopened, error: reopenError } = await supabase
    .from(TABLES.projectPhases)
    .update({ status: "active", approved_at: null })
    .eq("id", current.id)
    .select()
    .single();

  if (reopenError || !reopened) {
    return Response.json(
      { error: { code: "UPDATE_FAILED", message: reopenError?.message ?? "재개정 실패", retryable: true } },
      { status: 500 },
    );
  }

  // 하위(다음) 단계 중 done 상태인 것들을 stale로 전환
  const targetIndex = phaseOrderIndex(phase as PhaseName);
  const downstreamPhases = PHASE_ORDER.slice(targetIndex + 1);

  const { data: staled } = await supabase
    .from(TABLES.projectPhases)
    .update({ status: "stale" })
    .eq("project_id", projectId)
    .in("phase", downstreamPhases)
    .eq("status", "done")
    .select();

  return Response.json({ phase: reopened, staled: staled ?? [] });
}
