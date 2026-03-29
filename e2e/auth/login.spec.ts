// Traceability: user-authentication
// REQ 2.1 -> test('login page displays all required fields')
// REQ 2.2 -> test('user logs in with valid credentials and sees dashboard')
// REQ 2.3 -> test('user sees error for invalid credentials')
// REQ 2.4 -> test('user sees validation error for empty email'), test('...empty password')
// REQ 6.5 -> test('email field uses email input type')
// REQ 7.3 -> test('password field masks input')

import { test, expect } from "@playwright/test";
import { stableFill } from "../helpers/forms";

const TEST_USER_NAME = "Login Test User";
const TEST_USER_PASSWORD = "LoginPass123!";

let testUserEmail: string;

test.beforeAll(async ({ request }) => {
  testUserEmail = `login-${Date.now()}@test.com`;

  await request.post("/api/auth/sign-up/email", {
    data: {
      name: TEST_USER_NAME,
      email: testUserEmail,
      password: TEST_USER_PASSWORD,
    },
  });
});

test.describe("login", () => {
  test.describe("good cases", () => {
    test("user logs in with valid credentials and sees dashboard", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/login");
      await stableFill(page, () => page.getByLabel(/email address/i), testUserEmail);
      await stableFill(page, () => page.getByLabel(/password/i), TEST_USER_PASSWORD);
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      await expect(page).toHaveURL("/", { timeout: 25000 });
      await page.waitForLoadState("domcontentloaded");
      await expect(
        page.getByRole("link", { name: /create property/i })
      ).toBeVisible({ timeout: 15000 });
    });

    test("login page displays all required fields", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible({
        timeout: 10000,
      });

      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign in|log in/i })
      ).toBeVisible();
    });

  });

  test.describe("bad cases", () => {
    test("user sees validation error for empty email", async ({ page }) => {
      await page.goto("/login");

      await stableFill(page, () => page.getByLabel(/password/i), "SomePassword123");
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      await expect(page.getByText(/email is required/i)).toBeVisible({
        timeout: 15000,
      });
    });

    test("user sees validation error for empty password", async ({ page }) => {
      await page.goto("/login");

      await stableFill(page, () => page.getByLabel(/email address/i), "test@test.com");
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test("user sees error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await stableFill(page, () => page.getByLabel(/email address/i), "wrong@test.com");
      await stableFill(page, () => page.getByLabel(/password/i), "WrongPassword123");
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      await expect(
        page.locator("form [role='alert']").or(
          page.getByText(/invalid|wrong|try again|not found|something went wrong/i)
        )
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("edge cases", () => {
    test("password field masks input", async ({ page }) => {
      await page.goto("/login");

      const passwordField = page.getByLabel(/password/i);
      await expect(passwordField).toHaveAttribute("type", "password");
    });

    test("email field uses email input type", async ({ page }) => {
      await page.goto("/login");

      const emailField = page.getByLabel(/email address/i);
      await expect(emailField).toHaveAttribute("type", "email");
    });
  });
});
