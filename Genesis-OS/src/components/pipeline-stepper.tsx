import { cn } from "@/lib/utils";
import type { PhaseName, PhaseStatus, PipelinePhase } from "@/types/domain";

const LABELS: Record<PhaseName, string> = {
  discover: "Discover",
  define: "Define",
  design: "Design",
  engineer: "Engineer",
  handoff: "Handoff",
};

const GLYPH: Record<PhaseStatus, string> = {
  done: "✓",
  active: "●",
  locked: "○",
  in_review: "◐",
  stale: "⚠",
};

const STYLE: Record<PhaseStatus, string> = {
  done: "border-emerald-600 text-emerald-700 dark:text-emerald-400",
  active: "border-primary text-primary font-semibold",
  in_review: "border-amber-500 text-amber-600",
  locked: "border-muted-foreground/30 text-muted-foreground",
  stale: "border-amber-500 text-amber-600 animate-pulse",
};

export function PipelineStepper({
  phases,
  compact = false,
}: {
  phases: PipelinePhase[];
  compact?: boolean;
}) {
  const byPhase = new Map(phases.map((p) => [p.phase, p]));
  const order: PhaseName[] = ["discover", "define", "design", "engineer", "handoff"];

  return (
    <ol className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")}>
      {order.map((phase, i) => {
        const p = byPhase.get(phase);
        const status = p?.status ?? "locked";
        return (
          <li key={phase} className="flex items-center gap-2">
            <span
              title={`${LABELS[phase]} — ${status}`}
              className={cn(
                "flex items-center justify-center rounded-full border",
                STYLE[status],
                compact ? "size-6 text-xs" : "size-9 text-sm gap-1 px-3",
              )}
            >
              {compact ? GLYPH[status] : (
                <>
                  {GLYPH[status]} {LABELS[phase]}
                </>
              )}
            </span>
            {i < order.length - 1 && (
              <span className="text-muted-foreground text-xs">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
