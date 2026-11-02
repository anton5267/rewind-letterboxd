import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["device-mobile-action-sheet.spec.ts", "global-search-journal-populated.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "Android Chrome emulation", use: { ...devices["Pixel 7"], browserName: "chromium", baseURL } },
    { name: "iOS Safari WebKit emulation", use: { ...devices["iPhone 13"], browserName: "webkit", baseURL } },
  ],
});
