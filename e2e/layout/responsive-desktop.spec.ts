// Traceability: G-1 responsive layout (issue #3)
// Plan: On desktop (1280px), main content and nav links are centered within
//       a constrained column — not flush to viewport edges.
//       Mobile (375px) layout is unchanged from pre-change baseline.

import { test, expect } from "@playwright/test";

// Desktop viewport for all tests in this file
test.use({
  storageState: "e2e/.auth/user-with-property.json",
  viewport: { width: 1280, height: 800 },
});

test.describe("responsive layout — desktop (1280px)", () => {
  test.describe("good cases", () => {
    test("main content is constrained and centered — not full-width", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const main = page.locator("main").first();
      await expect(main).toBeVisible({ timeout: 10000 });

      const box = await main.boundingBox();
      const viewport = page.viewportSize()!;

      // Content should not span the full viewport width
      expect(box!.width).toBeLessThan(viewport.width);
      // Content should have meaningful left margin (centered)
      expect(box!.x).toBeGreaterThan(viewport.width * 0.05);
      // Content should be symmetric (centered): right margin ≈ left margin (±50px tolerance)
      const rightMargin = viewport.width - (box!.x + box!.width);
      expect(Math.abs(box!.x - rightMargin)).toBeLessThan(50);
    });

    test("nav links are not flush to the left viewport edge on desktop", async ({
      page,
    }) => {
      await page.goto("/");

      const overviewLink = page
        .getByRole("navigation")
        .getByRole("link", { name: /overview|dashboard|dasbor/i });
      await expect(overviewLink).toBeVisible({ timeout: 10000 });

      const box = await overviewLink.boundingBox();
      const viewport = page.viewportSize()!;

      // The first nav link should not start at x=0 (full-width bottom bar)
      expect(box!.x).toBeGreaterThan(viewport.width * 0.05);
    });

    test("nav element spans full viewport width so border-top covers the screen", async ({
      page,
    }) => {
      await page.goto("/");

      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible({ timeout: 10000 });

      const box = await nav.boundingBox();
      const viewport = page.viewportSize()!;

      // Outer nav must still span full width
      expect(box!.x).toBeLessThanOrEqual(1);
      expect(box!.width).toBeCloseTo(viewport.width, -1);
    });

    test("header content is centered — PropertySwitcher not flush to left edge", async ({
      page,
    }) => {
      await page.goto("/");

      const header = page.getByRole("banner");
      await expect(header).toBeVisible({ timeout: 10000 });

      // Header outer element spans full width
      const headerBox = await header.boundingBox();
      const viewport = page.viewportSize()!;
      expect(headerBox!.width).toBeCloseTo(viewport.width, -1);

      // But the property switcher (inside the constrained inner wrapper) is not at x=0
      const switcher = page.getByTestId("property-switcher").or(
        page.locator("header").locator("button").first()
      );
      const switcherBox = await switcher.boundingBox();
      if (switcherBox) {
        expect(switcherBox.x).toBeGreaterThan(viewport.width * 0.05);
      }
    });
  });

  test.describe("bad cases", () => {
    test("no horizontal scroll at desktop viewport", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const viewport = page.viewportSize()!;

      expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
    });
  });

  test.describe("edge cases", () => {
    test("at md breakpoint boundary (768px) content is constrained and centered", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 800 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const main = page.locator("main").first();
      await expect(main).toBeVisible({ timeout: 10000 });

      const box = await main.boundingBox();
      const viewport = page.viewportSize()!;

      // At md breakpoint, content should be constrained (not equal to viewport width)
      expect(box!.width).toBeLessThan(viewport.width);
    });

    test("mobile (375px) layout unchanged — main content fills near-full width", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const main = page.locator("main").first();
      await expect(main).toBeVisible({ timeout: 10000 });

      const box = await main.boundingBox();
      const viewport = page.viewportSize()!;

      // On mobile, content should take up most of the viewport width (480px cap = full width at 375px)
      expect(box!.width).toBeGreaterThan(viewport.width * 0.8);
    });
  });
});
