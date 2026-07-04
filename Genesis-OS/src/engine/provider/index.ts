// Provider 선택: env GENESIS_AI_PROVIDER (docs/Architecture.md §5.4)
// 서버 전용 env만 참조 — 이 모듈은 API Route에서만 호출된다.

import { ClaudeProvider } from "./claude";
import type { AIProvider } from "./types";

export type { AIProvider, CompletionRequest, CompletionResult, CompletionChunk } from "./types";
export { ClaudeProvider } from "./claude";

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
      cached = new ClaudeProvider(apiKey);
      return cached;
    }
    default:
      throw new Error(`Unknown GENESIS_AI_PROVIDER: ${kind}`);
  }
}
