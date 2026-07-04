import { describe, expect, it } from "vitest";
import { buildContext, estimateTokens, settle } from "./index";
import type { ContextEntry } from "@/types/domain";

function entry(overrides: Partial<ContextEntry>): ContextEntry {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    project_id: "p1",
    phase: "define",
    question: "q",
    answer: "a",
    decision: "a",
    category: "scope",
    status: "confirmed",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("settle", () => {
  it("답변이 있으면 confirmed로 정착한다", () => {
    const result = settle({
      phase: "define",
      question: "MVP 사용자는?",
      answer: "  나만  ",
      category: "users",
    });
    expect(result.status).toBe("confirmed");
    expect(result.answer).toBe("나만");
    expect(result.decision).toBe("나만");
  });

  it("건너뛴 질문은 pending으로 기록하고 AI가 임의로 채우지 않는다", () => {
    const result = settle({
      phase: "define",
      question: "가격 정책은?",
      answer: null,
      category: "pricing",
      skipped: true,
    });
    expect(result.status).toBe("pending");
    expect(result.answer).toBeNull();
    expect(result.decision).toBeNull();
  });

  it("빈 답변도 pending으로 취급한다 (skipped 플래그 없이도)", () => {
    const result = settle({ phase: "define", question: "q", answer: "   ", category: "c" });
    expect(result.status).toBe("pending");
  });

  it("decision이 별도로 주어지면 answer 대신 사용한다", () => {
    const result = settle({
      phase: "define",
      question: "q",
      answer: "긴 원문 답변...",
      category: "c",
      decision: "요약된 결정",
    });
    expect(result.decision).toBe("요약된 결정");
    expect(result.answer).toBe("긴 원문 답변...");
  });
});

describe("buildContext", () => {
  it("pending 결정은 토큰 상한이 매우 작아도 항상 포함된다", () => {
    const entries = [
      entry({ status: "pending", category: "pricing", question: "가격은?", answer: null, decision: null }),
      ...Array.from({ length: 20 }, (_, i) =>
        entry({ category: "scope", decision: `결정 ${i}`.repeat(20) }),
      ),
    ];

    const ctx = buildContext(entries, { currentPhase: "define", tokenLimit: 1 });
    expect(ctx.text).toContain("가격은?");
    expect(ctx.pendingCount).toBe(1);
  });

  it("예산 내에서는 전체 결정이 그대로 포함된다", () => {
    const entries = [
      entry({ phase: "define", category: "users", decision: "나만 사용" }),
      entry({ phase: "design", category: "ux", decision: "하이브리드 세션 UI" }),
    ];
    const ctx = buildContext(entries, { currentPhase: "define", tokenLimit: 4000 });
    expect(ctx.truncated).toBe(false);
    expect(ctx.text).toContain("나만 사용");
    expect(ctx.text).toContain("하이브리드 세션 UI");
  });

  it("예산 초과 시 현재 phase는 전체 유지, 다른 phase는 압축된다", () => {
    const currentPhaseDecision = "define 단계의 상세한 결정 내용";
    const otherPhaseDecision = "discover 단계의 아주 상세하고 긴 결정 내용".repeat(50);

    const entries = [
      entry({ phase: "define", category: "users", decision: currentPhaseDecision }),
      entry({ phase: "discover", category: "problem", decision: otherPhaseDecision }),
    ];

    const ctx = buildContext(entries, { currentPhase: "define", tokenLimit: 50 });

    expect(ctx.truncated).toBe(true);
    expect(ctx.text).toContain(currentPhaseDecision);
    expect(ctx.text).not.toContain(otherPhaseDecision);
    expect(ctx.text).toContain("1건 확정");
  });
});

describe("estimateTokens", () => {
  it("문자수 기반 휴리스틱으로 근사한다", () => {
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});
