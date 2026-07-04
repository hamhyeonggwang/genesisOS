import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { DOC_TITLES, DOC_TYPE_PHASE } from "@/engine/docgen";
import { DocViewer } from "@/components/docs/doc-viewer";
import type {
  DocType,
  DocumentVersion,
  PipelinePhase,
  Project,
} from "@/types/domain";

const DOC_TYPES: DocType[] = ["prd", "roadmap", "ia", "ux", "architecture", "api"];

function isDocType(v: string): v is DocType {
  return (DOC_TYPES as string[]).includes(v);
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string; type: string }>;
}) {
  const { id: projectId, type } = await params;
  if (!isDocType(type)) notFound();

  const supabase = await createClient();

  const { data: project } = await supabase
    .from(TABLES.projects)
    .select("*")
    .eq("id", projectId)
    .single<Project>();

  if (!project) notFound();

  const { data: allDocs } = await supabase
    .from(TABLES.documents)
    .select("id, type")
    .eq("project_id", projectId)
    .returns<{ id: string; type: DocType }[]>();

  const docRow = (allDocs ?? []).find((d) => d.type === type) ?? null;

  let versions: DocumentVersion[] = [];
  if (docRow) {
    const { data } = await supabase
      .from(TABLES.documentVersions)
      .select("*")
      .eq("document_id", docRow.id)
      .order("version", { ascending: false })
      .returns<DocumentVersion[]>();
    versions = data ?? [];
  }

  const phase = DOC_TYPE_PHASE[type];
  const { data: phaseRow } = await supabase
    .from(TABLES.projectPhases)
    .select("*")
    .eq("project_id", projectId)
    .eq("phase", phase)
    .single<PipelinePhase>();

  const { count: pendingCount } = await supabase
    .from(TABLES.contextEntries)
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("phase", phase)
    .eq("status", "pending");

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <header className="space-y-1">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-bold tracking-tight">문서</h1>
      </header>

      <nav className="flex gap-1 border-b text-sm">
        {DOC_TYPES.map((t) => {
          const exists = (allDocs ?? []).some((d) => d.type === t);
          return (
            <Link
              key={t}
              href={`/projects/${projectId}/docs/${t}`}
              className={`border-b-2 px-3 py-2 ${
                t === type
                  ? "border-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              } ${!exists ? "opacity-40" : ""}`}
            >
              {DOC_TITLES[t]}
            </Link>
          );
        })}
      </nav>

      <DocViewer
        docId={docRow?.id ?? null}
        docType={type}
        projectId={projectId}
        phase={phase}
        phaseStatus={phaseRow?.status ?? "locked"}
        versions={versions}
        pendingCount={pendingCount ?? 0}
      />
    </main>
  );
}
