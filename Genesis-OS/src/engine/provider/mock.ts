import type {
  AIProvider,
  CompletionChunk,
  CompletionRequest,
  CompletionResult,
} from "./types";

/**
 * Mock provider for development/testing without API costs.
 * Simulates Claude responses with realistic delays.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly model: string;

  constructor(model: string = "mock-sonnet") {
    this.model = model;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getMockResponse(req: CompletionRequest): string {
    const content = req.messages[req.messages.length - 1]?.content || "";

    // 질문 유형별 목 응답
    if (content.toLowerCase().includes("project")) {
      return JSON.stringify({
        decision: "web-app",
        rationale: "[Mock] 이것은 테스트 응답입니다.",
      });
    }

    if (content.toLowerCase().includes("target")) {
      return JSON.stringify({
        audience: "startup-founders",
        painPoints: ["time-to-market", "design-implementation-gap"],
      });
    }

    // 기본 응답
    return JSON.stringify({
      status: "mocked",
      message: `Mock response to: ${content.substring(0, 50)}...`,
    });
  }

  async *stream(req: CompletionRequest): AsyncIterable<CompletionChunk> {
    const response = this.getMockResponse(req);

    // 스트림 효과: 단어 단위로 느리게 전송
    const words = response.split(" ");
    for (const word of words) {
      await this.delay(50); // 50ms 간격
      yield { type: "text_delta", text: word + " " };
    }

    yield { type: "done", stopReason: "end_turn" };
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    let text = "";

    for await (const chunk of this.stream(req)) {
      if (chunk.type === "text_delta") text += chunk.text;
    }

    return { text: text.trim(), stopReason: "end_turn" };
  }
}
