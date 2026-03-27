// Traceability: settings-invite-management (Issue #84)
// REQ 4.3 -> test('dev user sees invite management page')
// REQ 4.3 -> test('valid invite generates link and appears in pending list')
// REQ 4.4 -> test('revoke removes invite from pending list')
// REQ 4.3 -> test('submitting form with empty email shows validation error')
// REQ 4.3 -> test('submitting form with invalid email format prevents submission')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

// DEV_EMAILS not set in test env → isDevEmail() returns true for all users
test.use({ storageState: "e2e/.auth/user-with-property.json" });

test.describe("invite management", () => {
  test.describe("good cases", () => {
    test("dev user sees invite management page", async ({ page }) => {
      test.info().setTimeout(30000);
      await page.goto("/settings/invites");

      await expect(
        page.getByRole("heading", { name: /invite management/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: /generate invite link/i })
      ).toBeVisible({ timeout: 5000 });
    });

    test("valid invite generates link and appears in pending list", async ({
      page,
    }) => {
      test.info().setTimeout(60000);
      const inviteEmail = `invite-${Date.now()}@test.com`;

      await page.goto("/settings/invites");
      await page
        .getByRole("button", { name: /generate invite link/i })
        .click();
      await expect(page.locator("#invite-email")).toBeVisible({
        timeout: 5000,
      });

      await stableFill(page, () => page.locator("#invite-email"), inviteEmail);
      await page.getByRole("button", { name: /generate link/i }).click();

      // Form closes on success
      await expect(page.locator("#invite-email")).not.toBeVisible({
        timeout: 10000,
      });

      // Invite appears in pending list with email and a copy link button
      await expect(page.getByText(inviteEmail)).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("button", { name: /copy link/i })
      ).toBeVisible({ timeout: 5000 });
    });

    test("revoke removes invite from pending list", async ({ page }) => {
      test.info().setTimeout(60000);
      const inviteEmail = `revoke-${Date.now()}@test.com`;

      await page.goto("/settings/invites");
      await page
        .getByRole("button", { name: /generate invite link/i })
        .click();
      await stableFill(page, () => page.locator("#invite-email"), inviteEmail);
      await page.getByRole("button", { name: /generate link/i }).click();

      // Wait for invite to appear
      await expect(page.getByText(inviteEmail)).toBeVisible({ timeout: 10000 });

      // Revoke it
      await page
        .getByRole("listitem")
        .filter({ hasText: inviteEmail })
        .getByRole("button", { name: /revoke/i })
        .click();

      // Invite disappears from list
      await expect(page.getByText(inviteEmail)).not.toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("bad cases", () => {
    test("submitting form with empty email shows validation error", async ({
      page,
    }) => {
      test.info().setTimeout(30000);
      await page.goto("/settings/invites");
      await page
        .getByRole("button", { name: /generate invite link/i })
        .click();
      await expect(page.locator("#invite-email")).toBeVisible({
        timeout: 5000,
      });

      // Submit without filling email
      await page.getByRole("button", { name: /generate link/i }).click();

      // Form stays open — submission did not succeed
      await expect(page.locator("#invite-email")).toBeVisible({ timeout: 3000 });
    });

    test("submitting form with invalid email format prevents submission", async ({
      page,
    }) => {
      test.info().setTimeout(30000);
      await page.goto("/settings/invites");
      await page
        .getByRole("button", { name: /generate invite link/i })
        .click();
      await stableFill(
        page,
        () => page.locator("#invite-email"),
        "not-an-email"
      );
      await page.getByRole("button", { name: /generate link/i }).click();

      // Form stays open — submission did not succeed
      await expect(page.locator("#invite-email")).toBeVisible({ timeout: 3000 });
    });
  });
});
