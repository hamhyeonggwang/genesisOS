// Knowledge & Memory System — M1→M2 정착 + 컨텍스트 주입 (docs/Architecture.md §5.3)
// 엔진 모듈이므로 react/next/Supabase 의존성 금지 (순수 로직, I/O는 API 라우트가 담당).

import type { ContextEntry, EntryStatus, PhaseName } from "@/types/domain";

export const DEFAULT_TOKEN_LIMIT = 4000;

export interface SettleInput {
  phase: PhaseName;
  question: string;
  answer: string | null;
  category: string;
  /** AI가 생성한 결정 요약. 없으면 answer를 그대로 사용한다. */
  decision?: string | null;
  skipped?: boolean;
}

export interface SettledEntry {
  phase: PhaseName;
  question: string;
  answer: string | null;
  decision: string | null;
  category: string;
  status: EntryStatus;
}

/** M1(세션 답변)을 M2(context_entries insert 페이로드)로 정착시킨다. */
export function settle(input: SettleInput): SettledEntry {
  const trimmedAnswer = input.answer?.trim() || null;
  const isSkipped = input.skipped === true || !trimmedAnswer;

  if (isSkipped) {
    return {
      phase: input.phase,
      question: input.question,
      answer: null,
      decision: null,
      category: input.category,
      status: "pending",
    };
  }

  return {
    phase: input.phase,
    question: input.question,
    answer: trimmedAnswer,
    decision: (input.decision ?? trimmedAnswer).trim(),
    category: input.category,
    status: "confirmed",
  };
}

/** 토큰 수 근사치 (문자수/4 — 정밀 계산이 아닌 예산 판단용 휴리스틱). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface BuildContextOptions {
  currentPhase: PhaseName;
  tokenLimit?: number;
}

export interface BuiltContext {
  /** 시스템 프롬프트에 그대로 주입할 텍스트 블록. */
  text: string;
  truncated: boolean;
  confirmedCount: number;
  pendingCount: number;
}

function groupByCategory(entries: ContextEntry[]): Map<string, ContextEntry[]> {
  const map = new Map<string, ContextEntry[]>();
  for (const e of entries) {
    const list = map.get(e.category) ?? [];
    list.push(e);
    map.set(e.category, list);
  }
  return map;
}

function renderFull(entries: ContextEntry[]): string {
  const byCategory = groupByCategory(entries);
  return Array.from(byCategory.entries())
    .map(([category, es]) => {
      const lines = es.map((e) => `- ${e.decision}`).join("\n");
      return `### ${category}\n${lines}`;
    })
    .join("\n\n");
}

const COMPRESSED_SUMMARY_MAX_CHARS = 80;

function truncateForSummary(text: string | null): string {
  if (!text) return "";
  return text.length > COMPRESSED_SUMMARY_MAX_CHARS
    ? `${text.slice(0, COMPRESSED_SUMMARY_MAX_CHARS)}…`
    : text;
}

function renderCompressed(entries: ContextEntry[]): string {
  const byCategory = groupByCategory(entries);
  return Array.from(byCategory.entries())
    .map(([category, es]) => {
      const latest = es[es.length - 1];
      return `### ${category}\n- (${es.length}건 확정 · 최신: ${truncateForSummary(latest.decision)})`;
    })
    .join("\n\n");
}

function renderPending(entries: ContextEntry[]): string {
  if (!entries.length) return "";
  const lines = entries
    .map((e) => `- [${e.category}] ${e.question}`)
    .join("\n");
  return `## 미정 — 답변 없이 넘어간 항목 (임의로 채우지 말 것)\n${lines}`;
}

/**
 * M2 Project Memory를 AI 세션에 주입할 컨텍스트로 조립한다.
 * - confirmed 결정은 카테고리별로 전체 주입한다.
 * - pending(미정) 결정은 예산과 무관하게 항상 주입한다 (헌법 제6조).
 * - 토큰 상한 초과 시 현재 phase의 결정은 전체 유지, 그 외 phase는 카테고리당 1줄로 압축한다.
 */
export function buildContext(
  entries: ContextEntry[],
  { currentPhase, tokenLimit = DEFAULT_TOKEN_LIMIT }: BuildContextOptions,
): BuiltContext {
  const confirmed = entries.filter((e) => e.status === "confirmed");
  const pending = entries.filter((e) => e.status === "pending");

  const pendingBlock = renderPending(pending);
  const fullBlock = renderFull(confirmed);
  const fullText = [pendingBlock, fullBlock].filter(Boolean).join("\n\n");

  if (estimateTokens(fullText) <= tokenLimit) {
    return {
      text: fullText,
      truncated: false,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
    };
  }

  const currentEntries = confirmed.filter((e) => e.phase === currentPhase);
  const otherEntries = confirmed.filter((e) => e.phase !== currentPhase);

  const compressedText = [
    pendingBlock,
    renderFull(currentEntries),
    otherEntries.length ? renderCompressed(otherEntries) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    text: compressedText,
    truncated: true,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
  };
}
