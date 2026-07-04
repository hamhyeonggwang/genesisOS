// Handoff 엔진 (T16) — docs/Architecture.md §5.5
// 엔진 모듈이므로 react/next 의존성 금지.

import type { AIProvider } from "@/engine/provider";
import { CONSTITUTION_PROMPT } from "@/engine/prompts";
import { DOC_TITLES } from "@/engine/docgen";
import type { ContextEntry, DocType } from "@/types/domain";

export interface HandoffDoc {
  type: DocType;
  content_md: string;
}

export interface HandoffInput {
  projectName: string;
  projectIdea: string;
  entries: ContextEntry[];
  documents: HandoffDoc[];
  provider: AIProvider;
}

export type HandoffEvent =
  | { type: "claude_md_delta"; text: string }
  | { type: "claude_md_done"; content: string }
  | { type: "tasks_delta"; text: string }
  | { type: "tasks_done"; content: string }
  | { type: "start_prompt_done"; content: string };

function docsBlock(documents: HandoffDoc[]): string {
  return documents
    .map((d) => `### ${DOC_TITLES[d.type]}\n${d.content_md}`)
    .join("\n\n");
}

function decisionsBlock(entries: ContextEntry[]): string {
  const confirmed = entries.filter((e) => e.status === "confirmed");
  return confirmed.map((e) => `- [${e.phase}/${e.category}] ${e.decision}`).join("\n");
}

function buildClaudeMdPrompt(input: Omit<HandoffInput, "provider">): string {
  return [
    CONSTITUTION_PROMPT,
    `## 문서 생성 지시\n프로젝트: ${input.projectName}\n한 줄 설명: ${input.projectIdea}\n\n` +
      "지금 작성할 문서: CLAUDE.md (구현 세션의 프로젝트 규칙)\n" +
      "반드시 아래 5개 섹션을 이 순서로 포함하라:\n" +
      "1. 제품 한 줄 정의\n" +
      "2. 확정 스택 & 개발 규칙\n" +
      "3. 핵심 결정 10선 (아래 '확정된 결정'에서 가장 중요한 것 우선으로 최대 10개 선정)\n" +
      "4. 문서 색인 (docs/PRD.md, docs/IA.md, docs/UX.md, docs/Architecture.md, docs/API.md, docs/Roadmap.md)\n" +
      "5. 충돌 및 작업 규칙 (설계 문서와 코드가 충돌하면 문서가 우선, 변경이 필요하면 " +
      "구현하지 말고 docs/retro-notes.md에 기록할 것)",
    `## 확정된 결정 (전체 단계)\n${decisionsBlock(input.entries) || "(없음)"}`,
    `## 승인된 문서\n${docsBlock(input.documents)}`,
    "## 출력 형식\nMarkdown 문서 본문만 출력하라 (설명, 코드펜스, 메타 코멘트 금지). `# 제목`으로 시작할 것.",
  ].join("\n\n");
}

function buildTasksPrompt(input: Omit<HandoffInput, "provider">): string {
  return [
    CONSTITUTION_PROMPT,
    `## 문서 생성 지시\n프로젝트: ${input.projectName}\n한 줄 설명: ${input.projectIdea}\n\n` +
      "지금 작성할 문서: tasks.md (개발 태스크 목록)\n" +
      "승인된 Architecture·API 문서를 근거로 구현 순서(마일스톤)를 나누고, " +
      "각 태스크에 체크박스와 수용 기준을 명시하라. 의존성 순서로 정렬할 것.",
    `## 승인된 문서\n${docsBlock(input.documents)}`,
    "## 출력 형식\nMarkdown 문서 본문만 출력하라 (설명, 코드펜스, 메타 코멘트 금지). `# 제목`으로 시작할 것.",
  ].join("\n\n");
}

/** START_PROMPT는 프로젝트마다 창의적 내용이 필요 없는 보일러플레이트라 AI 호출 없이 조립한다. */
export function buildStartPrompt(projectName: string): string {
  return [
    `# ${projectName} — 구현 시작 프롬프트`,
    "",
    "> 아래 내용을 Claude Code 첫 구현 세션에 붙여넣는다.",
    "",
    "---",
    "",
    `${projectName} 웹앱 구현을 시작한다. 너는 이 프로젝트의 구현 담당 개발자다.`,
    "",
    "## 컨텍스트",
    "",
    "이 폴더에는 Genesis OS Handoff 패키지가 있다:",
    "",
    "- `CLAUDE.md` — 프로젝트 규칙 (자동 로드됨)",
    "- `docs/` — PRD·Roadmap·IA·UX·Architecture·API",
    "- `tasks.md` — 개발 태스크 목록",
    "",
    "## 진행 규칙",
    "",
    "- tasks.md 순서대로 진행하고, 각 태스크의 수용 기준을 실제로 검증한 후 커밋한다.",
    "- 설계 문서와 충돌하는 판단이 생기면 구현하지 말고 `docs/retro-notes.md`에 기록하고 다음 태스크로 진행한다.",
    "- 막히면 추측하지 말고 질문한다.",
    "",
    "시작: tasks.md의 첫 번째 미완료 태스크부터 진행하라.",
  ].join("\n");
}

/** Handoff 패키지의 CLAUDE.md·tasks.md를 순차 생성한다 (Architecture.md §5.5). */
export async function* runHandoff({
  projectName,
  projectIdea,
  entries,
  documents,
  provider,
}: HandoffInput): AsyncGenerator<HandoffEvent> {
  const input = { projectName, projectIdea, entries, documents };

  let claudeMd = "";
  for await (const chunk of provider.stream({
    system: buildClaudeMdPrompt(input),
    messages: [{ role: "user", content: "CLAUDE.md를 작성하라." }],
    maxTokens: 2048,
  })) {
    if (chunk.type === "text_delta") {
      claudeMd += chunk.text;
      yield { type: "claude_md_delta", text: chunk.text };
    }
  }
  yield { type: "claude_md_done", content: claudeMd };

  let tasksMd = "";
  for await (const chunk of provider.stream({
    system: buildTasksPrompt(input),
    messages: [{ role: "user", content: "tasks.md를 작성하라." }],
    maxTokens: 4096,
  })) {
    if (chunk.type === "text_delta") {
      tasksMd += chunk.text;
      yield { type: "tasks_delta", text: chunk.text };
    }
  }
  yield { type: "tasks_done", content: tasksMd };

  yield { type: "start_prompt_done", content: buildStartPrompt(projectName) };
}
