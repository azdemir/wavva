import { expect, type Page } from "@playwright/test";

/** Collect console/page errors for a clean-console assertion. */
export async function watchErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 300)));
  return { consoleErrors, pageErrors };
}

export function expectCleanConsole(
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

/** Fail if the page scrolls horizontally at the current viewport. */
export async function expectNoHorizontalOverflow(page: Page, route: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
}

/** Go to a route and assert it serves 200 with a clean console. */
export async function gotoClean(page: Page, route: string) {
  const errors = await watchErrors(page);
  const resp = await page.goto(route);
  expect(resp?.status(), `GET ${route} status`).toBe(200);
  return errors;
}
