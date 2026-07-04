"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { consumeSseResponse } from "@/lib/parse-sse";
import { QuestionCard } from "./question-card";
import { DecisionPanel } from "./decision-panel";
import { PHASE_DOC_TYPES } from "@/engine/docgen";
import { Button } from "@/components/ui/button";
import type { StructuredQuestion } from "@/engine/prompts";
import type { ContextEntry, PhaseName } from "@/types/domain";

interface Turn {
  question: string;
  answer: string;
  skipped: boolean;
}

const PHASE_LABELS: Record<PhaseName, string> = {
  discover: "Discover",
  define: "Define",
  design: "Design",
  engineer: "Engineer",
  handoff: "Handoff",
};

export function SessionClient({
  projectId,
  phase,
  initialEntries,
}: {
  projectId: string;
  phase: PhaseName;
  initialEntries: ContextEntry[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<ContextEntry[]>(initialEntries);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [liveQuestion, setLiveQuestion] = useState<StructuredQuestion | null>(null);
  const [resumeSummary, setResumeSummary] = useState<string | null>(null);
  const [phaseComplete, setPhaseComplete] = useState<{
    summary: string;
    unresolved: { category: string; question: string }[];
  } | null>(null);
  const [streaming, setStreaming] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const docTypes = PHASE_DOC_TYPES[phase];

  async function runTurn(fetchCall: () => Promise<Response>) {
    setStreaming(true);
    setError(null);
    try {
      const res = await fetchCall();
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `요청 실패 (${res.status})`);
        setStreaming(false);
        return;
      }

      await consumeSseResponse(res, (event) => {
        if (event.event === "resume_summary") {
          setResumeSummary(event.data.summary as string);
        } else if (event.event === "question") {
          setLiveQuestion((event.data.data ?? event.data) as StructuredQuestion);
        } else if (event.event === "phase_complete") {
          setPhaseComplete({
            summary: event.data.summary as string,
            unresolved: event.data.unresolved as { category: string; question: string }[],
          });
          setLiveQuestion(null);
        } else if (event.event === "error") {
          setError(event.data.message as string);
        }
      });
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setStreaming(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runTurn(() =>
      fetch(`/api/projects/${projectId}/phases/${phase}/session/next`, {
        method: "POST",
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/${phase}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `요청 실패 (${res.status})`);
        setGenerating(false);
        return;
      }
      await consumeSseResponse(res, () => {});
      router.push(`/projects/${projectId}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setGenerating(false);
    }
  }

  function handleAnswer(answer: string, skipped: boolean) {
    if (!liveQuestion) return;

    setTurns((prev) => [...prev, { question: liveQuestion.question, answer, skipped }]);

    if (!skipped) {
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: "",
          project_id: projectId,
          phase,
          question: liveQuestion.question,
          answer,
          decision: answer,
          category: liveQuestion.category,
          status: "confirmed",
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: "",
          project_id: projectId,
          phase,
          question: liveQuestion.question,
          answer: null,
          decision: null,
          category: liveQuestion.category,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    const question = liveQuestion.question;
    const category = liveQuestion.category;
    setLiveQuestion(null);

    runTurn(() =>
      fetch(`/api/projects/${projectId}/phases/${phase}/session/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, category, answer, skipped }),
      }),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[160px_1fr_280px]">
      <aside className="space-y-2 text-sm">
        <p className="font-medium">{PHASE_LABELS[phase]}</p>
        <p className="text-xs text-muted-foreground">
          질문 {turns.length + (liveQuestion ? 1 : 0)}개 진행
        </p>
      </aside>

      <section className="space-y-4">
        {resumeSummary && (
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-line">
            {resumeSummary}
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className="space-y-1 rounded-md border p-3 text-sm opacity-70">
            <p className="font-medium">{t.question}</p>
            <p className="text-muted-foreground">
              {t.skipped ? "⚠ 건너뜀 (미정)" : `→ ${t.answer}`}
            </p>
          </div>
        ))}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {liveQuestion && (
          <QuestionCard
            question={liveQuestion}
            onAnswer={(answer) => handleAnswer(answer, false)}
            onSkip={() => handleAnswer("", true)}
            disabled={streaming}
          />
        )}

        {!liveQuestion && streaming && !phaseComplete && (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            AI가 질문을 준비하고 있습니다…
          </div>
        )}

        {phaseComplete && (
          <div className="space-y-3 rounded-lg border border-emerald-600/50 bg-emerald-600/5 p-4">
            <p className="font-medium">🎉 {PHASE_LABELS[phase]} 정의 완료</p>
            <p className="text-sm text-muted-foreground">{phaseComplete.summary}</p>
            {phaseComplete.unresolved.length > 0 && (
              <div className="text-xs text-amber-600">
                미정 {phaseComplete.unresolved.length}건: {" "}
                {phaseComplete.unresolved.map((u) => u.question).join(" / ")}
              </div>
            )}
            <Button type="button" disabled={generating} onClick={handleGenerate}>
              {generating
                ? "생성 중…"
                : docTypes.length > 0
                  ? `🎉 산출물 생성 (${docTypes.length}개 문서)`
                  : "다음 단계로"}
            </Button>
          </div>
        )}
      </section>

      <aside>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Decision Panel
        </p>
        <DecisionPanel entries={entries} />
      </aside>
    </div>
  );
}
