"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuestionOption, StructuredQuestion } from "@/engine/prompts";

/** F5 재개 시 입력 중이던 답변을 보존한다 (UX.md §7). */
export function QuestionCard({
  question,
  onAnswer,
  onSkip,
  disabled,
  draftKey,
}: {
  question: StructuredQuestion;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  disabled?: boolean;
  /** 로컬 스토리지에 초안을 보존할 키 (보통 프로젝트+단계 단위). */
  draftKey?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<QuestionOption | null>(null);
  const [freeText, setFreeText] = useState("");

  // 마운트 시(클라이언트 전용) 저장된 초안을 복원한다.
  useEffect(() => {
    if (!draftKey) return;
    const draft = window.localStorage.getItem(draftKey);
    if (draft) setFreeText(draft);
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    if (freeText) window.localStorage.setItem(draftKey, freeText);
    else window.localStorage.removeItem(draftKey);
  }, [draftKey, freeText]);

  const answerValue = freeText.trim() || selected?.label || "";

  function clearDraft() {
    if (draftKey) window.localStorage.removeItem(draftKey);
  }

  function submit() {
    if (!answerValue || disabled) return;
    clearDraft();
    onAnswer(answerValue);
  }

  function selectOption(option: QuestionOption) {
    setSelected(option);
    setFreeText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      submit();
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= question.options.length) {
      selectOption(question.options[n - 1]);
    }
  }

  return (
    <div
      className="space-y-4 rounded-lg border p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div>
        <p className="font-medium">{question.question}</p>
        {(question.why || question.what || question.how) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {expanded ? "왜/무엇을/어떻게 접기 ▲" : "왜/무엇을/어떻게 펼치기 ▼"}
          </button>
        )}
        {expanded && (
          <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
            {question.why && (
              <div>
                <dt className="inline font-semibold">WHY </dt>
                <dd className="inline">{question.why}</dd>
              </div>
            )}
            {question.what && (
              <div>
                <dt className="inline font-semibold">WHAT </dt>
                <dd className="inline">{question.what}</dd>
              </div>
            )}
            {question.how && (
              <div>
                <dt className="inline font-semibold">HOW </dt>
                <dd className="inline">{question.how}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {question.options.length > 0 && (
        <div className="space-y-2">
          {question.options.map((option, i) => (
            <button
              key={option.label}
              type="button"
              disabled={disabled}
              onClick={() => selectOption(option)}
              className={cn(
                "w-full rounded-md border p-2 text-left text-sm transition-colors",
                selected?.label === option.label
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50",
              )}
            >
              <span className="mr-2 text-xs text-muted-foreground">{i + 1}</span>
              <span className="font-medium">{option.label}</span>
              {option.recommended && (
                <span className="ml-1 text-xs text-primary">(추천)</span>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="free-text" className="text-xs text-muted-foreground">
          직접 입력
        </label>
        <textarea
          id="free-text"
          rows={2}
          disabled={disabled}
          value={freeText}
          onChange={(e) => {
            setFreeText(e.target.value);
            setSelected(null);
          }}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="선택지 대신 직접 답변할 수 있습니다"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={!answerValue || disabled}
          onClick={submit}
          className="flex-1"
        >
          답변 확정
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            clearDraft();
            onSkip();
          }}
        >
          건너뛰기
        </Button>
      </div>
    </div>
  );
}
