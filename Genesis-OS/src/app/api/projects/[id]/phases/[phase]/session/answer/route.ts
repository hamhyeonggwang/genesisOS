import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { settle } from "@/engine/memory";
import { getProvider } from "@/engine/provider";
import { runTurn } from "@/engine/session";
import { sseResponse } from "@/lib/sse";
import {
  errorResponse,
  fetchProjectEntries,
  isValidPhase,
  requireActivePhase,
} from "@/lib/session-api";

// docs/API.md는 { question_id, answer, skipped }를 명세했으나, 별도의 "대기 중
// 질문" 저장 테이블이 없어 question_id로 서버가 원문을 복원할 수 없다. 클라이언트가
// 방금 받은 question/category를 그대로 되돌려주는 방식으로 구현한다 (Architecture.md
// §5.2 settle() 입력과 1:1 대응). tasks.md T09에 이 결정을 기록한다.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; phase: string }> },
) {
  const { id: projectId, phase } = await params;

  if (!isValidPhase(phase)) {
    return errorResponse(400, "INVALID_INPUT", `알 수 없는 phase: ${phase}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
  }

  const check = await requireActivePhase(supabase, projectId, phase);
  if ("error" in check) return check.error;

  const body = await request.json();
  const question = typeof body.question === "string" ? body.question : null;
  const category = typeof body.category === "string" ? body.category : null;
  const answer = typeof body.answer === "string" ? body.answer : null;
  const skipped = body.skipped === true;

  if (!question || !category) {
    return errorResponse(400, "INVALID_INPUT", "question과 category는 필수입니다.");
  }

  const settled = settle({ phase, question, answer, category, skipped });

  const { error: insertError } = await supabase.from(TABLES.contextEntries).insert({
    user_id: user.id,
    project_id: projectId,
    phase: settled.phase,
    question: settled.question,
    answer: settled.answer,
    decision: settled.decision,
    category: settled.category,
    status: settled.status,
  });

  if (insertError) {
    return errorResponse(500, "CREATE_FAILED", insertError.message, true);
  }

  const entries = await fetchProjectEntries(supabase, projectId);
  const provider = getProvider();

  return sseResponse(runTurn({ phase, entries, provider }));
}
