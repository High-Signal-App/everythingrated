import { expect, test } from "@playwright/test";

/**
 * Mobile-viewport checks — runs under the `mobile` Playwright project
 * (iPhone 13 = 390px wide). The multi-axis rating UI is everythingrated's
 * core mobile case, so this verifies the landing, a directory, and an item
 * page render without horizontal scroll, and that the rate buttons meet the
 * 44px touch-target floor.
 *
 * Skipped on the `desktop` project — these assertions are mobile-specific.
 */

const PUBLIC_ROUTES = ["/", "/about", "/d/ai-dev-tools"];

async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
}

test.describe("mobile viewport — 390px", () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 1280) > 600,
    "mobile-only checks",
  );

  for (const path of PUBLIC_ROUTES) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const overflow = await horizontalOverflow(page);
      expect(
        overflow,
        `${path} should not scroll horizontally`,
      ).toBeLessThanOrEqual(1);
    });
  }

  test("landing shows hero, features, and a CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /multi-axis ratings/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /why multi-axis/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /how it works/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse directories/i }),
    ).toBeVisible();
  });

  test("rate buttons meet the 44px touch-target floor", async ({ page }) => {
    // Visit a seeded item page; rate buttons carry aria-label "Rate N".
    await page.goto("/d/ai-dev-tools", { waitUntil: "domcontentloaded" });
    const firstItem = page.locator('a[href^="/d/ai-dev-tools/"]').first();
    await firstItem.click();
    const rateButton = page.getByRole("button", { name: /^Rate 1$/ }).first();
    await rateButton.waitFor();
    const size = await rateButton.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    expect(size.height, "rate button height").toBeGreaterThanOrEqual(44);
    expect(size.width, "rate button width").toBeGreaterThanOrEqual(44);
  });
});
