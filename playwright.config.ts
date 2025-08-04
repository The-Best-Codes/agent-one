import { defineConfig, devices } from "@playwright/test";

const PORT = 1420;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium-desktop-light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "chromium-desktop-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
    {
      name: "firefox-desktop-light",
      use: { ...devices["Desktop Firefox"], colorScheme: "light" },
    },
    {
      name: "firefox-desktop-dark",
      use: { ...devices["Desktop Firefox"], colorScheme: "dark" },
    },
    {
      name: "webkit-desktop-light",
      use: { ...devices["Desktop Safari"], colorScheme: "light" },
    },
    {
      name: "webkit-desktop-dark",
      use: { ...devices["Desktop Safari"], colorScheme: "dark" },
    },
    {
      name: "iphone-14-light",
      use: { ...devices["iPhone 14"], colorScheme: "light", isMobile: true },
    },
    {
      name: "iphone-14-dark",
      use: { ...devices["iPhone 14"], colorScheme: "dark", isMobile: true },
    },
    {
      name: "pixel-7-light",
      use: { ...devices["Pixel 7"], colorScheme: "light", isMobile: true },
    },
    {
      name: "pixel-7-dark",
      use: { ...devices["Pixel 7"], colorScheme: "dark", isMobile: true },
    },
  ],
});
