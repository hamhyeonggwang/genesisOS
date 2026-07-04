// SSE 인코딩 — docs/Architecture.md §6 (Route Handler에서 ReadableStream으로 스트리밍)

type SseEvent = { type: string } & Record<string, unknown>;

function encodeEvent(event: string, data: unknown): Uint8Array {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

export function sseResponse(events: AsyncIterable<SseEvent>): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) {
          const { type, ...rest } = event;
          controller.enqueue(encodeEvent(type, rest));
        }
      } catch (err) {
        controller.enqueue(
          encodeEvent("error", {
            message: err instanceof Error ? err.message : "stream error",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
