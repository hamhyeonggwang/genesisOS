import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { isValidPhase } from "@/lib/session-api";
import { SessionClient } from "@/components/session/session-client";
import type { ContextEntry, PipelinePhase, Project } from "@/types/domain";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; phase: string }>;
}) {
  const { id: projectId, phase: phaseParam } = await params;
  if (!isValidPhase(phaseParam)) notFound();
  const phase = phaseParam;

  const supabase = await createClient();

  const { data: project } = await supabase
    .from(TABLES.projects)
    .select("*")
    .eq("id", projectId)
    .single<Project>();

  if (!project) notFound();

  const { data: phaseRow } = await supabase
    .from(TABLES.projectPhases)
    .select("*")
    .eq("project_id", projectId)
    .eq("phase", phase)
    .single<PipelinePhase>();

  if (!phaseRow) notFound();

  const { data: entries } = await supabase
    .from(TABLES.contextEntries)
    .select("*")
    .eq("project_id", projectId)
    .eq("phase", phase)
    .order("created_at", { ascending: true })
    .returns<ContextEntry[]>();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="space-y-1">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-bold tracking-tight">질문 세션</h1>
      </header>

      {phaseRow.status !== "active" ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          이 단계는 현재 진행할 수 없습니다 (상태: {phaseRow.status}).
        </p>
      ) : (
        <SessionClient
          projectId={projectId}
          phase={phase}
          initialEntries={entries ?? []}
        />
      )}
    </main>
  );
}
