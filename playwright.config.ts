import { defineConfig, devices } from "@playwright/test";

// Mobile Safari requires WebKit system dependencies that aren't available everywhere.
// Only include it when explicitly enabled via PLAYWRIGHT_WEBKIT=1
const includeWebkit = process.env.PLAYWRIGHT_WEBKIT === "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    ...(includeWebkit
      ? [
          {
            name: "Mobile Safari",
            use: { ...devices["iPhone 14"] },
          },
        ]
      : []),
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
