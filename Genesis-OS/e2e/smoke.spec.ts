import { test, expect } from "@playwright/test";

// T20 — 신규 프로젝트 생성부터 Discover 질문 세션 첫 질문 로딩까지의 화면 배선을
// MockProvider(GENESIS_AI_PROVIDER=mock, playwright.config.ts)로 검증한다.
// 전체 5단계·Handoff zip까지는 실제 Claude API 멀티턴 대화가 필요해 비용·시간·
// 비결정성 문제로 이 스모크 테스트 범위에서 제외했다 (tasks.md T20 참고).
// 해당 전체 플로우는 이 개발 세션에서 실제 Claude API로 반복 검증했다.

test("로그인 → 새 프로젝트 생성 → Discover 세션 첫 질문 로딩", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  test.skip(!email || !password, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD 미설정");

  await page.goto("/login");
  await page.fill("#email", email!);
  await page.fill("#password", password!);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");

  await page.click('a[href="/projects/new"]');
  await page.waitForURL("/projects/new");

  const projectName = `E2E Smoke ${Date.now()}`;
  await page.fill("#name", projectName);
  await page.fill("#idea", "Playwright 스모크 테스트용 프로젝트입니다.");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/projects\/[0-9a-f-]{36}$/);

  await expect(page.getByText("Discover 질문 세션 계속하기")).toBeVisible();
  await page.getByText("Discover 질문 세션 계속하기").click();
  await page.waitForURL(/\/session\/discover$/);

  await expect(
    page.getByText("이 프로젝트의 핵심 문제는 무엇인가요? (mock)"),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByText("옵션 A").click();
  await page.click('button:has-text("답변 확정")');

  await expect(page.getByText("problem_definition")).toBeVisible({
    timeout: 15_000,
  });
});
