import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({ viewport: { width: 1500, height: 800 } });
const page = await context.newPage();

const OUT = "/private/tmp/claude-501/-Users-edipuslu/d0d14029-1a4b-493d-8afe-b78c6dd5f469/scratchpad";
const SITE = "https://videohub.usludigital.com";

await page.goto(`${SITE}/login`);
await page.waitForSelector("#videohubId");
await page.fill("#videohubId", "usludigitalteam@gmail.com");
await page.fill("#password", "Usludigitalteam123456");
await page.click('button[type="submit"]');
await page.waitForURL("**/admin");
await page.waitForSelector("text=Open dashboard");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/where-payments.png` });

await page.goto(`${SITE}/admin/payments`);
await page.waitForSelector("text=VENTO");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/payments-page.png` });

await browser.close();
console.log("done");
