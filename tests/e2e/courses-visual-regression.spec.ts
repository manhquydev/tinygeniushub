import { expect, test, type Page } from "@playwright/test";

async function disableMotion(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

test.describe("courses visual regression - desktop", () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test("courses listing page", async ({ page, context, baseURL }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([{ name: "ab_courses_v", value: "A", url: origin }]);

    await page.goto("/courses");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await disableMotion(page);
    await expect(page).toHaveScreenshot("courses-listing-desktop.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("course detail page", async ({ page, context, baseURL }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([{ name: "ab_courses_v", value: "A", url: origin }]);

    await page.goto("/courses/abeka");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await disableMotion(page);
    await expect(page).toHaveScreenshot("courses-detail-desktop.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("courses visual regression - mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("courses listing page", async ({ page, context, baseURL }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([{ name: "ab_courses_v", value: "A", url: origin }]);

    await page.goto("/courses");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await disableMotion(page);
    await expect(page).toHaveScreenshot("courses-listing-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("course detail page", async ({ page, context, baseURL }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([{ name: "ab_courses_v", value: "A", url: origin }]);

    await page.goto("/courses/abeka");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await disableMotion(page);
    await expect(page).toHaveScreenshot("courses-detail-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
