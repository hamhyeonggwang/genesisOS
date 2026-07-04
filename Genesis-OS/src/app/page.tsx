import type { PhaseName } from "@/types/domain";

const PIPELINE: PhaseName[] = [
  "discover",
  "define",
  "design",
  "engineer",
  "handoff",
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold tracking-tight">Genesis OS</h1>
      <p className="text-muted-foreground">
        Product Engineering Operating System
      </p>
      <ol className="flex gap-2 text-sm">
        {PIPELINE.map((phase, i) => (
          <li key={phase} className="flex items-center gap-2">
            <span className="rounded-full border px-3 py-1 capitalize">
              {phase}
            </span>
            {i < PIPELINE.length - 1 && (
              <span className="text-muted-foreground">→</span>
            )}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Dogfooding Cycle #1 · T01 scaffolding complete
      </p>
    </main>
  );
}
