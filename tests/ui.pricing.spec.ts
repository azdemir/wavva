import { test, expect } from "@playwright/test";
import {
  watchErrors,
  expectCleanConsole,
  expectNoHorizontalOverflow,
} from "./ui.helpers";

test.describe("Wavva pricing UI", () => {
  test("/pricing page shows both plans with monthly prices", async ({
    page,
  }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/pricing");
    expect(resp?.status()).toBe(200);

    const section = page.locator("#pricing");
    await expect(section.getByRole("heading", { name: "Essential" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Complete" })).toBeVisible();

    // Monthly prices: Essential $299, Complete $599.
    await expect(section).toContainText("$299");
    await expect(section).toContainText("$599");
    await expect(section).toContainText("Most popular");

    // Included minutes are advertised on the cards.
    await expect(section).toContainText(/AI-answered minutes \/ month included/);

    await expectNoHorizontalOverflow(page, "/pricing");
    expectCleanConsole(errors, "/pricing");
  });

  test("yearly toggle switches to discounted prices", async ({ page }) => {
    await page.goto("/pricing");
    const section = page.locator("#pricing");
    await section.scrollIntoViewIfNeeded();

    const toggle = section.getByRole("switch", {
      name: "Toggle yearly pricing",
    });
    await expect(toggle).toHaveAttribute("aria-checked", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    // Yearly = 10/12 of monthly, rounded: 299 -> 249, 599 -> 499.
    // The flip animates (~600ms), so wait for the settled text.
    await expect(section).toContainText("$249", { timeout: 10_000 });
    await expect(section).toContainText("$499", { timeout: 10_000 });

    // Toggling back restores monthly pricing.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(section).toContainText("$299", { timeout: 10_000 });
    await expect(section).toContainText("$599", { timeout: 10_000 });
  });

  test("plan CTAs lead to the trial band", async ({ page }) => {
    await page.goto("/pricing");
    const section = page.locator("#pricing");
    const cta = section.getByRole("link", { name: "Start free trial" }).first();
    await expect(cta).toHaveAttribute("href", "/#trial");
  });

  test("homepage pricing section matches /pricing page", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#pricing");
    await section.scrollIntoViewIfNeeded();
    await expect(
      section.getByRole("heading", { name: "Essential" }),
    ).toBeVisible();
    await expect(section.getByRole("heading", { name: "Complete" })).toBeVisible();
    await expect(section).toContainText("$299");
    await expect(section).toContainText("$599");
  });
});
