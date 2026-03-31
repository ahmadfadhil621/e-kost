import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { outputFolder: "playwright-report" }]] : "list",
  globalTeardown: "./e2e/setup/teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 375, height: 667 },
    navigationTimeout: 60000,
    // CI: avoid /dev/shm size issues in containers
    launchOptions: process.env.CI ? { args: ["--disable-dev-shm-usage"] } : undefined,
  },
  timeout: 90000,
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
      dependencies: ["setup", "chromium-no-props"],
    },
    {
      name: "setup-with-moved-out-tenant",
      testMatch: /auth-with-moved-out-tenant\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup", "chromium-no-props"],
    },
    {
      name: "setup-no-active",
      testMatch: /auth-with-property-no-active\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup", "chromium-no-props"],
    },
    {
      name: "setup-single-property",
      testMatch: /auth-single-property\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
      },
      dependencies: ["setup"],
    },
    {
      name: "chromium-no-props",
      testMatch: /switch-property\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user.json"
      },
      dependencies: ["setup"],
    },
    // Auth specs that require unauthenticated browser (no storage state).
    {
      name: "chromium-auth",
      testMatch: /(register|login|session-redirect)\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
      },
      dependencies: ["setup"],
    },
    {
      name: "chromium-property-selector",
      testMatch: /property-selector\/.*\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user-properties-no-active.json",
      },
      dependencies: ["setup-no-active"],
    },
    {
      name: "chromium-single-property",
      testMatch: /nav-disabled-no-property\/.*\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user-single-property-no-active.json",
      },
      dependencies: ["setup-single-property"],
    },
    {
      name: "chromium",
      testMatch: /^(?!.*(switch-property|moved-out-tenant-notes|property-selector|register|login|session-redirect)\.spec\.ts).*\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        storageState: "e2e/.auth/user-with-property.json"
      },
      dependencies: ["chromium-no-props", "setup-with-property", "setup-single-property", "setup-with-moved-out-tenant"],
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
  // CI: use production server (build already ran in workflow). Local: dev server.
  webServer: process.env.CI
    ? {
        command: "npx next start",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
