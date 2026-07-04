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
});
