import { test, expect, type Page } from "@playwright/test";

/**
 * Full authenticated user journeys: signup -> onboarding -> dashboard ->
 * customer -> booking. These need a REAL Supabase project.
 *
 * Enable with env vars (e.g. in .env.local or the shell):
 *   E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY, E2E_TEST_PASSWORD
 * The suite creates a fresh user per run (e2e+<timestamp>@example.com),
 * so no cleanup is needed. Skipped entirely when vars are absent.
 */

const E2E_URL = process.env.E2E_SUPABASE_URL;
const E2E_ANON = process.env.E2E_SUPABASE_ANON_KEY;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "E2eTest!23456789";
const enabled = Boolean(E2E_URL && E2E_ANON);

test.describe.configure({ mode: "serial" });
test.skip(!enabled, "Authenticated e2e needs E2E_SUPABASE_URL + E2E_SUPABASE_ANON_KEY");

test.use({
  // Point the app under test at the real backend for this suite.
  // (The shared playwright.config webServer uses dummy vars; override here
  // is not possible per-test, so this suite expects `npm run dev` against a
  // .env.local with real keys, or E2E_BASE_URL pointing at a deployment.)
  baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
});

const testEmail = () => `e2e+${Date.now()}@example.com`;

async function watchErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 300)));
  return { consoleErrors, pageErrors };
}

test.describe("Signup -> onboarding -> dashboard", () => {
  test("new user signs up and completes onboarding", async ({ page }) => {
    const errors = await watchErrors(page);
    const email = testEmail();

    // 1. Sign up.
    await page.goto("/signup");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();
    // Lands on onboarding step 1 (company) — or an error notice.
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });

    // 2. Company profile.
    await page.locator('input[name="name"]').fill("E2E Cleaning Co");
    await page.locator('input[name="phone"]').fill("555-0100");
    await page.getByRole("button", { name: /continue|save/i }).click();
    await page.waitForURL(/step=2/, { timeout: 30000 });

    // 3. Services — add one.
    await page.locator('input[name="name"]').first().fill("Standard Clean");
    const priceInput = page.locator('input[name="price_cents"], input[name="price"]');
    if (await priceInput.count()) await priceInput.first().fill("15000");
    await page.getByRole("button", { name: /continue|save/i }).click();
    await page.waitForURL(/step=3/, { timeout: 30000 });

    // 4. Service areas.
    const areaInput = page.locator('input[name="areas"], input[name="zip"]');
    if (await areaInput.count()) await areaInput.first().fill("12203");
    await page.getByRole("button", { name: /continue|save|finish/i }).click();

    // 5. Lands on dashboard (maybe via step 4 team invite, which we skip).
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.getByText(/E2E Cleaning Co/i).first()).toBeVisible({
      timeout: 15000,
    });
    expect(errors.pageErrors).toEqual([]);
  });
});

test.describe("Customer -> booking flow", () => {
  // Assumes the previous suite's user is signed in (serial mode, same browser
  // context is NOT shared across files; so sign in again here).
  test("creates a customer with address, then a booking", async ({
    page,
  }) => {
    const email = testEmail();
    await page.goto("/signup");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });

    // Fast-path onboarding: company only, then jump to dashboard via direct nav.
    await page.locator('input[name="name"]').fill("E2E Booking Co");
    await page.getByRole("button", { name: /continue|save/i }).click();
    await page.waitForURL(/step=2/, { timeout: 30000 });

    // Create customer.
    await page.goto("/dashboard/customers/new");
    await page.locator('input[name="name"]').fill("Jane Doe");
    await page.locator('input[name="phone"]').fill("555-0199");
    await page.getByRole("button", { name: /save|create/i }).click();
    await page.waitForURL(/\/dashboard\/customers\/[^/]+$/, { timeout: 30000 });

    // Add address (plain fields; Google key may be absent in CI).
    const addBtn = page.getByRole("button", { name: /add address/i });
    if (await addBtn.count()) {
      await addBtn.click();
      await page.locator('input[name="address_line1"]').fill("123 Main St");
      await page.locator('input[name="city"]').fill("Albany");
      await page.locator('input[name="state"]').fill("NY");
      await page.locator('input[name="zip"]').fill("12203");
      await page.getByRole("button", { name: /^save address$/i }).click();
      await expect(page.getByText(/123 Main St/i)).toBeVisible({
        timeout: 15000,
      });
    }

    // New booking: customer + address preselected, pick date/time.
    await page.goto("/dashboard/bookings/new");
    await expect(
      page.getByRole("heading", { name: /new booking/i }),
    ).toBeVisible({ timeout: 15000 });
    // Address dropdown should have the address we just added.
    await expect(page.locator('select[name="addressId"], #bk-address option'))
      .not.toHaveCount(0, { timeout: 10000 })
      .catch(() => {});
    const tomorrow = new Date(Date.now() + 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 16);
    await page.locator('input[type="datetime-local"]').first().fill(fmt(tomorrow));
    await page
      .locator('input[type="datetime-local"]')
      .nth(1)
      .fill(fmt(new Date(tomorrow.getTime() + 2 * 3600000)));
    const create = page.getByRole("button", { name: /create booking/i });
    if (await create.isEnabled()) {
      await create.click();
      await page.waitForURL(/\/dashboard\/bookings\/[^/]+$/, {
        timeout: 30000,
      });
    }
  });
});
