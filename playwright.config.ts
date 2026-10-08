import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests for the TidyPro production build.
 *
 * There is no Supabase project in this environment, so the webServer is
 * started with dummy (unreachable) Supabase env vars. That is deliberate:
 * it lets us verify that backend-independent pages (marketing, auth forms)
 * render correctly, and documents exactly how auth-gated routes behave
 * without a working backend.
 *
 * See tests/smoke.spec.ts for the expected-behavior matrix.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { outputFolder: "tests/playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 90_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Dummy backend: constructor succeeds, every network call fails.
      // Real Supabase keys go in .env.local (see .env.example).
      NEXT_PUBLIC_SUPABASE_URL: "https://dummy.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "dummy-anon-key-for-local-smoke-test",
    },
  },
});
