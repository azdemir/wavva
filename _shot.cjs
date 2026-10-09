const { chromium } = require("@playwright/test");
const OUT = "/private/var/folders/nq/k3s7f33j0j143wvqm6mqdl6w0000gn/T/opencode/shots";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${OUT}/live-hero.png` });
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mp = await m.newPage();
  await mp.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 90000 });
  await mp.waitForTimeout(1800);
  await mp.screenshot({ path: `${OUT}/live-mobile.png` });
  await b.close();
  console.log("captured");
})();
