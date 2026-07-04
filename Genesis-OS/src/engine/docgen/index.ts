// Docgen 엔진 (T13) — docs/Architecture.md §5.5
// 엔진 모듈이므로 react/next 의존성 금지.

import type { AIProvider } from "@/engine/provider";
import { buildContext } from "@/engine/memory";
import { CONSTITUTION_PROMPT } from "@/engine/prompts";
import type { ContextEntry, DocType, PhaseName } from "@/types/domain";
import { DOC_INSTRUCTIONS, DOC_TITLES, PHASE_DOC_TYPES } from "./phase-docs";

export { PHASE_DOC_TYPES, DOC_TITLES, DOC_TYPE_PHASE } from "./phase-docs";

export interface PriorDocument {
  type: DocType;
  content_md: string;
}

export interface DocgenInput {
  phase: PhaseName;
  projectName: string;
  projectIdea: string;
  entries: ContextEntry[];
  /** 이미 승인된 상위 단계 문서 (예: design 생성 시 prd·roadmap). */
  priorDocuments: PriorDocument[];
  provider: AIProvider;
}

export type DocgenEvent =
  | { type: "doc_start"; docType: DocType }
  | { type: "doc_delta"; docType: DocType; text: string }
  | { type: "doc_done"; docType: DocType; content: string };

function buildDocSystemPrompt({
  docType,
  phase,
  projectName,
  projectIdea,
  memoryContextText,
  priorDocuments,
}: {
  docType: DocType;
  phase: PhaseName;
  projectName: string;
  projectIdea: string;
  memoryContextText: string;
  priorDocuments: PriorDocument[];
}): string {
  const priorDocsBlock = priorDocuments.length
    ? priorDocuments
        .map((d) => `### ${DOC_TITLES[d.type]}\n${d.content_md}`)
        .join("\n\n")
    : "(없음)";

  return [
    CONSTITUTION_PROMPT,
    `## 문서 생성 지시\n프로젝트: ${projectName}\n한 줄 설명: ${projectIdea}\n\n지금 작성할 문서: ${DOC_TITLES[docType]}\n${DOC_INSTRUCTIONS[docType]}`,
    `## 확정된 결정 (${phase} 단계)\n${memoryContextText || "(없음)"}`,
    `## 승인된 상위 문서\n${priorDocsBlock}`,
    "## 출력 형식\nMarkdown 문서 본문만 출력하라 (설명, 코드펜스, 메타 코멘트 금지). `#` 제목으로 시작할 것.",
  ].join("\n\n");
}

/** 단계에 해당하는 문서들을 순차 생성한다 (Architecture.md §5.5 docgen 순서). */
export async function* runDocgen({
  phase,
  projectName,
  projectIdea,
  entries,
  priorDocuments,
  provider,
}: DocgenInput): AsyncGenerator<DocgenEvent> {
  const docTypes = PHASE_DOC_TYPES[phase];
  const context = buildContext(entries, { currentPhase: phase });

  for (const docType of docTypes) {
    yield { type: "doc_start", docType };

    const system = buildDocSystemPrompt({
      docType,
      phase,
      projectName,
      projectIdea,
      memoryContextText: context.text,
      priorDocuments,
    });

    let content = "";
    for await (const chunk of provider.stream({
      system,
      messages: [{ role: "user", content: `${DOC_TITLES[docType]} 문서를 작성하라.` }],
      maxTokens: 4096,
    })) {
      if (chunk.type === "text_delta") {
        content += chunk.text;
        yield { type: "doc_delta", docType, text: chunk.text };
      }
    }

    yield { type: "doc_done", docType, content };
    priorDocuments = [...priorDocuments, { type: docType, content_md: content }];
  }
}
