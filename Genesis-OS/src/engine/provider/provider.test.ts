import { describe, expect, it } from "vitest";
import type { AIProvider, CompletionRequest } from "./types";
import { ClaudeProvider } from "./claude";

// AIProvider가 구조적 타입이므로 mock으로 교체 가능해야 한다 (T04 수용 기준).
class MockProvider implements AIProvider {
  readonly name = "mock";

  async *stream(req: CompletionRequest) {
    yield { type: "text_delta" as const, text: `echo:${req.messages[0]?.content ?? ""}` };
    yield { type: "done" as const, stopReason: "end_turn" };
  }

  async complete(req: CompletionRequest) {
    let text = "";
    for await (const chunk of this.stream(req)) {
      if (chunk.type === "text_delta") text += chunk.text;
    }
    return { text, stopReason: "end_turn" };
  }
}

async function runWithProvider(provider: AIProvider, prompt: string) {
  return provider.complete({ messages: [{ role: "user", content: prompt }] });
}

describe("AIProvider swap", () => {
  it("mock provider가 AIProvider 인터페이스를 만족하고 실행 가능하다", async () => {
    const result = await runWithProvider(new MockProvider(), "hello");
    expect(result.text).toBe("echo:hello");
    expect(result.stopReason).toBe("end_turn");
  });

  it("ClaudeProvider도 동일한 함수 시그니처(AIProvider)로 주입 가능하다 (타입 검증)", () => {
    const provider: AIProvider = new ClaudeProvider("dummy-key-not-called");
    expect(provider.name).toBe("claude");
  });
});
