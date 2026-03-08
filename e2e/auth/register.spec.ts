// Traceability: user-authentication
// REQ 1.1 -> test('registration page displays all required fields')
// REQ 1.2 -> test('user registers with valid credentials and lands on app')
// REQ 1.3 -> test('user sees validation error for empty name'), test('...empty email')
// REQ 1.4 -> test('user sees error when email is already registered')
// REQ 1.5 -> test('user sees validation error for short password')
// REQ 1.7 -> test('user registers with valid credentials and lands on app')
// REQ 6.5 -> test('email field uses email input type')
// REQ 7.3 -> test('password field masks input')
// REQ 7.5 -> test('user can register with exactly 8-character password')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

test.describe("register", () => {
  test.describe("good cases", () => {
    test("user registers with valid credentials and lands on app", async ({
      page,
    }) => {
      const uniqueEmail = `reg-good-${Date.now()}@test.com`;

      await page.goto("/register");
      await stableFill(page, () => page.getByLabel(/full name/i), "New User");
      await stableFill(page, () => page.getByLabel(/email address/i), uniqueEmail);
      await stableFill(page, () => page.getByLabel(/password/i), "SecurePass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page).toHaveURL("/", { timeout: 30000 });
    });

    test("registration page displays all required fields", async ({
      page,
    }) => {
      await page.goto("/register");

      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /register/i })
      ).toBeVisible();
    });

    test("registration page has link to login", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
    });
  });

  test.describe("bad cases", () => {
    test("user sees validation error for empty name", async ({ page }) => {
      await page.goto("/register");

      await stableFill(page, () => page.getByLabel(/email address/i), "valid@test.com");
      await stableFill(page, () => page.getByLabel(/password/i), "ValidPass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByText(/name is required/i)).toBeVisible();
    });

    test("user sees validation error for empty email", async ({ page }) => {
      await page.goto("/register");

      await stableFill(page, () => page.getByLabel(/full name/i), "Test User");
      await stableFill(page, () => page.getByLabel(/password/i), "ValidPass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test("user sees validation error for invalid email format", async ({
      page,
    }) => {
      await page.goto("/register");

      await stableFill(page, () => page.getByLabel(/full name/i), "Test User");
      await stableFill(page, () => page.getByLabel(/email address/i), "not-an-email");
      await stableFill(page, () => page.getByLabel(/password/i), "ValidPass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test("user sees validation error for short password", async ({ page }) => {
      await page.goto("/register");

      await stableFill(page, () => page.getByLabel(/full name/i), "Test User");
      await stableFill(page, () => page.getByLabel(/email address/i), "short-pw@test.com");
      await stableFill(page, () => page.getByLabel(/password/i), "short");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(
        page.getByText(/password must be at least 8 characters/i)
      ).toBeVisible();
    });

    test("user sees error when email is already registered", async ({
      page,
      request,
    }) => {
      const duplicateEmail = `dup-${Date.now()}@test.com`;

      await request.post("/api/auth/sign-up/email", {
        data: {
          name: "First User",
          email: duplicateEmail,
          password: "SecurePass123!",
        },
      });

      await page.goto("/register");
      await stableFill(page, () => page.getByLabel(/full name/i), "Duplicate User");
      await stableFill(page, () => page.getByLabel(/email address/i), duplicateEmail);
      await stableFill(page, () => page.getByLabel(/password/i), "SecurePass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(
        page.locator("form [role='alert']").or(
          page.getByText(/already registered|email.*taken|log in instead/i)
        )
      ).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe("edge cases", () => {
    test("user can register with exactly 8-character password", async ({
      page,
    }) => {
      const uniqueEmail = `edge-pw-${Date.now()}@test.com`;

      await page.goto("/register");
      await stableFill(page, () => page.getByLabel(/full name/i), "Edge User");
      await stableFill(page, () => page.getByLabel(/email address/i), uniqueEmail);
      await stableFill(page, () => page.getByLabel(/password/i), "Exactly8");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page).toHaveURL("/", { timeout: 30000 });
    });

    test("password field masks input", async ({ page }) => {
      await page.goto("/register");

      const passwordField = page.getByLabel(/password/i);
      await expect(passwordField).toHaveAttribute("type", "password");
    });

    test("email field uses email input type", async ({ page }) => {
      await page.goto("/register");

      const emailField = page.getByLabel(/email address/i);
      await expect(emailField).toHaveAttribute("type", "email");
    });
  });
});
