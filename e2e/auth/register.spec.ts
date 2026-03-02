import { test, expect } from "@playwright/test";

test.describe("register", () => {
  test.describe("good cases", () => {
    test("user registers with valid credentials and lands on app", async ({
      page,
    }) => {
      const uniqueEmail = `reg-good-${Date.now()}@test.com`;

      await page.goto("/register");
      await page.getByLabel(/full name/i).fill("New User");
      await page.getByLabel(/email address/i).fill(uniqueEmail);
      await page.getByLabel(/password/i).fill("SecurePass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page).toHaveURL("/", { timeout: 10000 });
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

      await page.getByLabel(/email address/i).fill("valid@test.com");
      await page.getByLabel(/password/i).fill("ValidPass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByText(/name is required/i)).toBeVisible();
    });

    test("user sees validation error for empty email", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/full name/i).fill("Test User");
      await page.getByLabel(/password/i).fill("ValidPass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test("user sees validation error for invalid email format", async ({
      page,
    }) => {
      await page.goto("/register");

      await page.getByLabel(/full name/i).fill("Test User");
      await page.getByLabel(/email address/i).fill("not-an-email");
      await page.getByLabel(/password/i).fill("ValidPass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test("user sees validation error for short password", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/full name/i).fill("Test User");
      await page.getByLabel(/email address/i).fill("short-pw@test.com");
      await page.getByLabel(/password/i).fill("short");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(
        page.getByText(/password must be at least 8 characters/i)
      ).toBeVisible();
    });

    test("user sees error when email is already registered", async ({
      page,
    }) => {
      const duplicateEmail = `dup-${Date.now()}@test.com`;

      await page.goto("/register");
      await page.getByLabel(/full name/i).fill("First User");
      await page.getByLabel(/email address/i).fill(duplicateEmail);
      await page.getByLabel(/password/i).fill("SecurePass123!");
      await page.getByRole("button", { name: /register/i }).click();
      await expect(page).toHaveURL("/", { timeout: 10000 });

      await page.goto("/register");
      await page.getByLabel(/full name/i).fill("Duplicate User");
      await page.getByLabel(/email address/i).fill(duplicateEmail);
      await page.getByLabel(/password/i).fill("SecurePass123!");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("edge cases", () => {
    test("user can register with exactly 8-character password", async ({
      page,
    }) => {
      const uniqueEmail = `edge-pw-${Date.now()}@test.com`;

      await page.goto("/register");
      await page.getByLabel(/full name/i).fill("Edge User");
      await page.getByLabel(/email address/i).fill(uniqueEmail);
      await page.getByLabel(/password/i).fill("Exactly8");
      await page.getByRole("button", { name: /register/i }).click();

      await expect(page).toHaveURL("/", { timeout: 10000 });
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
