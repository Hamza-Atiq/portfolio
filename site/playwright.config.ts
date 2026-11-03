import { defineConfig, devices } from "@playwright/test";

/**
 * Acceptance tests (plan Task 14). Start the site first (`npm run build && npm start`), then:
 *   BASE_URL=http://localhost:3000 npx playwright test
 * PW_CHROMIUM_PATH can point to an already installed Chromium (cloud sandbox).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
