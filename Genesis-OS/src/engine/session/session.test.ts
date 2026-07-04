import { describe, expect, it } from "vitest";
import { buildResumeSummary, runTurn } from "./index";
import type {
  AIProvider,
  CompletionChunk,
  CompletionRequest,
  CompletionResult,
} from "@/engine/provider";
import type { ContextEntry } from "@/types/domain";

function entry(overrides: Partial<ContextEntry>): ContextEntry {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    project_id: "p1",
    phase: "define",
    question: "q",
    answer: "a",
    decision: "a",
    category: "scope",
    status: "confirmed",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const VALID_QUESTION = {
  question: "MVP 사용자는 누구입니까?",
  why: "범위를 좁히기 위해",
  what: "1인 vs 멀티유저",
  how: "선택 또는 직접 입력",
  category: "users",
  options: [{ label: "나만", description: "1인 전용", recommended: true }],
  is_phase_complete: false,
};

class ScriptedProvider implements AIProvider {
  readonly name = "scripted";
  private streamTexts: string[];
  private completeTexts: string[];
  private streamCalls = 0;
  private completeCalls = 0;

  constructor(streamTexts: string[], completeTexts: string[] = []) {
    this.streamTexts = streamTexts;
    this.completeTexts = completeTexts;
  }

  async *stream(_req: CompletionRequest): AsyncIterable<CompletionChunk> {
    const text = this.streamTexts[this.streamCalls++] ?? "";
    yield { type: "text_delta", text };
    yield { type: "done", stopReason: "end_turn" };
  }

  async complete(_req: CompletionRequest): Promise<CompletionResult> {
    const text = this.completeTexts[this.completeCalls++] ?? "";
    return { text, stopReason: "end_turn" };
  }
}

describe("runTurn", () => {
  it("스트리밍 delta를 그대로 전달하고 유효한 JSON을 question 이벤트로 낸다", async () => {
    const json = JSON.stringify(VALID_QUESTION);
    const provider = new ScriptedProvider([json]);

    const events = [];
    for await (const e of runTurn({ phase: "define", entries: [], provider })) {
      events.push(e);
    }

    expect(events[0]).toEqual({ type: "question_delta", text: json });
    const last = events[events.length - 1];
    expect(last.type).toBe("question");
    if (last.type === "question") {
      expect(last.data.category).toBe("users");
    }
  });

  it("첫 응답 파싱 실패 시 재요청하고, 재요청이 성공하면 question 이벤트를 낸다", async () => {
    const broken = "형식이 깨진 응답";
    const fixed = JSON.stringify(VALID_QUESTION);
    const provider = new ScriptedProvider([broken], [fixed]);

    const events = [];
    for await (const e of runTurn({ phase: "define", entries: [], provider })) {
      events.push(e);
    }

    const last = events[events.length - 1];
    expect(last.type).toBe("question");
    if (last.type === "question") {
      expect(last.data.fallback).toBeUndefined();
    }
  });

  it("재요청까지 실패하면 자유 텍스트 폴백으로 question 이벤트를 낸다", async () => {
    const broken1 = "형식이 깨진 응답 1";
    const broken2 = "형식이 깨진 응답 2";
    const provider = new ScriptedProvider([broken1], [broken2]);

    const events = [];
    for await (const e of runTurn({ phase: "define", entries: [], provider })) {
      events.push(e);
    }

    const last = events[events.length - 1];
    expect(last.type).toBe("question");
    if (last.type === "question") {
      expect(last.data.fallback).toBe(true);
      expect(last.data.question).toBe(broken2);
      expect(last.data.is_phase_complete).toBe(false);
    }
  });

  it("is_phase_complete가 true면 phase_complete 이벤트를 내고 미정 항목을 포함한다", async () => {
    const completeQuestion = { ...VALID_QUESTION, is_phase_complete: true, summary: "정의 완료" };
    const provider = new ScriptedProvider([JSON.stringify(completeQuestion)]);

    const entries = [
      entry({ phase: "define", status: "pending", category: "pricing", question: "가격은?", answer: null, decision: null }),
      entry({ phase: "discover", status: "pending", category: "other", question: "다른 단계 미정", answer: null, decision: null }),
    ];

    const events = [];
    for await (const e of runTurn({ phase: "define", entries, provider })) {
      events.push(e);
    }

    const last = events[events.length - 1];
    expect(last.type).toBe("phase_complete");
    if (last.type === "phase_complete") {
      expect(last.summary).toBe("정의 완료");
      expect(last.unresolved).toEqual([{ category: "pricing", question: "가격은?" }]);
    }
  });
});

describe("buildResumeSummary", () => {
  it("확정된 결정이 없으면 null (재개가 아니라 첫 진입)", () => {
    expect(buildResumeSummary([], "define")).toBeNull();
  });

  it("확정된 결정이 있으면 개수와 최근 요약을 반환한다", () => {
    const entries = [
      entry({ phase: "define", decision: "결정1" }),
      entry({ phase: "define", decision: "결정2" }),
      entry({ phase: "discover", decision: "다른 단계 결정" }),
    ];
    const result = buildResumeSummary(entries, "define");
    expect(result?.decisionsCount).toBe(2);
    expect(result?.summary).toContain("결정1");
    expect(result?.summary).toContain("결정2");
    expect(result?.summary).not.toContain("다른 단계 결정");
  });
});
