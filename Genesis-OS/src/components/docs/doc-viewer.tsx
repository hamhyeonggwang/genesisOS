"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { DOC_TITLES } from "@/engine/docgen";
import type { DocType, DocumentVersion, PhaseName, PhaseStatus } from "@/types/domain";

export function DocViewer({
  docId,
  docType,
  projectId,
  phase,
  phaseStatus,
  versions,
  pendingCount,
}: {
  docId: string | null;
  docType: DocType;
  projectId: string;
  phase: PhaseName;
  phaseStatus: PhaseStatus;
  versions: DocumentVersion[];
  pendingCount: number;
}) {
  const router = useRouter();
  const latest = versions[0] ?? null;
  const [selectedVersion, setSelectedVersion] = useState<number>(latest?.version ?? 0);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [content, setContent] = useState(latest?.content_md ?? "");
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayed = versions.find((v) => v.version === selectedVersion) ?? latest;
  const isViewingLatest = !latest || selectedVersion === latest.version;

  if (!docId || !latest) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        아직 생성되지 않았습니다. {phase} 단계의 질문 세션을 완료하면 생성됩니다.
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/documents/${docId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_md: content }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 실패");
      return;
    }
    setMode("view");
    router.refresh();
  }

  async function handleApprove() {
    if (pendingCount > 0) {
      const proceed = window.confirm(
        `이 단계에 미정 결정이 ${pendingCount}건 있습니다. 그래도 승인하시겠습니까?`,
      );
      if (!proceed) return;
    }

    setApproving(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/phases/${phase}/approve`, {
      method: "POST",
    });
    setApproving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "승인 실패");
      return;
    }
    router.push(`/projects/${projectId}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{DOC_TITLES[docType]}</span>
          <select
            value={selectedVersion}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSelectedVersion(v);
              setContent(versions.find((ver) => ver.version === v)?.content_md ?? "");
            }}
            className="rounded-md border px-2 py-1 text-xs"
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version} · {v.source === "ai_generated" ? "AI 생성" : "직접 편집"}
              </option>
            ))}
          </select>
          {!isViewingLatest && (
            <span className="text-xs text-amber-600">이전 버전 보는 중</span>
          )}
        </div>

        <div className="flex gap-2">
          {mode === "view" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setContent(displayed?.content_md ?? "");
                setMode("edit");
              }}
            >
              편집
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setMode("view")}>
                취소
              </Button>
              <Button type="button" size="sm" disabled={saving} onClick={handleSave}>
                {saving ? "저장 중…" : "저장"}
              </Button>
            </>
          )}
          {(phaseStatus === "in_review" || phaseStatus === "stale") && isViewingLatest && (
            <Button type="button" size="sm" disabled={approving} onClick={handleApprove}>
              {approving ? "처리 중…" : phaseStatus === "stale" ? "재확인" : "승인"}
            </Button>
          )}
        </div>
      </div>

      {phaseStatus === "stale" && (
        <p className="rounded-md border border-amber-500/50 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
          ⚠ 상위 단계가 개정되었습니다 — 이 문서가 여전히 유효한지 검토 후 [재확인]을 눌러주세요.
        </p>
      )}

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/5 p-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {mode === "edit" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          className="w-full rounded-md border p-4 font-mono text-xs"
        />
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-6"
          dangerouslySetInnerHTML={{ __html: marked.parse(displayed?.content_md ?? "") as string }}
        />
      )}
    </div>
  );
}
