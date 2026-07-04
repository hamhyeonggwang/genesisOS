import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { initialPhaseStatuses, PHASE_ORDER } from "@/engine/pipeline";
import { DEFAULT_CHECKLIST } from "@/engine/pipeline";

export async function POST(request: Request) {
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

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";

  if (!name || !idea) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "name과 idea는 필수입니다.", retryable: false } },
      { status: 400 },
    );
  }

  const { data: project, error: projectError } = await supabase
    .from(TABLES.projects)
    .insert({ user_id: user.id, name, idea })
    .select()
    .single();

  if (projectError || !project) {
    return Response.json(
      { error: { code: "CREATE_FAILED", message: projectError?.message ?? "프로젝트 생성 실패", retryable: true } },
      { status: 500 },
    );
  }

  const statuses = initialPhaseStatuses();
  const phaseRows = PHASE_ORDER.map((phase) => ({
    user_id: user.id,
    project_id: project.id,
    phase,
    status: statuses[phase],
    checklist: DEFAULT_CHECKLIST,
  }));

  const { data: phases, error: phasesError } = await supabase
    .from(TABLES.projectPhases)
    .insert(phaseRows)
    .select();

  if (phasesError || !phases) {
    return Response.json(
      { error: { code: "CREATE_FAILED", message: phasesError?.message ?? "단계 초기화 실패", retryable: true } },
      { status: 500 },
    );
  }

  return Response.json({ project, phases }, { status: 201 });
}
