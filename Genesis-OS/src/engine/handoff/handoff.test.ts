import { describe, expect, it } from "vitest";
import { buildStartPrompt, runHandoff } from "./index";
import type {
  AIProvider,
  CompletionChunk,
  CompletionRequest,
  CompletionResult,
} from "@/engine/provider";
import type { ContextEntry } from "@/types/domain";

class RecordingProvider implements AIProvider {
  readonly name = "recording";
  systemPrompts: string[] = [];

  async *stream(req: CompletionRequest): AsyncIterable<CompletionChunk> {
    this.systemPrompts.push(req.system ?? "");
    yield { type: "text_delta", text: "# 생성된 문서" };
    yield { type: "done", stopReason: "end_turn" };
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    this.systemPrompts.push(req.system ?? "");
    return { text: "# stub", stopReason: "end_turn" };
  }
}

function entry(overrides: Partial<ContextEntry>): ContextEntry {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    project_id: "p1",
    phase: "define",
    question: "q",
    answer: "a",
    decision: "핵심 결정",
    category: "scope",
    status: "confirmed",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildStartPrompt", () => {
  it("프로젝트 이름을 포함한 결정론적 템플릿을 만든다 (AI 호출 없음)", () => {
    const a = buildStartPrompt("OTHUB");
    const b = buildStartPrompt("OTHUB");
    expect(a).toBe(b);
    expect(a).toContain("OTHUB");
    expect(a).toContain("tasks.md");
  });
});

describe("runHandoff", () => {
  it("claude_md → tasks → start_prompt 순서로 이벤트를 낸다", async () => {
    const provider = new RecordingProvider();
    const events = [];
    for await (const e of runHandoff({
      projectName: "OTHUB",
      projectIdea: "교육 플랫폼",
      entries: [entry({})],
      documents: [{ type: "prd", content_md: "# PRD\n내용" }],
      provider,
    })) {
      events.push(e.type);
    }

    expect(events).toEqual([
      "claude_md_delta",
      "claude_md_done",
      "tasks_delta",
      "tasks_done",
      "start_prompt_done",
    ]);
  });

  it("CLAUDE.md 프롬프트에 확정 결정과 승인된 문서를 포함한다", async () => {
    const provider = new RecordingProvider();
    for await (const _e of runHandoff({
      projectName: "OTHUB",
      projectIdea: "교육 플랫폼",
      entries: [entry({ decision: "신규·경력 치료사 대상" })],
      documents: [{ type: "prd", content_md: "PRD 승인 내용" }],
      provider,
    })) {
      // consume
    }

    expect(provider.systemPrompts[0]).toContain("신규·경력 치료사 대상");
    expect(provider.systemPrompts[0]).toContain("PRD 승인 내용");
    expect(provider.systemPrompts[0]).toContain("핵심 결정 10선");
  });

  it("start_prompt_done의 content는 buildStartPrompt와 동일하다", async () => {
    const provider = new RecordingProvider();
    let startPromptContent = "";
    for await (const e of runHandoff({
      projectName: "OTHUB",
      projectIdea: "교육 플랫폼",
      entries: [],
      documents: [],
      provider,
    })) {
      if (e.type === "start_prompt_done") startPromptContent = e.content;
    }
    expect(startPromptContent).toBe(buildStartPrompt("OTHUB"));
  });
});
