import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? "3200");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "true";
const webServerCommand =
  process.platform === "win32"
    ? `cmd /c "set CI=true&& pnpm build && pnpm exec next start --port ${port}"`
    : `CI=true pnpm build && pnpm exec next start --port ${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/playwright-artifacts",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "test-results/playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer,
    timeout: 600_000,
  },
});
