/**
 * Playwright config — desktop + mobile-viewport projects.
 *
 * Standalone variant (everythingrated does not use @saas-maker/test-config).
 * The `mobile` project uses the iPhone 13 descriptor = 390px wide, the Wave 1
 * mobile target, so mobile regressions in the multi-axis rating UI are caught.
 *
 * Run only the mobile project:  pnpm exec playwright test --project=mobile
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Desktop baseline.
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Mobile-viewport project — iPhone 13 is 390px wide, the Wave 1 target.
    // The multi-axis rating UI is everythingrated's core mobile case.
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
