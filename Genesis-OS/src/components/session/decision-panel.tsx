"use client";

import { cn } from "@/lib/utils";
import type { ContextEntry } from "@/types/domain";

export function DecisionPanel({ entries }: { entries: ContextEntry[] }) {
  const pending = entries.filter((e) => e.status === "pending");
  const confirmed = entries.filter((e) => e.status === "confirmed");

  if (!entries.length) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
        아직 확정된 결정이 없습니다. 첫 질문에 답하면 여기 쌓입니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map((e) => (
        <div
          key={e.id}
          className={cn(
            "rounded-md border border-amber-500/50 bg-amber-500/5 p-2 text-xs",
          )}
        >
          <p className="font-medium text-amber-600">⚠ 미정</p>
          <p className="mt-0.5 text-muted-foreground">{e.question}</p>
        </div>
      ))}
      {confirmed.map((e) => (
        <div key={e.id} className="rounded-md border p-2 text-xs">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">
            ✔ {e.category}
          </p>
          <p className="mt-0.5 text-muted-foreground">{e.decision}</p>
        </div>
      ))}
    </div>
  );
}
