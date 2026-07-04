// Provider 선택: env GENESIS_AI_PROVIDER (docs/Architecture.md §5.4)
// 서버 전용 env만 참조 — 이 모듈은 API Route에서만 호출된다.

import { ClaudeProvider, DEFAULT_MODEL } from "./claude";
import { MockProvider } from "./mock";
import type { AIProvider } from "./types";

export type { AIProvider, CompletionRequest, CompletionResult, CompletionChunk } from "./types";
export { ClaudeProvider } from "./claude";
export { MockProvider } from "./mock";

let cached: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (cached) return cached;

  const kind = process.env.GENESIS_AI_PROVIDER ?? "claude";

  switch (kind) {
    case "claude": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not set");
      }
      cached = new ClaudeProvider(apiKey, process.env.GENESIS_AI_MODEL);
      return cached;
    }
    // T20 E2E 스모크 테스트 전용 — 프로덕션에서는 절대 설정하지 말 것.
    case "mock": {
      cached = new MockProvider();
      return cached;
    }
    default:
      throw new Error(`Unknown GENESIS_AI_PROVIDER: ${kind}`);
  }
}

/** SC-10 설정 화면용 — 비밀 정보 없이 현재 provider 설정만 노출한다. */
export function getProviderConfig(): { provider: string; model: string } {
  return {
    provider: process.env.GENESIS_AI_PROVIDER ?? "claude",
    model: process.env.GENESIS_AI_MODEL ?? DEFAULT_MODEL,
  };
}
