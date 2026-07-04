// AI Provider Adapter (M9) — docs/Architecture.md §5.4
// 엔진 모듈이므로 react/next 의존성 금지.

export interface CompletionMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  system?: string;
  messages: CompletionMessage[];
  maxTokens?: number;
}

export interface CompletionResult {
  text: string;
  stopReason: string | null;
}

export type CompletionChunk =
  | { type: "text_delta"; text: string }
  | { type: "done"; stopReason: string | null };

export interface AIProvider {
  readonly name: string;
  stream(req: CompletionRequest): AsyncIterable<CompletionChunk>;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}
