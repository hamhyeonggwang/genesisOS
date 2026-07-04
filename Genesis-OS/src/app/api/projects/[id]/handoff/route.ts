import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { getProvider } from "@/engine/provider";
import { runHandoff, type HandoffDoc } from "@/engine/handoff";
import { DOC_TITLES } from "@/engine/docgen";
import { errorResponse, fetchProjectEntries, requireActivePhase } from "@/lib/session-api";
import type { DocType, Project } from "@/types/domain";

const REQUIRED_DOC_TYPES: DocType[] = ["prd", "roadmap", "ia", "ux", "architecture", "api"];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
  }

  const check = await requireActivePhase(supabase, projectId, "handoff");
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

  const { data: docs } = await supabase
    .from(TABLES.documents)
    .select("id, type, status")
    .eq("project_id", projectId)
    .returns<{ id: string; type: DocType; status: string }[]>();

  const missing = REQUIRED_DOC_TYPES.filter(
    (t) => !(docs ?? []).some((d) => d.type === t && d.status === "approved"),
  );

  if (missing.length > 0) {
    return errorResponse(
      400,
      "INVALID_TRANSITION",
      `승인되지 않은 문서가 있습니다: ${missing.map((t) => DOC_TITLES[t]).join(", ")}`,
    );
  }

  const handoffDocs: HandoffDoc[] = [];
  const docVersionIds: string[] = [];

  for (const doc of docs ?? []) {
    const { data: latest } = await supabase
      .from(TABLES.documentVersions)
      .select("id, content_md")
      .eq("document_id", doc.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; content_md: string }>();

    if (latest) {
      handoffDocs.push({ type: doc.type, content_md: latest.content_md });
      docVersionIds.push(latest.id);
    }
  }

  const entries = await fetchProjectEntries(supabase, projectId);
  const provider = getProvider();

  let claudeMd = "";
  let tasksMd = "";
  let startPrompt = "";

  for await (const event of runHandoff({
    projectName: project.name,
    projectIdea: project.idea,
    entries,
    documents: handoffDocs,
    provider,
  })) {
    if (event.type === "claude_md_done") claudeMd = event.content;
    if (event.type === "tasks_done") tasksMd = event.content;
    if (event.type === "start_prompt_done") startPrompt = event.content;
  }

  const { data: pkg, error } = await supabase
    .from(TABLES.handoffPackages)
    .insert({
      user_id: user.id,
      project_id: projectId,
      claude_md: claudeMd,
      tasks_md: tasksMd,
      start_prompt: startPrompt,
      doc_version_ids: docVersionIds,
    })
    .select()
    .single();

  if (error || !pkg) {
    return errorResponse(500, "CREATE_FAILED", error?.message ?? "패키지 생성 실패", true);
  }

  return Response.json(
    {
      package_id: pkg.id,
      preview: { claude_md: claudeMd, tasks_md: tasksMd, start_prompt: startPrompt },
    },
    { status: 201 },
  );
}
