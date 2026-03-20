import { chromium } from "@playwright/test";

const baseUrl = process.env.HUD_BASE_URL ?? "http://127.0.0.1:3101";
const email = process.env.HUD_EMAIL ?? "manhquy@vk.com";
const password = process.env.HUD_PASSWORD ?? "DemoPass123!";
const childId = process.env.HUD_CHILD_ID ?? "cmmn9hr2w0006mmt8dicgnatk";
const courseSlug = process.env.HUD_COURSE_SLUG ?? "little-fox-en-level-1";
const outputDir = process.env.HUD_OUTPUT_DIR ?? "output/playwright";
const label = process.argv[2] ?? "after";

const targetUrl = `${baseUrl}/kid/courses/${courseSlug}?childId=${childId}`;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/parent\/dashboard/, { timeout: 20_000 });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".ksg2-hud").first().waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(1200);

  const safeChildId = childId.slice(0, 12);
  const hudPath = `${outputDir}/kid-course-hud-${label}-${safeChildId}.png`;
  const fullPath = `${outputDir}/kid-course-full-${label}-${safeChildId}.png`;

  await page.locator(".ksg2-hud").first().screenshot({ path: hudPath });
  await page.screenshot({ path: fullPath, fullPage: true });

  await browser.close();
  process.stdout.write(`${hudPath}\n${fullPath}\n`);
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
