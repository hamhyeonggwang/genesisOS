// 구조화 질문 출력 스키마 + 파싱 (docs/API.md §2 question 스키마, Architecture.md §5.2)
// 파싱 실패 시 1회 재요청 후 자유 텍스트 폴백 — 이 파일은 그 판정·폴백 로직만 담당한다.
// 실제 재요청 호출(provider.complete 2회 호출)은 세션 API(T09)의 책임이다.

export interface QuestionOption {
  label: string;
  description: string;
  recommended?: boolean;
}

export interface StructuredQuestion {
  question: string;
  why: string;
  what: string;
  how: string;
  category: string;
  options: QuestionOption[];
  is_phase_complete: boolean;
  summary?: string;
  /** 파싱에 실패해 자유 텍스트로 대체된 응답인지 여부. */
  fallback?: boolean;
}

export type ParseResult =
  | { ok: true; data: StructuredQuestion }
  | { ok: false; raw: string };

function isQuestionOption(v: unknown): v is QuestionOption {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.label === "string" && typeof o.description === "string";
}

function isStructuredQuestion(v: unknown): v is StructuredQuestion {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.question === "string" &&
    typeof o.why === "string" &&
    typeof o.what === "string" &&
    typeof o.how === "string" &&
    typeof o.category === "string" &&
    typeof o.is_phase_complete === "boolean" &&
    Array.isArray(o.options) &&
    o.options.every(isQuestionOption)
  );
}

/** ```json 코드펜스로 감싸져 있거나 앞뒤에 설명이 붙은 응답에서 JSON 블록만 추출한다. */
function extractJsonBlock(raw: string): string | null {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i) ?? raw.match(/```\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
}

/** AI 응답 원문을 구조화 질문으로 파싱한다. 실패하면 ok:false와 원문을 반환한다. */
export function parseStructuredQuestion(raw: string): ParseResult {
  const candidates = [raw.trim(), extractJsonBlock(raw)].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isStructuredQuestion(parsed)) {
        return { ok: true, data: parsed };
      }
    } catch {
      // 다음 후보로 계속
    }
  }

  return { ok: false, raw };
}

export const OUTPUT_FORMAT_INSTRUCTION = [
  "다음 JSON 스키마에 맞는 JSON만 출력하라 (설명, 코드펜스, 그 외 텍스트 없이):",
  '{"question":string,"why":string,"what":string,"how":string,"category":string,',
  '"options":[{"label":string,"description":string,"recommended"?:boolean}],',
  '"is_phase_complete":boolean,"summary"?:string}',
].join("\n");

/** 재요청 시 AI에게 보낼 보정 지시문 (엄격한 JSON 재포맷 요청). */
export function buildRetryInstruction(raw: string): string {
  return [
    "직전 응답이 요구된 JSON 스키마와 일치하지 않았다.",
    OUTPUT_FORMAT_INSTRUCTION,
    "",
    "직전 응답 원문:",
    raw,
  ].join("\n");
}

/**
 * 재요청까지 실패했을 때의 최종 폴백 — 자유 텍스트를 최소한의 유효한 구조로 감싼다.
 * 헌법 제6조: 미정 상태를 유지하며 AI가 임의로 완료를 선언하지 않는다 (is_phase_complete: false).
 */
export function toFreeformFallback(raw: string): StructuredQuestion {
  const text = raw.trim() || "질문을 생성하지 못했습니다. 다시 시도해 주세요.";
  return {
    question: text,
    why: "",
    what: "",
    how: "",
    category: "unknown",
    options: [],
    is_phase_complete: false,
    fallback: true,
  };
}
