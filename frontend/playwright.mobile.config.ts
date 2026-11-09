import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "device-mobile-action-sheet.spec.ts",
    "home-recent-watched-live.spec.ts",
    "messages-live-flow.spec.ts",
    "movie-review-comments-live-flow.spec.ts",
    "review-like-live-flow.spec.ts",
    "notification-preferences-live-flow.spec.ts",
    "profile-social-links-live-flow.spec.ts",
    "profile-flow.spec.ts",
    "popular-reviewers-live.spec.ts",
    "global-search-journal-populated.spec.ts",
    "films-mobile-catalog-runtime.spec.ts",
    "films-discovery-recovery.spec.ts",
    "films-discovery-matched-runtime.spec.ts",
    "list-create-draft.spec.ts",
    "list-create-auth-return.spec.ts",
    "public-list-detail-figma.spec.ts",
    "tagged-lists-ready-layout.spec.ts",
  ],
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
