// 클라이언트 SSE 파서 — fetch 스트림을 소비한다 (EventSource 미사용, Architecture.md §6).

export interface ParsedSseEvent {
  event: string;
  data: Record<string, unknown>;
}

/** SSE 프레임 텍스트("event: x\ndata: {...}\n\n" 반복)를 이벤트 배열로 파싱한다. */
export function parseSseChunk(text: string): ParsedSseEvent[] {
  return text
    .split("\n\n")
    .map((frame) => frame.trim())
    .filter(Boolean)
    .map((frame) => {
      const eventLine = frame.split("\n").find((l) => l.startsWith("event: "));
      const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
      return {
        event: eventLine?.slice("event: ".length) ?? "message",
        data: dataLine ? JSON.parse(dataLine.slice("data: ".length)) : {},
      };
    });
}

/** Response 스트림을 순회하며 파싱된 SSE 이벤트를 콜백에 전달한다. */
export async function consumeSseResponse(
  response: Response,
  onEvent: (event: ParsedSseEvent) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const trimmed = frame.trim();
      if (!trimmed) continue;
      for (const event of parseSseChunk(trimmed)) {
        onEvent(event);
      }
    }
  }

  if (buffer.trim()) {
    for (const event of parseSseChunk(buffer)) {
      onEvent(event);
    }
  }
}
