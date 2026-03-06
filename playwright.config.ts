import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  // Use 1 worker so local runs match CI and avoid overloading the dev server (timeouts, ECONNRESET).
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 375, height: 667 },
    navigationTimeout: 45000,
  },
  timeout: 60000,
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "setup-with-property",
      testMatch: /auth-with-property\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "setup-with-moved-out-tenant",
      testMatch: /auth-with-moved-out-tenant\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "chromium-no-props",
      testMatch: /switch-property\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
      },
      dependencies: ["setup"],
    },
    {
      name: "chromium",
      testMatch: /^(?!.*(switch-property|moved-out-tenant-notes)\.spec\.ts).*\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
      },
      dependencies: ["chromium-no-props", "setup-with-property"],
    },
    {
      name: "chromium-moved-out-notes",
      testMatch: /moved-out-tenant-notes\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user-with-moved-out-tenant.json",
      },
      dependencies: ["setup-with-moved-out-tenant"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
