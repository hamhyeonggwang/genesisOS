import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { PipelineStepper } from "@/components/pipeline-stepper";
import type { PhaseName, PipelinePhase, Project } from "@/types/domain";

const LABELS: Record<PhaseName, string> = {
  discover: "Discover",
  define: "Define",
  design: "Design",
  engineer: "Engineer",
  handoff: "Handoff",
};

export default async function ProjectHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from(TABLES.projects)
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (!project) notFound();

  const { data: phases } = await supabase
    .from(TABLES.projectPhases)
    .select("*")
    .eq("project_id", id)
    .returns<PipelinePhase[]>();

  const orderedPhases = ["discover", "define", "design", "engineer", "handoff"] as PhaseName[];
  const byPhase = new Map((phases ?? []).map((p) => [p.phase, p]));
  const activePhase = orderedPhases.find((p) => byPhase.get(p)?.status === "active");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-8">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← 포트폴리오
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.idea}</p>
      </header>

      <section>
        <PipelineStepper phases={phases ?? []} />
      </section>

      <section className="space-y-3">
        {orderedPhases.map((phase) => {
          const p = byPhase.get(phase);
          return (
            <div
              key={phase}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span className="font-medium">{LABELS[phase]}</span>
              <span className="text-muted-foreground">{p?.status ?? "locked"}</span>
            </div>
          );
        })}
      </section>

      {activePhase && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {LABELS[activePhase]} 질문 세션은 다음 마일스톤(Milestone 2)에서 구현됩니다.
        </p>
      )}
    </main>
  );
}
