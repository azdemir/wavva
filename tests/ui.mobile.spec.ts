import { test, expect, devices } from "@playwright/test";
import {
  watchErrors,
  expectCleanConsole,
  expectNoHorizontalOverflow,
} from "./ui.helpers";

// iPhone-scale viewport. The pill nav collapses its link row on small
// screens, so assertions target what mobile actually shows.
test.use({ ...devices["iPhone 13"] });

test.describe("Wavva mobile UI (390px)", () => {
  const routes = ["/", "/pricing", "/front-office", "/faq", "/contact"];

  for (const route of routes) {
    test(`${route} has no horizontal overflow and clean console`, async ({
      page,
    }) => {
      const errors = await watchErrors(page);
      const resp = await page.goto(route);
      expect(resp?.status()).toBe(200);
      await expectNoHorizontalOverflow(page, route);
      expectCleanConsole(errors, route);
    });
  }

  test("homepage hero and CTAs are usable on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText(/front office for every business/i);

    // Nav collapses to logo + trial CTA on small screens.
    await expect(
      page.getByRole("link", { name: "Wavva home" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Start free trial" }).first(),
    ).toBeVisible();

    // Hero CTAs stack and stay tappable.
    const trialCta = page.getByRole("link", { name: "Start free 7-day trial" });
    await expect(trialCta).toBeVisible();
    const box = await trialCta.boundingBox();
    expect(box?.height, "CTA tap target height").toBeGreaterThanOrEqual(40);

    // Sample-call player is present below the fold.
    await expect(
      page.getByRole("button", { name: /play sample call/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("pricing cards stack without overflow on mobile", async ({ page }) => {
    await page.goto("/pricing");
    const section = page.locator("#pricing");
    await section.scrollIntoViewIfNeeded();
    await expect(
      section.getByRole("heading", { name: "Essential" }),
    ).toBeVisible();
    await expect(
      section.getByRole("heading", { name: "Complete" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page, "/pricing");
  });
});
