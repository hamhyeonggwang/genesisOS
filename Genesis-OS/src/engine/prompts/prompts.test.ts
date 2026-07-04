import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./index";
import {
  buildRetryInstruction,
  parseStructuredQuestion,
  toFreeformFallback,
} from "./schema";

const VALID_JSON = JSON.stringify({
  question: "MVP 사용자는 누구입니까?",
  why: "범위를 좁히기 위해",
  what: "1인 사용 vs 멀티유저",
  how: "선택지 중 고르거나 직접 입력",
  category: "users",
  options: [{ label: "나만", description: "1인 전용", recommended: true }],
  is_phase_complete: false,
});

describe("parseStructuredQuestion", () => {
  it("순수 JSON을 파싱한다", () => {
    const result = parseStructuredQuestion(VALID_JSON);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("users");
    }
  });

  it("```json 코드펜스로 감싸진 응답도 파싱한다", () => {
    const wrapped = "여기 질문입니다:\n```json\n" + VALID_JSON + "\n```\n참고하세요.";
    const result = parseStructuredQuestion(wrapped);
    expect(result.ok).toBe(true);
  });

  it("필수 필드가 빠진 JSON은 실패로 판정한다", () => {
    const broken = JSON.stringify({ question: "질문만 있음" });
    const result = parseStructuredQuestion(broken);
    expect(result.ok).toBe(false);
  });

  it("완전히 깨진 텍스트는 실패로 판정하고 원문을 보존한다", () => {
    const garbage = "죄송합니다, 형식을 지키지 못했습니다. 그냥 답변드리면...";
    const result = parseStructuredQuestion(garbage);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.raw).toBe(garbage);
    }
  });
});

describe("파싱 실패 → 폴백 경로 (T08 수용 기준)", () => {
  it("파싱 실패 시 재요청 지시문을 만들 수 있다", () => {
    const garbage = "형식이 깨진 응답";
    const instruction = buildRetryInstruction(garbage);
    expect(instruction).toContain("JSON");
    expect(instruction).toContain(garbage);
  });

  it("재요청도 실패하면 자유 텍스트 폴백으로 유효한 구조를 만든다", () => {
    const garbage = "여전히 JSON이 아닌 응답";
    const first = parseStructuredQuestion(garbage);
    expect(first.ok).toBe(false);

    // 재요청 응답도 파싱 실패했다고 가정
    const second = parseStructuredQuestion(garbage);
    expect(second.ok).toBe(false);

    const fallback = toFreeformFallback(garbage);
    expect(fallback.question).toBe(garbage);
    expect(fallback.fallback).toBe(true);
    expect(fallback.is_phase_complete).toBe(false); // 헌법 제6조: 임의로 완료 선언 금지
    expect(fallback.options).toEqual([]);
  });

  it("빈 원문이어도 폴백은 항상 유효한 question 문자열을 갖는다", () => {
    const fallback = toFreeformFallback("   ");
    expect(fallback.question.length).toBeGreaterThan(0);
  });
});

describe("buildSystemPrompt", () => {
  it("헌법·현재 단계 지침·메모리 컨텍스트·출력 형식을 모두 포함한다", () => {
    const prompt = buildSystemPrompt({
      phase: "define",
      memoryContextText: "### users\n- 나만 사용",
    });

    expect(prompt).toContain("제6조");
    expect(prompt).toContain("현재 단계: define");
    expect(prompt).toContain("나만 사용");
    expect(prompt).toContain("is_phase_complete");
  });

  it("결정이 없을 때는 첫 질문임을 명시한다", () => {
    const prompt = buildSystemPrompt({ phase: "discover", memoryContextText: "" });
    expect(prompt).toContain("첫 질문");
  });

  it("동일 phase·컨텍스트에 대해 항상 같은 프롬프트를 생성한다 (캐싱 전제)", () => {
    const a = buildSystemPrompt({ phase: "discover", memoryContextText: "x" });
    const b = buildSystemPrompt({ phase: "discover", memoryContextText: "x" });
    expect(a).toBe(b);
  });
});
