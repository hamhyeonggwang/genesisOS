import path from "node:path";
import { defineConfig } from "vitest/config";

// Vitest 4의 기본 tsconfig-paths 해석은 파일 alias(@/types/domain)는 되지만
// 디렉터리 barrel(@/engine/memory → index.ts)은 처리하지 못한다.
// resolve.alias로 명시해 tsconfig의 @/* 매핑과 동일하게 맞춘다.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // e2e/는 Playwright 전용 (T20) — vitest 기본 글롭(**/*.spec.ts)과 겹쳐 제외한다.
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});
