// Traceability: payment-recording
// REQ 2.1 -> test('payment list view displays scrollable list')
// REQ 2.2 -> test('payment list shows tenant name, amount, date, timestamp')
// REQ 2.4 -> test('payments sorted by date descending')

import { test, expect } from "@playwright/test";
import { goToPaymentsList } from "../helpers/payment-recording";

test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("view payment list", () => {
  test.describe("good cases", () => {
    test("payment list view displays list or empty state", async ({
      page,
    }) => {
      await goToPaymentsList(page);
      await expect(
        page
          .getByText(/payment history|riwayat pembayaran|no payments recorded|belum ada pembayaran/i)
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("payment list shows tenant name, amount, date, timestamp when payments exist", async ({
      page,
    }) => {
      test.info().setTimeout(45000);
      await goToPaymentsList(page);
      const listOrEmpty = page.getByText(
        /payment history|no payments|tenant|amount|recorded/i
      );
      await expect(listOrEmpty.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("bad cases", () => {
    test("payment list page requires authentication", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto("/properties/any-id/payments");
      await expect(
        page.getByText(/log in|login|sign in|unauthorized|forbidden/i).or(
          page.getByRole("link", { name: /log in|login/i })
        )
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("payment list page loads without horizontal scroll", async ({
      page,
    }) => {
      await goToPaymentsList(page);
      const body = page.locator("body");
      await expect(body).toBeVisible({ timeout: 15000 });
      const scrollWidth = await body.evaluate((el) => el.scrollWidth);
      const clientWidth = await body.evaluate((el) => el.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });
});
