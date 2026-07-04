import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// Next.js는 .env.local을 자체적으로 로드하지만, Playwright test runner는
// 별도 Node 프로세스라 로드하지 않는다 — 여기서 직접 파싱해 주입한다.
function loadDotEnvLocal() {
  const envPath = path.resolve(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvLocal();

// T20 E2E 스모크 테스트 — MockProvider로 실제 Claude API 비용 없이 화면 배선을 검증한다.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...process.env,
      GENESIS_AI_PROVIDER: "mock",
    },
  },
});
