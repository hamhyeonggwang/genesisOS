import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { signOut } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { PipelineStepper } from "@/components/pipeline-stepper";
import type { PipelinePhase, Project } from "@/types/domain";

const EXAMPLE_IDEAS = [
  "작업치료사를 위한 교육 플랫폼을 만들고 싶다",
  "재활 환자의 홈 운동 순응도를 높이는 앱을 만들고 싶다",
  "임상 노트를 자동으로 요약해주는 도구를 만들고 싶다",
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from(TABLES.projects)
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Project[]>();

  const { data: allPhases } = await supabase
    .from(TABLES.projectPhases)
    .select("*")
    .returns<PipelinePhase[]>();

  const phasesByProject = new Map<string, PipelinePhase[]>();
  for (const phase of allPhases ?? []) {
    const list = phasesByProject.get(phase.project_id) ?? [];
    list.push(phase);
    phasesByProject.set(phase.project_id, list);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Genesis OS</h1>
          <p className="text-sm text-muted-foreground">
            Product Engineering Operating System
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/settings" className="text-muted-foreground hover:underline">
              설정
            </Link>
            <span className="text-muted-foreground">{user.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                로그아웃
              </Button>
            </form>
          </div>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">프로젝트</h2>
          <Link href="/projects/new" className={buttonVariants({ size: "sm" })}>
            + 새 프로젝트
          </Link>
        </div>

        {!projects?.length && (
          <div className="space-y-3 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            <p>첫 제품을 설계해 보세요.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_IDEAS.map((idea) => (
                <Link
                  key={idea}
                  href={`/projects/new?idea=${encodeURIComponent(idea)}`}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-muted/50"
                >
                  {idea}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {projects?.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <p className="mb-2 font-medium">{project.name}</p>
              <PipelineStepper
                phases={phasesByProject.get(project.id) ?? []}
                compact
              />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
