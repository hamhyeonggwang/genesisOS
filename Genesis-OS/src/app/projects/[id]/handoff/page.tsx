import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { HandoffClient } from "@/components/handoff/handoff-client";
import type { HandoffPackage, PipelinePhase, Project } from "@/types/domain";

export default async function HandoffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
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
    .eq("phase", "handoff")
    .single<PipelinePhase>();

  const { data: existingPackage } = await supabase
    .from(TABLES.handoffPackages)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<HandoffPackage>();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="space-y-1">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Handoff Package</h1>
      </header>

      {phaseRow?.status !== "active" && !existingPackage ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Engineer 단계까지 완료되어야 Handoff 패키지를 생성할 수 있습니다 (현재:{" "}
          {phaseRow?.status ?? "locked"}).
        </p>
      ) : (
        <HandoffClient
          projectId={projectId}
          projectName={project.name}
          existingPackage={existingPackage ?? null}
        />
      )}
    </main>
  );
}
