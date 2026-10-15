import { test, expect } from "@playwright/test";
import {
  watchErrors,
  expectCleanConsole,
  expectNoHorizontalOverflow,
} from "./ui.helpers";

test.describe("Wavva marketing pages UI", () => {
  const pages = [
    {
      path: "/front-office",
      name: "front-office",
      heading: /your front office, done for you/i,
    },
    {
      path: "/about",
      name: "about",
      heading: /no business should lose a customer/i,
    },
    {
      path: "/founding-client",
      name: "founding-client",
      heading: /claim a founding spot/i,
    },
  ] as const;

  for (const { path: p, name, heading } of pages) {
    test(`${name} page loads with headline and clean console`, async ({
      page,
    }) => {
      const errors = await watchErrors(page);
      const resp = await page.goto(p);
      expect(resp?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1 }),
      ).toContainText(heading);
      // Shared chrome: pill nav + footer on every marketing page.
      await expect(
        page.getByRole("link", { name: "Wavva home" }),
      ).toBeVisible();
      await expect(page.locator("footer")).toContainText("© 2026 Wavva");
      await expectNoHorizontalOverflow(page, p);
      expectCleanConsole(errors, p);
    });
  }

  test("/faq page shows accordion and trial band", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/faq");
    expect(resp?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: /questions, answered plainly/i }),
    ).toBeVisible();
    await expect(
      page.locator("#faq").locator("button[aria-expanded]").first(),
    ).toBeVisible();
    await expect(page.locator("#trial")).toBeVisible();
    await expectNoHorizontalOverflow(page, "/faq");
    expectCleanConsole(errors, "/faq");
  });

  test("/contact page shows the contact form", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/contact");
    expect(resp?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: /get in touch with us/i }),
    ).toBeVisible();
    await expect(page.locator("#contact").locator("form")).toBeVisible();
    await expectNoHorizontalOverflow(page, "/contact");
    expectCleanConsole(errors, "/contact");
  });

  test("/founding-client page shows the application form", async ({
    page,
  }) => {
    await page.goto("/founding-client");
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
    // Required fields are present and marked.
    for (const name of ["Company name", "Email", "Phone"] as const) {
      const field = form.getByLabel(name, { exact: true });
      await expect(field).toBeVisible();
      await expect(field).toHaveAttribute("required", "");
    }
    await expect(form.locator('button[type="submit"]')).toBeVisible();
  });
});
