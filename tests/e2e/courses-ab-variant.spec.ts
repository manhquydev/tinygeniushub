import { expect, test } from "@playwright/test";

test.describe("courses storefront A/B variants", () => {
  test("renders variant B hero and CTA copy when ab_courses_v=B", async ({
    page,
    context,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([
      {
        name: "ab_courses_v",
        value: "B",
        url: origin,
      },
    ]);

    await page.goto("/courses");

    await expect(
      page.getByRole("heading", {
        name: "Choose the right course so your child can progress right from the first weeks",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Xem khoa va bat dau/i }).first()).toBeVisible();
  });

  test("renders variant A hero and CTA copy when ab_courses_v=A", async ({
    page,
    context,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://127.0.0.1:3200";
    await context.addCookies([
      {
        name: "ab_courses_v",
        value: "A",
        url: origin,
      },
    ]);

    await page.goto("/courses");

    await expect(
      page.getByRole("heading", {
        name: "Each course has a clear, easy-to-follow learning goal",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Xem chi tiet khoa/i }).first()).toBeVisible();
  });
});
