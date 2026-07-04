"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HandoffPackage } from "@/types/domain";

type Preview = { claude_md: string; tasks_md: string; start_prompt: string };

export function HandoffClient({
  projectId,
  projectName,
  existingPackage,
}: {
  projectId: string;
  projectName: string;
  existingPackage: HandoffPackage | null;
}) {
  const [packageId, setPackageId] = useState<string | null>(existingPackage?.id ?? null);
  const [preview, setPreview] = useState<Preview | null>(
    existingPackage
      ? {
          claude_md: existingPackage.claude_md,
          tasks_md: existingPackage.tasks_md,
          start_prompt: existingPackage.start_prompt,
        }
      : null,
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<"claude_md" | "tasks_md" | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/handoff`, { method: "POST" });
    setGenerating(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? `요청 실패 (${res.status})`);
      return;
    }

    const body = await res.json();
    setPackageId(body.package_id);
    setPreview(body.preview);
  }

  async function handleCopyPrompt() {
    if (!preview) return;
    await navigator.clipboard.writeText(preview.start_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!preview) {
    return (
      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="button" disabled={generating} onClick={handleGenerate}>
          {generating ? "생성 중… (1분 내외 소요)" : "📦 Handoff 패키지 생성"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <p className="mb-2 font-medium">📦 {projectName}-handoff.zip</p>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => setExpanded(expanded === "claude_md" ? null : "claude_md")}
            >
              CLAUDE.md {expanded === "claude_md" ? "▲" : "▾"}
            </button>
          </li>
          {expanded === "claude_md" && (
            <pre className="max-h-64 overflow-auto rounded-md bg-muted/30 p-3 text-xs whitespace-pre-wrap">
              {preview.claude_md}
            </pre>
          )}
          <li className="text-muted-foreground">
            docs/ — PRD·Roadmap·IA·UX·Architecture·API.md
          </li>
          <li>
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => setExpanded(expanded === "tasks_md" ? null : "tasks_md")}
            >
              tasks.md {expanded === "tasks_md" ? "▲" : "▾"}
            </button>
          </li>
          {expanded === "tasks_md" && (
            <pre className="max-h-64 overflow-auto rounded-md bg-muted/30 p-3 text-xs whitespace-pre-wrap">
              {preview.tasks_md}
            </pre>
          )}
          <li className="text-muted-foreground">START_PROMPT.md</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {packageId && (
          <a
            href={`/api/handoff/${packageId}/download`}
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/80"
          >
            ⬇ zip 다운로드
          </a>
        )}
        <Button type="button" variant="outline" onClick={handleCopyPrompt}>
          {copied ? "복사됨!" : "📋 구현 프롬프트 복사"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        다음: Claude Code에서 구현 → 완료 후 회고를 기록하세요.
      </p>
    </div>
  );
}
