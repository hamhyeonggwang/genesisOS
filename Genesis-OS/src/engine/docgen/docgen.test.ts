import { describe, expect, it } from "vitest";
import { PHASE_DOC_TYPES, runDocgen } from "./index";
import type {
  AIProvider,
  CompletionChunk,
  CompletionRequest,
  CompletionResult,
} from "@/engine/provider";

class RecordingProvider implements AIProvider {
  readonly name = "recording";
  systemPrompts: string[] = [];

  async *stream(req: CompletionRequest): AsyncIterable<CompletionChunk> {
    this.systemPrompts.push(req.system ?? "");
    yield { type: "text_delta", text: `# ${req.messages[0]?.content ?? ""}\n본문` };
    yield { type: "done", stopReason: "end_turn" };
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    this.systemPrompts.push(req.system ?? "");
    return { text: "# stub", stopReason: "end_turn" };
  }
}

describe("PHASE_DOC_TYPES", () => {
  it("discover·handoff는 생성 문서가 없다", () => {
    expect(PHASE_DOC_TYPES.discover).toEqual([]);
    expect(PHASE_DOC_TYPES.handoff).toEqual([]);
  });

  it("define→prd·roadmap, design→ia·ux, engineer→architecture·api", () => {
    expect(PHASE_DOC_TYPES.define).toEqual(["prd", "roadmap"]);
    expect(PHASE_DOC_TYPES.design).toEqual(["ia", "ux"]);
    expect(PHASE_DOC_TYPES.engineer).toEqual(["architecture", "api"]);
  });
});

describe("runDocgen", () => {
  it("단계의 문서 타입 순서대로 doc_start→doc_delta→doc_done을 낸다", async () => {
    const provider = new RecordingProvider();
    const events = [];
    for await (const e of runDocgen({
      phase: "define",
      projectName: "OTHUB",
      projectIdea: "교육 플랫폼",
      entries: [],
      priorDocuments: [],
      provider,
    })) {
      events.push(e);
    }

    const types = events.map((e) => e.type);
    expect(types).toEqual([
      "doc_start",
      "doc_delta",
      "doc_done",
      "doc_start",
      "doc_delta",
      "doc_done",
    ]);
    expect(events[0]).toMatchObject({ type: "doc_start", docType: "prd" });
    expect(events[3]).toMatchObject({ type: "doc_start", docType: "roadmap" });
  });

  it("두 번째 문서 생성 시 첫 번째 문서가 상위 문서로 프롬프트에 포함된다", async () => {
    const provider = new RecordingProvider();
    for await (const _e of runDocgen({
      phase: "define",
      projectName: "OTHUB",
      projectIdea: "교육 플랫폼",
      entries: [],
      priorDocuments: [],
      provider,
    })) {
      // consume
    }

    expect(provider.systemPrompts).toHaveLength(2);
    expect(provider.systemPrompts[0]).not.toContain("PRD\n#"); // 첫 문서 생성 시엔 자기 자신이 없음
    expect(provider.systemPrompts[1]).toContain("### PRD");
  });

  it("승인된 상위 문서(priorDocuments)를 프롬프트에 포함한다", async () => {
    const provider = new RecordingProvider();
    for await (const _e of runDocgen({
      phase: "design",
      projectName: "OTHUB",
      projectIdea: "교육 플랫폼",
      entries: [],
      priorDocuments: [{ type: "prd", content_md: "# PRD\n승인된 내용" }],
      provider,
    })) {
      // consume
    }

    expect(provider.systemPrompts[0]).toContain("승인된 내용");
  });

  it("discover 단계는 문서를 생성하지 않는다", async () => {
    const provider = new RecordingProvider();
    const events = [];
    for await (const e of runDocgen({
      phase: "discover",
      projectName: "OTHUB",
      projectIdea: "교육 플랫폼",
      entries: [],
      priorDocuments: [],
      provider,
    })) {
      events.push(e);
    }
    expect(events).toEqual([]);
  });
});
