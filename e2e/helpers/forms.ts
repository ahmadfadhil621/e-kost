import type { Locator, Page } from "@playwright/test";

/**
 * Fills a form field after re-querying it to avoid "element is detached" when
 * React re-renders or remounts the form. Waits for the field to be visible,
 * then obtains a fresh locator and fills it.
 */
export async function stableFill(
  page: Page,
  getLocator: () => Locator,
  value: string,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 10000;
  const loc = getLocator();
  await loc.first().waitFor({ state: "visible", timeout });
  await getLocator().first().fill(value);
}
