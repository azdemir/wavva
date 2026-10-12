import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SHOTS = path.join(__dirname, "screenshots", "e2e");
test.beforeAll(() => fs.mkdirSync(SHOTS, { recursive: true }));

/** Collect console/page errors for a clean-console assertion. */
async function watchErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 300)));
  return { consoleErrors, pageErrors };
}

function expectCleanConsole(
  errors: { consoleErrors: string[]; pageErrors: string[] },
  route: string,
) {
  expect(
    errors.consoleErrors,
    `console errors on ${route}: ${JSON.stringify(errors.consoleErrors)}`,
  ).toEqual([]);
  expect(
    errors.pageErrors,
    `page errors on ${route}: ${JSON.stringify(errors.pageErrors)}`,
  ).toEqual([]);
}

test.describe("Marketing site end-to-end", () => {
  const pages = [
    { path: "/", name: "home", heading: /one tidy place/i },
    { path: "/features", name: "features", heading: /everything/i },
    { path: "/pricing", name: "pricing", heading: /pays for itself/i },
    { path: "/faq", name: "faq", heading: /questions/i },
    { path: "/contact", name: "contact", heading: /talk to us/i },
  ];

  for (const { path: p, name, heading } of pages) {
    test(`${name} page loads, renders, clean console`, async ({ page }) => {
      const errors = await watchErrors(page);
      const resp = await page.goto(p);
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        heading,
      );
      // No horizontal overflow at desktop width.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `horizontal overflow on ${p}`).toBeLessThanOrEqual(1);
      expectCleanConsole(errors, p);
    });
  }

  test("homepage hero tour plays (canvas-free animated scenes)", async ({
    page,
  }) => {
    await page.goto("/");
    // Tour frame renders with scene content — scroll it into view first
    // (it now sits below the headlines; the observer pauses it off-screen).
    const tour = page.getByText(/good morning, sarah/i).first();
    await tour.scrollIntoViewIfNeeded();
    await expect(tour).toBeVisible({ timeout: 15000 });
    // Play/pause control exists and toggles the label.
    const toggle = page.getByRole("button", { name: /pause tour|play tour/i });
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute("aria-label");
    await toggle.click();
    const after = before === "Pause tour" ? "Play tour" : "Pause tour";
    await expect(page.getByRole("button", { name: after })).toBeVisible();
  });

  test("navbar mobile menu opens and links work", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    // Mobile nav is a button disclosure (aria-expanded), not <details>.
    const menuButton = page.getByRole("button", { name: /open menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    // It renders its own <nav aria-label="Mobile"> inside the primary nav.
    const nav = page.getByRole("navigation", { name: /^mobile$/i });
    const pricingLink = nav.getByRole("link", { name: /^pricing$/i });
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/pricing/);
    // Navigating closes the menu.
    await expect(nav).toHaveCount(0);
  });
});

test.describe("Theme toggle end-to-end", () => {
  test("toggles dark mode, persists across reload", async ({ page }) => {
    const errors = await watchErrors(page);
    await page.goto("/");
    // Wait for hydration: the toggle gets its theme-specific label on mount.
    const toggle = page
      .getByRole("button", { name: /switch to dark mode/i })
      .first();
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await toggle.click();
    await expect(page.locator("html.dark")).toHaveCount(1);
    await expect(page.locator("main section").first()).toHaveCSS(
      "background-color",
      "rgb(10, 17, 40)",
    );
    expect(
      await page.evaluate(() => localStorage.getItem("tidypro-theme")),
    ).toBe("dark");

    await page.reload();
    await expect(page.locator("html.dark")).toHaveCount(1);
    await expect(page.locator("main section").first()).toHaveCSS(
      "background-color",
      "rgb(10, 17, 40)",
    );

    // Toggle back to light (label is correct after the hydration fix).
    const lightToggle = page
      .getByRole("button", { name: /switch to light mode/i })
      .first();
    await expect(lightToggle).toBeVisible({ timeout: 15000 });
    await lightToggle.click();
    await expect(page.locator("html.dark")).toHaveCount(0);
    await expect(page.locator("main section").first()).toHaveCSS(
      "background-color",
      "rgb(233, 238, 251)",
    );
    expectCleanConsole(errors, "theme toggle");
  });

  test("dark mode has no light-background bands on key pages", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("tidypro-theme", "dark");
      document.documentElement.classList.add("dark");
    });
    for (const p of ["/", "/pricing", "/features", "/faq"]) {
      await page.goto(p);
      await page.evaluate(() =>
        document.documentElement.classList.add("dark"),
      );
      await page.waitForTimeout(400);
      // Body background must be the dark slate, not white.
      const bg = await page.evaluate(() =>
        getComputedStyle(document.body).backgroundColor,
      );
      expect(bg, `body bg on ${p} in dark mode`).not.toBe("rgb(255, 255, 255)");
    }
  });
});

test.describe("404 handling", () => {
  test("unknown route shows custom 404 with home link", async ({ page }) => {
    const resp = await page.goto("/this-page-definitely-does-not-exist-xyz");
    expect(resp?.status()).toBe(404);
    await expect(page.getByText(/took a day off/i)).toBeVisible();
    const home = page.getByRole("link", { name: /go to homepage/i });
    await expect(home).toBeVisible();
    await home.click();
    await expect(page).toHaveURL(/\/$/);
    // Note: no clean-console assertion — browsers log 404 navigations as
    // console errors, which is expected behavior, not an app bug.
  });
});

test.describe("Auth gating end-to-end", () => {
  const protectedRoutes = [
    "/dashboard",
    "/dashboard/bookings/new",
    "/dashboard/customers",
    "/onboarding",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated users to signin with ?next=`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForURL(/\/signin/, { timeout: 20000 });
      const url = new URL(page.url());
      expect(url.pathname).toBe("/signin");
      expect(url.searchParams.get("next")).toBe(route);
      // Sign-in form is usable — or the setup notice when the backend
      // isn't configured (dummy vars in CI).
      const formOrNotice = page
        .locator('input[type="email"]')
        .or(page.getByText(/supabase/i));
      await expect(formOrNotice.first()).toBeVisible({ timeout: 10000 });
    });
  }

  test("signin form validates empty submission client-side", async ({
    page,
  }) => {
    await page.goto("/signin");
    const email = page.locator('input[type="email"]');
    if ((await email.count()) === 0) {
      // Backend not configured in this environment — setup notice shown
      // instead of the form. Document and skip.
      await expect(page.getByText(/supabase/i).first()).toBeVisible();
      test.skip();
      return;
    }
    // HTML required attributes block empty submit; button exists and form is present.
    await expect(email).toHaveAttribute("required", "");
    await expect(page.locator('input[type="password"]')).toHaveAttribute(
      "required",
      "",
    );
  });
});

test.describe("Mobile viewport (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("key pages have no horizontal overflow on mobile", async ({
    page,
  }) => {
    for (const p of ["/", "/features", "/pricing", "/faq", "/contact"]) {
      await page.goto(p);
      await page.waitForTimeout(600);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - 390,
      );
      expect(overflow, `horizontal overflow on ${p} at 390px`).toBeLessThanOrEqual(
        1,
      );
    }
  });

  test("pricing compare table is scrollable with hint on mobile", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await expect(
      page.getByText(/swipe sideways to compare/i),
    ).toBeVisible();
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
  });
});

test.describe("Studio (founder HQ) end-to-end", () => {
  const studioRoutes = ["/studio", "/studio/analytics", "/studio/website", "/studio/crm", "/studio/crm/new", "/studio/users"];

  for (const route of studioRoutes) {
    test(`${route} redirects anonymous visitors to the homepage`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForURL((url) => !url.pathname.startsWith("/studio"), {
        timeout: 20000,
      });
      expect(new URL(page.url()).pathname).toBe("/");
    });
  }

  test("trial request page renders a working form", async ({ page }) => {
    const errors = await watchErrors(page);
    await page.goto("/demo");
    // h1 is sr-only (SEO); the visible card title is the h3
    await expect(
      page.getByRole("heading", { name: /free 14-day trial/i }).last(),
    ).toBeVisible();
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /request my trial/i }),
    ).toBeVisible();
    expectCleanConsole(errors, "/demo");
  });

  test("marketing pages render CMS-driven sections", async ({ page }) => {
    const errors = await watchErrors(page);
    await page.goto("/");
    // Hero (CMS: home.hero.*), service-area marquee (CMS: site.cities),
    // features, stories, FAQ.
    await expect(
      page.getByRole("heading", { name: /run your cleaning business/i }),
    ).toBeVisible();
    // The stats/why-us cards were removed from this band on 2026-10-10; the
    // marquee is what remains. Cities come from CMS, so assert the band.
    await expect(page.getByText(/now serving/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /everything a cleaning business needs/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /loved by cleaning businesses/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /questions cleaning owners ask us/i }),
    ).toBeVisible();
    expectCleanConsole(errors, "/ (cms sections)");
  });
});
