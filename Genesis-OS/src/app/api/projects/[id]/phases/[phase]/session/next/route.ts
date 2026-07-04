import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/engine/provider";
import { buildResumeSummary, runTurn, type SessionTurnEvent } from "@/engine/session";
import { sseResponse } from "@/lib/sse";
import {
  errorResponse,
  fetchProjectEntries,
  isValidPhase,
  requireActivePhase,
} from "@/lib/session-api";
import type { PhaseName } from "@/types/domain";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; phase: string }> },
) {
  const { id: projectId, phase: phaseParam } = await params;

  if (!isValidPhase(phaseParam)) {
    return errorResponse(400, "INVALID_INPUT", `알 수 없는 phase: ${phaseParam}`);
  }
  const phase: PhaseName = phaseParam;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
  }

  const check = await requireActivePhase(supabase, projectId, phase);
  if ("error" in check) return check.error;

  const entries = await fetchProjectEntries(supabase, projectId);
  const provider = getProvider();

  async function* withResume(): AsyncGenerator<
    | { type: "resume_summary"; decisions_count: number; summary: string }
    | SessionTurnEvent
  > {
    const resume = buildResumeSummary(entries, phase);
    if (resume) {
      yield {
        type: "resume_summary",
        decisions_count: resume.decisionsCount,
        summary: resume.summary,
      };
    }
    yield* runTurn({ phase, entries, provider });
  }

  return sseResponse(withResume());
}
