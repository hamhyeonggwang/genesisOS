// 프롬프트 체계 (T08) — docs/Architecture.md §5.2·§5.3
// 엔진 모듈이므로 react/next 의존성 금지.

import type { PhaseName } from "@/types/domain";
import { CONSTITUTION_PROMPT } from "./constitution";
import { PHASE_INSTRUCTIONS } from "./phases";
import { OUTPUT_FORMAT_INSTRUCTION } from "./schema";

export * from "./schema";
export { CONSTITUTION_PROMPT } from "./constitution";
export { PHASE_INSTRUCTIONS } from "./phases";

export interface BuildSystemPromptInput {
  phase: PhaseName;
  /** engine/memory의 buildContext().text — Project Memory 주입 블록. */
  memoryContextText: string;
}

/**
 * 질문 세션의 시스템 프롬프트를 조립한다.
 * CONSTITUTION_PROMPT는 항상 동일한 고정 접두부로 두어 프롬프트 캐싱 적중률을 확보한다
 * (Architecture.md §5.3) — 이 함수를 수정할 때도 접두부 순서는 바꾸지 말 것.
 */
export function buildSystemPrompt({
  phase,
  memoryContextText,
}: BuildSystemPromptInput): string {
  const sections = [
    CONSTITUTION_PROMPT,
    `## 현재 단계: ${phase}\n${PHASE_INSTRUCTIONS[phase]}`,
    memoryContextText
      ? `## 지금까지의 결정\n${memoryContextText}`
      : "## 지금까지의 결정\n(아직 없음 — 이 단계의 첫 질문이다)",
    OUTPUT_FORMAT_INSTRUCTION,
  ];

  return sections.join("\n\n");
}
