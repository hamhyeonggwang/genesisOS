import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { assertTransition, nextPhase, PipelineTransitionError } from "@/engine/pipeline";
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

  try {
    assertTransition(current.status, "done");
  } catch (e) {
    if (e instanceof PipelineTransitionError) {
      return Response.json(
        { error: { code: "INVALID_TRANSITION", message: e.message, retryable: false } },
        { status: 400 },
      );
    }
    throw e;
  }

  const { data: updated, error: updateError } = await supabase
    .from(TABLES.projectPhases)
    .update({ status: "done", approved_at: new Date().toISOString() })
    .eq("id", current.id)
    .select()
    .single();

  if (updateError || !updated) {
    return Response.json(
      { error: { code: "UPDATE_FAILED", message: updateError?.message ?? "승인 실패", retryable: true } },
      { status: 500 },
    );
  }

  const next = nextPhase(phase as PhaseName);
  let unlockedNext = null;

  if (next) {
    const { data: nextRow } = await supabase
      .from(TABLES.projectPhases)
      .select()
      .eq("project_id", projectId)
      .eq("phase", next)
      .single();

    if (nextRow?.status === "locked") {
      const { data: nextUpdated } = await supabase
        .from(TABLES.projectPhases)
        .update({ status: "active" })
        .eq("id", nextRow.id)
        .select()
        .single();
      unlockedNext = nextUpdated;
    }
  }

  return Response.json({ phase: updated, next_phase: unlockedNext });
}
