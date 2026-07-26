import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { PhaseApproveButton } from "@/components/pipeline/phase-approve-button";
import { PHASE_DOC_TYPES } from "@/engine/docgen";
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

  // 문서 없는 단계(discover·handoff)가 in_review/stale이면 승인 UI가 필요하다 — 미정 결정 수를 미리 조회.
  const noDocApprovablePhases = orderedPhases.filter((phase) => {
    const status = byPhase.get(phase)?.status;
    return PHASE_DOC_TYPES[phase].length === 0 && (status === "in_review" || status === "stale");
  });
  const pendingCounts = new Map(
    await Promise.all(
      noDocApprovablePhases.map(async (phase) => {
        const { count } = await supabase
          .from(TABLES.contextEntries)
          .select("id", { count: "exact", head: true })
          .eq("project_id", id)
          .eq("phase", phase)
          .eq("status", "pending");
        return [phase, count ?? 0] as const;
      }),
    ),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-8">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← 포트폴리오
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.idea}</p>
        <nav className="flex gap-3 pt-1 text-xs">
          <Link href={`/projects/${id}/docs/prd`} className="underline underline-offset-4">
            문서
          </Link>
          <Link href={`/projects/${id}/memory`} className="underline underline-offset-4">
            Memory
          </Link>
        </nav>
      </header>

      <section>
        <PipelineStepper phases={phases ?? []} />
      </section>

      <section className="space-y-3">
        {orderedPhases.map((phase) => {
          const p = byPhase.get(phase);
          const docTypes = PHASE_DOC_TYPES[phase];
          const hasDocs =
            docTypes.length > 0 && (p?.status === "in_review" || p?.status === "done");
          const needsApproval = pendingCounts.has(phase);

          const row = (
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span className="font-medium">{LABELS[phase]}</span>
              {needsApproval && p ? (
                <PhaseApproveButton
                  projectId={id}
                  phase={phase}
                  phaseStatus={p.status}
                  pendingCount={pendingCounts.get(phase) ?? 0}
                />
              ) : (
                <span className="text-muted-foreground">{p?.status ?? "locked"}</span>
              )}
            </div>
          );
          return hasDocs ? (
            <Link key={phase} href={`/projects/${id}/docs/${docTypes[0]}`} className="block hover:bg-muted/50 rounded-lg">
              {row}
            </Link>
          ) : (
            <div key={phase}>{row}</div>
          );
        })}
      </section>

      {activePhase && (
        <Link
          href={
            activePhase === "handoff"
              ? `/projects/${id}/handoff`
              : `/projects/${id}/session/${activePhase}`
          }
          className="rounded-lg border p-4 text-sm hover:bg-muted/50"
        >
          {activePhase === "handoff"
            ? "→ Handoff 패키지 생성하기"
            : `→ ${LABELS[activePhase]} 질문 세션 계속하기`}
        </Link>
      )}
    </main>
  );
}
