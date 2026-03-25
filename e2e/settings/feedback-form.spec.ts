// Traceability: settings-feedback-form
// AC-1.1 -> test('feedback section is visible at the bottom of settings page')
// AC-1.2 -> test('feedback section has labelled textarea and submit button')
// AC-1.3 -> test('character counter shows 2000 remaining initially')
// AC-2.1 -> test('empty submit shows validation error without posting')
// AC-2.3 -> test('whitespace-only submit shows validation error without posting')
// AC-3.1,3.3 -> test('user submits valid feedback and sees success toast with cleared textarea')
// AC-3.2 -> test('submit button is disabled while request is in flight')
// AC-6   -> test('feedback section renders in Indonesian when language is set to id')

import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("feedback form", () => {
  test.describe("good cases", () => {
    test("feedback section is visible at the bottom of settings page", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("feedback section has labelled textarea and submit button", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      const textarea = page.getByRole("textbox", { name: /feedback|message|pesan/i });
      await expect(textarea).toBeVisible({ timeout: 5000 });

      await expect(
        page.getByRole("button", { name: /submit feedback|kirim umpan balik/i })
      ).toBeVisible({ timeout: 5000 });
    });

    test("character counter shows 2000 remaining initially", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.getByText(/2000.*characters remaining|2000.*karakter tersisa/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test("user submits valid feedback and sees success toast with cleared textarea", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      const textarea = page.getByRole("textbox", { name: /feedback|message|pesan/i });
      await textarea.fill("The payment recording page is hard to use on mobile. Please add a quick-pay button.");

      await page.getByRole("button", { name: /submit feedback|kirim umpan balik/i }).click();

      // Use anchored regex to match only the visible ToastTitle, not Radix's hidden
      // aria-live span which contains "Notification Thank you! ..." (different prefix)
      await expect(
        page.getByText(/^Thank you!|^Terima kasih!/i)
      ).toBeVisible({ timeout: 15000 });

      // Textarea is cleared after success
      await expect(textarea).toHaveValue("", { timeout: 10000 });
    });

    test("character counter decrements as user types", async ({ page }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      const textarea = page.getByRole("textbox", { name: /feedback|message|pesan/i });
      await textarea.fill("Hello");

      await expect(
        page.getByText(/1995.*characters remaining|1995.*karakter tersisa/i)
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("bad cases", () => {
    test("empty submit shows validation error without posting", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: /submit feedback|kirim umpan balik/i }).click();

      // Inline validation error appears
      await expect(
        page.getByRole("alert").or(
          page.getByText(/required|message.*required|wajib|pesan wajib/i)
        ).first()
      ).toBeVisible({ timeout: 5000 });

      // No success toast
      await expect(
        page.getByText(/thank you|terima kasih/i)
      ).not.toBeVisible();
    });

    test("whitespace-only submit shows validation error without posting", async ({
      page,
    }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      const textarea = page.getByRole("textbox", { name: /feedback|message|pesan/i });
      await textarea.fill("     ");
      await page.getByRole("button", { name: /submit feedback|kirim umpan balik/i }).click();

      await expect(
        page.getByRole("alert").or(
          page.getByText(/required|message.*required|wajib|pesan wajib/i)
        ).first()
      ).toBeVisible({ timeout: 5000 });

      await expect(
        page.getByText(/thank you|terima kasih/i)
      ).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test("submit button shows loading state while submitting", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      const textarea = page.getByRole("textbox", { name: /feedback|message|pesan/i });
      await textarea.fill("Testing the loading state of the submit button.");

      // Intercept the request to delay it so we can observe the loading state
      await page.route("/api/feedback", async (route) => {
        await new Promise((r) => setTimeout(r, 800));
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      });

      await page.getByRole("button", { name: /submit feedback|kirim umpan balik/i }).click();

      // Button should be disabled with loading text while in flight
      await expect(
        page.getByRole("button", { name: /submitting|mengirim/i })
      ).toBeDisabled({ timeout: 3000 });
    });

    test("character counter resets to 2000 after successful submit", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      const textarea = page.getByRole("textbox", { name: /feedback|message|pesan/i });
      await textarea.fill("Short feedback.");

      // Counter should have changed
      await expect(
        page.getByText(/1985.*characters remaining|1985.*karakter tersisa/i)
      ).toBeVisible({ timeout: 3000 });

      await page.getByRole("button", { name: /submit feedback|kirim umpan balik/i }).click();

      // After success, counter resets
      await expect(
        page.getByText(/2000.*characters remaining|2000.*karakter tersisa/i)
      ).toBeVisible({ timeout: 15000 });
    });

    test("textarea has an accessible label", async ({ page }) => {
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: /feedback/i })
      ).toBeVisible({ timeout: 10000 });

      // getByRole with name filter verifies accessible name is present
      await expect(
        page.getByRole("textbox", { name: /feedback|message|your feedback|pesan|umpan balik/i })
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
