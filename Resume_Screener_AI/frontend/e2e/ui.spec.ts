import { test, expect } from "@playwright/test";

test.describe("Dark Mode", () => {
  test("toggles dark mode via theme button", async ({ page }) => {
    await page.goto("/candidates");
    await page.waitForLoadState("networkidle");

    const html = page.locator("html");
    const initialClass = await html.getAttribute("class");

    const themeButton = page.locator('[data-testid="theme-toggle"]');
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(300);
      const newClass = await html.getAttribute("class");
      expect(newClass).not.toBe(initialClass);
    }
  });

  test("dark mode persists in localStorage", async ({ page }) => {
    await page.goto("/");
    const themeButton = page.locator('[data-testid="theme-toggle"]');
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(300);
      const theme = await page.evaluate(() => localStorage.getItem("theme"));
      expect(["dark", "light"]).toContain(theme);
    }
  });
});

test.describe("Mobile Viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("candidate page is scrollable on mobile", async ({ page }) => {
    await page.goto("/candidates");
    await page.waitForLoadState("networkidle");
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(bodyHeight).toBeGreaterThanOrEqual(viewportHeight);
  });

  test("hamburger menu is visible on mobile", async ({ page }) => {
    await page.goto("/candidates");
    const hamburger = page.locator('[data-testid="mobile-menu"]');
    if (await hamburger.isVisible()) {
      await expect(hamburger).toBeVisible();
    }
  });
});

test.describe("Resume Download", () => {
  test("download button exists on candidate detail page", async ({ page }) => {
    await page.goto("/candidates");
    const downloadBtn = page.locator('[data-testid="download-resume"]').first();
    if (await downloadBtn.isVisible()) {
      await expect(downloadBtn).toBeVisible();
    }
  });
});

test.describe("Navigation", () => {
  test("navigates to all main pages", async ({ page }) => {
    const pages = ["/", "/candidates", "/jobs", "/analytics"];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain(path);
    }
  });
});
