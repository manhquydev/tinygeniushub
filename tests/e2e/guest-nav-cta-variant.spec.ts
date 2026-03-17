import { expect, test } from "@playwright/test";

test.describe("guest nav CTA variants", () => {
  test("shows variant B CTA label when ab_pricing_v=B cookie is set", async ({ page, context, baseURL }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([
      {
        name: "ab_pricing_v",
        value: "B",
        url: origin,
      },
    ]);

    await page.goto("/");

    const navCta = page.locator("header.app-nav a.solid-button").first();
    await expect(navCta).toBeVisible();
    await expect(navCta).toContainText("Xem gói học");
  });

  test("shows variant A CTA label when ab_pricing_v=A cookie is set", async ({ page, context, baseURL }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([
      {
        name: "ab_pricing_v",
        value: "A",
        url: origin,
      },
    ]);

    await page.goto("/");

    const navCta = page.locator("header.app-nav a.solid-button").first();
    await expect(navCta).toBeVisible();
    await expect(navCta).toContainText("Bắt đầu miễn phí");
  });
});
