import { describe, expect, it } from "vitest";
import {
  assertTransition,
  initialPhaseStatuses,
  nextPhase,
  PipelineTransitionError,
} from "./index";

describe("pipeline state machine", () => {
  it("초기 상태는 discover만 active, 나머지 locked", () => {
    expect(initialPhaseStatuses()).toEqual({
      discover: "active",
      define: "locked",
      design: "locked",
      engineer: "locked",
      handoff: "locked",
    });
  });

  it("허용된 전이는 통과한다", () => {
    expect(() => assertTransition("locked", "active")).not.toThrow();
    expect(() => assertTransition("active", "in_review")).not.toThrow();
    expect(() => assertTransition("in_review", "done")).not.toThrow();
    expect(() => assertTransition("done", "stale")).not.toThrow();
    expect(() => assertTransition("stale", "done")).not.toThrow();
  });

  it("허용되지 않은 전이는 PipelineTransitionError를 던진다", () => {
    expect(() => assertTransition("active", "done")).toThrow(
      PipelineTransitionError,
    );
    expect(() => assertTransition("locked", "done")).toThrow(
      PipelineTransitionError,
    );
  });

  it("nextPhase는 파이프라인 순서를 따른다", () => {
    expect(nextPhase("discover")).toBe("define");
    expect(nextPhase("handoff")).toBeNull();
  });
});
