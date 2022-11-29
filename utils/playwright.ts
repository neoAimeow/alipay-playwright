import { webkit, chromium, Browser, Page, devices } from "playwright";

export const launchPlaywright = async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext(devices["iPhone 13"]);

  const page = await context.newPage();

  console.error(1111, "launchPlaywright");
  // The actual interesting bit
  await page.goto("https://www.aimeow.com/");
  const str = await page.title();
  console.error(str);

  await context.close();
  await browser.close();
};
