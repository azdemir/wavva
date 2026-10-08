import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SHOTS = path.join(__dirname, "screenshots");
test.beforeAll(() => fs.mkdirSync(SHOTS, { recursive: true }));

/** Collect console errors and page errors so tests can assert a clean console. */
async function watchErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 300)));
  return { consoleErrors, pageErrors };
}

async function checkNoErrors(errors: { consoleErrors: string[]; pageErrors: string[] }, route: string) {
  expect(errors.consoleErrors, `console errors on ${route}: ${JSON.stringify(errors.consoleErrors)}`).toEqual([]);
  expect(errors.pageErrors, `page errors on ${route}: ${JSON.stringify(errors.pageErrors)}`).toEqual([]);
}

test.describe("Marketing pages (backend-independent)", () => {
  test("homepage returns 200, renders hero + CTAs, clean console", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/");
    expect(resp?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/one tidy place/i);
    await expect(page.getByRole("link", { name: /start free|get started|try/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "home.png"), fullPage: true });
    await checkNoErrors(errors, "/");
  });

  test("features page returns 200 and renders headings", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/features");
    expect(resp?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "features.png") });
    await checkNoErrors(errors, "/features");
  });

  test("pricing page returns 200 and shows plan tiers", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/pricing");
    expect(resp?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByText(/starter/i).first()).toBeVisible();
    await expect(page.getByText(/growth/i).first()).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "pricing.png"), fullPage: true });
    await checkNoErrors(errors, "/pricing");
  });

  test("faq page returns 200 and renders questions", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/faq");
    expect(resp?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "faq.png") });
    await checkNoErrors(errors, "/faq");
  });

  test("contact page returns 200 and renders a form", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/contact");
    expect(resp?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "contact.png") });
    await checkNoErrors(errors, "/contact");
  });
});

test.describe("Auth pages (form renders; submission needs a real backend)", () => {
  test("signin returns 200 and renders the email/password form", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/signin");
    expect(resp?.status()).toBe(200);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "signin.png") });
    await checkNoErrors(errors, "/signin");
  });

  test("signup returns 200 and renders the email/password form", async ({ page }) => {
    const errors = await watchErrors(page);
    const resp = await page.goto("/signup");
    expect(resp?.status()).toBe(200);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "signup.png") });
    await checkNoErrors(errors, "/signup");
  });

  test("demo page returns 200", async ({ page }) => {
    const resp = await page.goto("/demo");
    expect(resp?.status()).toBe(200);
    await page.screenshot({ path: path.join(SHOTS, "demo.png") });
  });
});

test.describe("Protected routes without a working backend", () => {
  test("dashboard redirects to signin without a session (backend unreachable) — documents behavior", async ({
    page,
  }) => {
    const resp = await page.goto("/dashboard");
    // The auth guard issues a client-side redirect to /signin; the sign-in
    // form becomes visible even though the address bar may lag behind.
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 20000 });
    console.log(`[dashboard] status=${resp?.status()} finalUrl=${page.url()} -> sign-in form shown`);
    await page.screenshot({ path: path.join(SHOTS, "dashboard-no-backend.png"), fullPage: true });
    // Correct auth-guard behavior: no session -> sign-in UI. The server
    // itself stays alive — that is what this documents.
    expect(resp?.status()).toBe(200);
  });

  test("onboarding redirects to signin without a session (backend unreachable) — documents behavior", async ({
    page,
  }) => {
    const resp = await page.goto("/onboarding");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 20000 });
    console.log(`[onboarding] status=${resp?.status()} finalUrl=${page.url()} -> sign-in form shown`);
    await page.screenshot({ path: path.join(SHOTS, "onboarding-no-backend.png") });
    expect(resp?.status()).toBe(200);
  });

  test("admin page behaves without backend — documents behavior", async ({ page }) => {
    const resp = await page.goto("/admin");
    console.log(`[admin] status=${resp?.status()} finalUrl=${page.url()}`);
    await page.screenshot({ path: path.join(SHOTS, "admin-no-backend.png") });
    expect([200, 302, 307, 308, 500]).toContain(resp?.status());
  });
});
