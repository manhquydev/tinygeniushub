import { expect, test, type Page } from "@playwright/test";

type Tone = "dark" | "mid" | "light";

const ROUTES = ["/", "/about", "/pricing", "/parent/dashboard"] as const;

function routeToSlug(route: string) {
  if (route === "/") {
    return "home";
  }

  return route.replaceAll("/", "-").replace(/^-+/, "");
}

async function setScrollProgress(progress: number, page: Page) {
  await page.evaluate((nextProgress) => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    window.scrollTo({ top: maxScroll * nextProgress, behavior: "auto" });
  }, progress);
  await page.waitForTimeout(120);
}

async function getCurrentTone(page: Page): Promise<Tone | null> {
  return page.evaluate(() => {
    const tone = document.documentElement.dataset.homeNavTone;
    if (tone === "dark" || tone === "mid" || tone === "light") {
      return tone;
    }
    return null;
  });
}

async function getNavBackgroundColor(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>(".app-nav");
    if (!nav) return null;
    return window.getComputedStyle(nav).backgroundColor;
  });
}

test("nav tone follows scroll progression on non-kid routes", async ({ page }, testInfo) => {
  for (const route of ROUTES) {
    await test.step(`tone progression on ${route}`, async () => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const appNav = page.locator(".app-nav");
      const navVisible = await appNav.isVisible().catch(() => false);

      if (!navVisible && route === "/parent/dashboard") {
        const reloginLink = page.getByRole("link", { name: "Đăng nhập lại" });
        await expect(reloginLink).toBeVisible();
        await Promise.all([
          page.waitForURL(/\/auth\/login/),
          reloginLink.click(),
        ]);
      }

      await expect(page.locator(".app-nav")).toBeVisible();

      await page.evaluate(() => {
        // Normalize page height so every route can traverse all tone thresholds.
        document.body.style.minHeight = "400vh";
      });

      await setScrollProgress(0, page);
      await expect.poll(async () => getCurrentTone(page)).toBe("dark");
      const topTone = await getCurrentTone(page);
      const topColor = await getNavBackgroundColor(page);
      await page.screenshot({
        path: testInfo.outputPath(`nav-tone-${routeToSlug(route)}-top.png`),
        fullPage: false,
      });

      await setScrollProgress(0.5, page);
      await expect.poll(async () => getCurrentTone(page)).toBe("mid");
      const midTone = await getCurrentTone(page);

      await setScrollProgress(0.95, page);
      await expect.poll(async () => getCurrentTone(page)).toBe("light");
      const bottomTone = await getCurrentTone(page);
      const bottomColor = await getNavBackgroundColor(page);
      await page.screenshot({
        path: testInfo.outputPath(`nav-tone-${routeToSlug(route)}-bottom.png`),
        fullPage: false,
      });

      expect(topTone).toBe("dark");
      expect(midTone).toBe("mid");
      expect(bottomTone).toBe("light");
      expect(topColor).not.toBeNull();
      expect(bottomColor).not.toBeNull();
      expect(topColor).not.toBe(bottomColor);
    });
  }
});
