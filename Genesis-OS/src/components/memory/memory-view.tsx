"use client";

import { useMemo, useState } from "react";
import type { ContextEntry, PhaseName } from "@/types/domain";

const PHASE_LABELS: Record<PhaseName, string> = {
  discover: "Discover",
  define: "Define",
  design: "Design",
  engineer: "Engineer",
  handoff: "Handoff",
};

export function MemoryView({ entries }: { entries: ContextEntry[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(entries.map((e) => e.category))).sort(),
    [entries],
  );

  const discoveryEntries = entries.filter((e) => e.phase === "discover");

  const filtered = entries.filter((e) => {
    if (category !== "all" && e.category !== category) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.question.toLowerCase().includes(q) ||
      (e.decision ?? "").toLowerCase().includes(q)
    );
  });

  const byPhase = new Map<PhaseName, ContextEntry[]>();
  for (const e of filtered) {
    const list = byPhase.get(e.phase) ?? [];
    list.push(e);
    byPhase.set(e.phase, list);
  }

  return (
    <div className="space-y-6">
      {discoveryEntries.length > 0 && (
        <section className="space-y-2 rounded-lg border bg-muted/20 p-4">
          <h2 className="text-sm font-semibold">Discovery Brief</h2>
          <dl className="space-y-2 text-sm">
            {discoveryEntries
              .filter((e) => e.status === "confirmed")
              .map((e) => (
                <div key={e.id}>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {e.category}
                  </dt>
                  <dd>{e.decision}</dd>
                </div>
              ))}
          </dl>
        </section>
      )}

      <section className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어..."
          className="flex-1 rounded-md border px-3 py-1.5 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="all">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      {!filtered.length && (
        <p className="text-sm text-muted-foreground">일치하는 결정이 없습니다.</p>
      )}

      {(Object.keys(PHASE_LABELS) as PhaseName[]).map((phase) => {
        const list = byPhase.get(phase);
        if (!list?.length) return null;
        return (
          <section key={phase} className="space-y-2">
            <h3 className="text-sm font-semibold">{PHASE_LABELS[phase]}</h3>
            <div className="space-y-2">
              {list.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-md border p-3 text-sm ${
                    e.status === "pending" ? "border-amber-500/50 bg-amber-500/5" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{e.category}</p>
                  <p className="font-medium">{e.question}</p>
                  <p className="mt-1 text-muted-foreground">
                    {e.status === "pending" ? "⚠ 미정" : e.decision}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
