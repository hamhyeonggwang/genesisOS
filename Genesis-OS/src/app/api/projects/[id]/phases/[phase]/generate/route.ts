import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { getProvider } from "@/engine/provider";
import { PHASE_DOC_TYPES, runDocgen, type PriorDocument } from "@/engine/docgen";
import { sseResponse } from "@/lib/sse";
import {
  errorResponse,
  fetchProjectEntries,
  isValidPhase,
  requireActivePhase,
} from "@/lib/session-api";
import type { DocType, PhaseName, Project } from "@/types/domain";

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
  const userId: string = user.id;

  const check = await requireActivePhase(supabase, projectId, phase);
  if ("error" in check) return check.error;

  const { data: projectRow } = await supabase
    .from(TABLES.projects)
    .select("*")
    .eq("id", projectId)
    .single<Project>();

  if (!projectRow) {
    return errorResponse(404, "NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }
  const project: Project = projectRow;

  const entries = await fetchProjectEntries(supabase, projectId);

  const { data: existingDocs } = await supabase
    .from(TABLES.documents)
    .select("id, type")
    .eq("project_id", projectId);

  const priorDocuments: PriorDocument[] = [];
  for (const doc of existingDocs ?? []) {
    const { data: latestVersion } = await supabase
      .from(TABLES.documentVersions)
      .select("content_md")
      .eq("document_id", doc.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle<{ content_md: string }>();

    if (latestVersion) {
      priorDocuments.push({ type: doc.type as DocType, content_md: latestVersion.content_md });
    }
  }

  const provider = getProvider();

  async function* withPersistence() {
    const docTypes = PHASE_DOC_TYPES[phase];

    if (docTypes.length === 0) {
      // discover·handoff: 생성할 문서가 없다 — 단계만 in_review로 전환
      await supabase
        .from(TABLES.projectPhases)
        .update({ status: "in_review" })
        .eq("project_id", projectId)
        .eq("phase", phase);
      yield { type: "generation_complete" as const };
      return;
    }

    for await (const event of runDocgen({
      phase,
      projectName: project.name,
      projectIdea: project.idea,
      entries,
      priorDocuments,
      provider,
    })) {
      if (event.type === "doc_start") {
        yield { type: "doc_start" as const, docType: event.docType };
      } else if (event.type === "doc_delta") {
        yield { type: "doc_delta" as const, docType: event.docType, text: event.text };
      } else if (event.type === "doc_done") {
        const { data: doc } = await supabase
          .from(TABLES.documents)
          .upsert(
            { user_id: userId, project_id: projectId, type: event.docType, status: "draft" },
            { onConflict: "project_id,type" },
          )
          .select()
          .single<{ id: string }>();

        if (!doc) continue;

        const { data: lastVersion } = await supabase
          .from(TABLES.documentVersions)
          .select("version")
          .eq("document_id", doc.id)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle<{ version: number }>();

        const nextVersion = (lastVersion?.version ?? 0) + 1;

        await supabase.from(TABLES.documentVersions).insert({
          user_id: userId,
          document_id: doc.id,
          version: nextVersion,
          content_md: event.content,
          source: "ai_generated",
        });

        yield {
          type: "doc_saved" as const,
          docType: event.docType,
          document_id: doc.id,
          version: nextVersion,
        };
      }
    }

    await supabase
      .from(TABLES.projectPhases)
      .update({ status: "in_review" })
      .eq("project_id", projectId)
      .eq("phase", phase);

    yield { type: "generation_complete" as const };
  }

  return sseResponse(withPersistence());
}
