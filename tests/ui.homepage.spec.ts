import { test, expect } from "@playwright/test";
import {
  watchErrors,
  expectCleanConsole,
  expectNoHorizontalOverflow,
} from "./ui.helpers";

test.describe("Wavva homepage UI", () => {
  test("loads with hero headline, CTAs and clean console", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/");
    expect(resp?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText(/front office for every business/i);

    // Hero CTAs point at the trial band and the sample-call demo.
    const trialCta = page.getByRole("link", { name: "Start free 7-day trial" });
    await expect(trialCta).toHaveAttribute("href", "#trial");
    const demoCta = page.getByRole("link", { name: "Hear a sample call" });
    await expect(demoCta).toHaveAttribute("href", "#chatdemo");

    await expectNoHorizontalOverflow(page, "/");
    expectCleanConsole(errors, "/");
  });

  test("pill nav shows logo, links and trial CTA", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Wavva home" }),
    ).toHaveAttribute("href", "/");

    const nav = page.locator("nav").first();
    for (const [label, href] of [
      ["Features", "#features"],
      ["How it works", "#how"],
      ["Pricing", "/pricing"],
      ["FAQs", "/faq"],
      ["Contact", "/contact"],
    ] as const) {
      const link = nav.getByRole("link", { name: label });
      await expect(link).toHaveAttribute("href", href);
    }

    const navCta = page.getByRole("link", { name: "Start free trial" }).first();
    await expect(navCta).toHaveAttribute("href", "/#trial");
  });

  test("all homepage sections and footer render", async ({ page }) => {
    await page.goto("/");

    for (const id of ["#features", "#how", "#pricing", "#faq", "#trial"]) {
      await expect(page.locator(id)).toBeVisible();
    }
    await expect(page.locator("footer")).toContainText("© 2026 Wavva");
  });

  test("sample-call player plays and pauses", async ({ page }) => {
    await page.goto("/");
    const demo = page.locator("#chatdemo");
    await demo.scrollIntoViewIfNeeded();

    const play = page.getByRole("button", { name: /play sample call/i });
    await expect(play).toBeVisible({ timeout: 15_000 });
    await play.click();

    // Playing state: pause control appears.
    await expect(
      page.getByRole("button", { name: /pause/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Pausing returns to the play state.
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(
      page.getByRole("button", { name: /play sample call/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("FAQ accordion expands and collapses", async ({ page }) => {
    await page.goto("/");
    const faq = page.locator("#faq");
    await faq.scrollIntoViewIfNeeded();

    const first = faq.locator('button[aria-expanded]').first();
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "false");
  });

  test("trial band links to the founding-client page", async ({ page }) => {
    await page.goto("/");
    const band = page.locator("#trial");
    await band.scrollIntoViewIfNeeded();
    const cta = band.getByRole("link", { name: /founding spot/i });
    await expect(cta).toHaveAttribute("href", "/founding-client");
    await cta.click();
    await expect(page).toHaveURL(/\/founding-client$/);
  });
});
