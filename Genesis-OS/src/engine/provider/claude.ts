import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  CompletionChunk,
  CompletionRequest,
  CompletionResult,
} from "./types";

export const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4096;

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  private client: Anthropic;
  readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async *stream(req: CompletionRequest): AsyncIterable<CompletionChunk> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "text_delta", text: event.delta.text };
      }
    }

    const final = await stream.finalMessage();
    yield { type: "done", stopReason: final.stop_reason };
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    let text = "";
    let stopReason: string | null = null;

    for await (const chunk of this.stream(req)) {
      if (chunk.type === "text_delta") text += chunk.text;
      if (chunk.type === "done") stopReason = chunk.stopReason;
    }

    return { text, stopReason };
  }
}
