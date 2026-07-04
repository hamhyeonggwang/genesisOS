// 세션 오케스트레이션 (T09) — docs/Architecture.md §5.2 한 턴의 처리 흐름
// 엔진 모듈이므로 react/next 의존성 금지. SSE 인코딩은 API 라우트(얇은 어댑터)의 책임이다.

import type { AIProvider } from "@/engine/provider";
import { buildContext } from "@/engine/memory";
import {
  buildRetryInstruction,
  buildSystemPrompt,
  parseStructuredQuestion,
  toFreeformFallback,
  type StructuredQuestion,
} from "@/engine/prompts";
import type { ContextEntry, PhaseName } from "@/types/domain";

export type SessionTurnEvent =
  | { type: "question_delta"; text: string }
  | { type: "question"; data: StructuredQuestion }
  | {
      type: "phase_complete";
      summary: string;
      unresolved: { category: string; question: string }[];
    };

const NEXT_QUESTION_PROMPT = "다음 질문을 생성하라.";

/** 한 턴(다음 질문 생성) 실행: 스트리밍 → 파싱 → 실패 시 1회 재요청 → 폴백. */
export async function* runTurn({
  phase,
  entries,
  provider,
}: {
  phase: PhaseName;
  entries: ContextEntry[];
  provider: AIProvider;
}): AsyncGenerator<SessionTurnEvent> {
  const context = buildContext(entries, { currentPhase: phase });
  const system = buildSystemPrompt({ phase, memoryContextText: context.text });
  const baseMessages = [{ role: "user" as const, content: NEXT_QUESTION_PROMPT }];

  let fullText = "";
  for await (const chunk of provider.stream({ system, messages: baseMessages })) {
    if (chunk.type === "text_delta") {
      fullText += chunk.text;
      yield { type: "question_delta", text: chunk.text };
    }
  }

  let parsed = parseStructuredQuestion(fullText);

  if (!parsed.ok) {
    const retry = await provider.complete({
      system,
      messages: [
        ...baseMessages,
        { role: "assistant", content: fullText },
        { role: "user", content: buildRetryInstruction(fullText) },
      ],
    });
    fullText = retry.text;
    parsed = parseStructuredQuestion(fullText);
  }

  const question = parsed.ok ? parsed.data : toFreeformFallback(fullText);

  if (question.is_phase_complete) {
    const unresolved = entries
      .filter((e) => e.phase === phase && e.status === "pending")
      .map((e) => ({ category: e.category, question: e.question }));

    yield { type: "phase_complete", summary: question.summary ?? "", unresolved };
    return;
  }

  yield { type: "question", data: question };
}

export interface ResumeSummary {
  decisionsCount: number;
  summary: string;
}

/** 세션 재개 시 보여줄 요약. 확정된 결정이 없으면 null (재개가 아니라 첫 진입). */
export function buildResumeSummary(
  entries: ContextEntry[],
  phase: PhaseName,
): ResumeSummary | null {
  const confirmed = entries.filter(
    (e) => e.phase === phase && e.status === "confirmed",
  );
  if (!confirmed.length) return null;

  const recent = confirmed.slice(-3).map((e) => `- ${e.decision}`);
  return {
    decisionsCount: confirmed.length,
    summary: `지금까지 ${confirmed.length}개 결정이 확정되었습니다.\n${recent.join("\n")}`,
  };
}
