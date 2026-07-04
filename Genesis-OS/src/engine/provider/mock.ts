// T20 E2E 스모크 테스트 전용 — 실제 Claude API 호출 없이 결정론적으로 응답한다.
// GENESIS_AI_PROVIDER=mock일 때만 사용 (프로덕션 경로에서는 선택되지 않음).

import type {
  AIProvider,
  CompletionChunk,
  CompletionRequest,
  CompletionResult,
} from "./types";

const MOCK_QUESTION_JSON = JSON.stringify({
  question: "이 프로젝트의 핵심 문제는 무엇인가요? (mock)",
  why: "E2E 스모크 테스트용 고정 응답입니다.",
  what: "실제 Claude API를 호출하지 않고 화면 배선만 검증합니다.",
  how: "아무 옵션이나 선택하거나 직접 입력하세요.",
  category: "problem_definition",
  options: [
    { label: "옵션 A", description: "mock 옵션 설명 A" },
    { label: "옵션 B", description: "mock 옵션 설명 B" },
  ],
  is_phase_complete: false,
});

export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "mock-v1";

  async *stream(_req: CompletionRequest): AsyncIterable<CompletionChunk> {
    yield { type: "text_delta", text: MOCK_QUESTION_JSON };
    yield { type: "done", stopReason: "end_turn" };
  }

  async complete(_req: CompletionRequest): Promise<CompletionResult> {
    return { text: MOCK_QUESTION_JSON, stopReason: "end_turn" };
  }
}
