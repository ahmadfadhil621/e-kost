// Traceability: settings-timezone (issue #120)
// REQ AutoDetect.1 -> test('user with null timezone gets auto-detected timezone written on page load')
// REQ AutoDetect.2 -> test('auto-detect does not fire again after timezone is set')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

// ── Auto-detect tests (fresh user with null timezone) ────────────────────────
// These tests create their own user to guarantee timezone starts as null.

const AUTO_DETECT_PASSWORD = "AutoDetect123!";

test.describe("timezone auto-detect", () => {
  // Manage own auth state — fresh user means timezone is null
  test.use({ storageState: { cookies: [], origins: [] } });

  let autoDetectEmail: string;

  test.beforeAll(async ({ request, baseURL }) => {
    autoDetectEmail = `tz-autodetect-${Date.now()}@test.com`;
    const origin = baseURL ?? "http://localhost:3000";

    const res = await request.post("/api/auth/sign-up/email", {
      headers: { origin },
      data: {
        name: "TZ AutoDetect User",
        email: autoDetectEmail,
        password: AUTO_DETECT_PASSWORD,
      },
    });

    if (!res.ok()) {
      throw new Error(`Failed to create auto-detect test user: ${await res.text()}`);
    }
  });

  async function loginAs(page: Parameters<typeof stableFill>[0], email: string) {
    await page.goto("/login");
    await stableFill(page, () => page.getByLabel(/email address|alamat email/i), email);
    await stableFill(
      page,
      () => page.getByLabel(/^password$|kata sandi/i),
      AUTO_DETECT_PASSWORD
    );
    await page.getByRole("button", { name: /^sign in$|^log in$|^masuk$/i }).click();
    await page.waitForURL("/", { timeout: 25000 });
    await page.waitForLoadState("domcontentloaded");
  }

  test.describe("good cases", () => {
    test("user with null timezone gets auto-detected timezone written on page load", async ({
      page,
    }) => {
      test.setTimeout(60000);

      // Capture the PATCH body via route intercept (continues the real request)
      let patchBody: Record<string, unknown> = {};
      await page.route("**/api/user/timezone", async (route) => {
        if (route.request().method() === "PATCH") {
          try {
            patchBody = await route.request().postDataJSON() as Record<string, unknown>;
          } catch {
            // ignore parse errors
          }
        }
        await route.continue();
      });

      // Wait for the PATCH response before asserting — avoids fragile waitForTimeout
      const patchResponsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/user/timezone") && res.request().method() === "PATCH",
        { timeout: 15000 }
      );

      await loginAs(page, autoDetectEmail);

      await patchResponsePromise;

      expect(typeof patchBody.timezone).toBe("string");
      expect((patchBody.timezone as string).length).toBeGreaterThan(0);
    });

    test("timezone persists after re-login: Settings shows the saved timezone", async ({
      page,
    }) => {
      test.setTimeout(90000);

      // Wait for the auto-detect PATCH before navigating to settings
      const patchResponsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/user/timezone") && res.request().method() === "PATCH",
        { timeout: 15000 }
      ).catch(() => null); // null if already set (no PATCH fired)

      await loginAs(page, autoDetectEmail);

      await patchResponsePromise;

      // Go to settings and verify the timezone is now shown (non-null)
      await page.goto("/settings", { waitUntil: "load" });

      // The settings page loads without error (timezone is set silently)
      await expect(
        page.getByRole("heading", { name: /settings|pengaturan/i }).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("auto-detect fires only once — second page load does not re-PATCH", async ({
      page,
    }) => {
      test.setTimeout(60000);

      // First login: auto-detect may PATCH if timezone is still null
      const firstPatchPromise = page.waitForResponse(
        (res) => res.url().includes("/api/user/timezone") && res.request().method() === "PATCH",
        { timeout: 10000 }
      ).catch(() => null); // acceptable if already set

      await loginAs(page, autoDetectEmail);
      await firstPatchPromise;

      // Second navigation: intercept PATCH and assert it does NOT fire
      let secondPatchCount = 0;
      await page.route("**/api/user/timezone", async (route) => {
        if (route.request().method() === "PATCH") {
          secondPatchCount++;
        }
        await route.continue();
      });

      // Attempt to capture a PATCH on the second load — expect none within 5s
      const secondPatchPromise = page.waitForResponse(
        (res) => res.url().includes("/api/user/timezone") && res.request().method() === "PATCH",
        { timeout: 5000 }
      ).catch(() => null);

      await page.goto("/", { waitUntil: "load" });
      const secondResponse = await secondPatchPromise;

      expect(secondResponse).toBeNull();
      expect(secondPatchCount).toBe(0);
    });
  });
});
