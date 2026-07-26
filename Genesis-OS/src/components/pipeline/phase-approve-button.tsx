"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PhaseName, PhaseStatus } from "@/types/domain";

export function PhaseApproveButton({
  projectId,
  phase,
  phaseStatus,
  pendingCount,
}: {
  projectId: string;
  phase: PhaseName;
  phaseStatus: PhaseStatus;
  pendingCount: number;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button type="button" size="sm" disabled={approving} onClick={handleApprove}>
        {approving ? "처리 중…" : phaseStatus === "stale" ? "재확인" : "승인"}
      </Button>
    </div>
  );
}
