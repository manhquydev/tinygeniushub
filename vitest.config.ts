import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@/components/lesson-wizard/lesson-start-card": path.resolve(
        __dirname,
        "src/test/mocks/lesson-start-card.mock.tsx",
      ),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
