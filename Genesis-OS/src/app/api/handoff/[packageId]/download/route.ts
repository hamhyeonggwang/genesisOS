import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { DOC_TITLES } from "@/engine/docgen";
import { errorResponse } from "@/lib/session-api";
import type { DocType, HandoffPackage, Project } from "@/types/domain";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packageId: string }> },
) {
  const { packageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
  }

  const { data: pkg } = await supabase
    .from(TABLES.handoffPackages)
    .select("*")
    .eq("id", packageId)
    .single<HandoffPackage>();

  if (!pkg) {
    return errorResponse(404, "NOT_FOUND", "패키지를 찾을 수 없습니다.");
  }

  const { data: project } = await supabase
    .from(TABLES.projects)
    .select("*")
    .eq("id", pkg.project_id)
    .single<Project>();

  if (!project) {
    return errorResponse(404, "NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  const zip = new JSZip();
  zip.file("CLAUDE.md", pkg.claude_md);
  zip.file("tasks.md", pkg.tasks_md);
  zip.file("START_PROMPT.md", pkg.start_prompt);

  const docsFolder = zip.folder("docs");
  for (const versionId of pkg.doc_version_ids) {
    const { data: version } = await supabase
      .from(TABLES.documentVersions)
      .select("content_md, document_id")
      .eq("id", versionId)
      .single<{ content_md: string; document_id: string }>();

    if (!version) continue;

    const { data: doc } = await supabase
      .from(TABLES.documents)
      .select("type")
      .eq("id", version.document_id)
      .single<{ type: DocType }>();

    if (!doc) continue;

    docsFolder?.file(`${DOC_TITLES[doc.type]}.md`, version.content_md);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const fileName = `${project.name.replace(/[^a-zA-Z0-9-_]/g, "_")}-handoff.zip`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
