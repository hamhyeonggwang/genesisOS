import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { MemoryView } from "@/components/memory/memory-view";
import type { ContextEntry, Project } from "@/types/domain";

export default async function MemoryPage({
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

  const { data: entries } = await supabase
    .from(TABLES.contextEntries)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .returns<ContextEntry[]>();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="space-y-1">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Project Memory</h1>
        <p className="text-sm text-muted-foreground">
          이 프로젝트에서 확정된 모든 결정. Discover 단계의 결정은 Discovery Brief로
          구조화되어 표시됩니다 (IA.md §2 결정 — 별도 문서가 아닌 Memory의 뷰).
        </p>
      </header>

      <MemoryView entries={entries ?? []} />
    </main>
  );
}
