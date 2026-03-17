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
        name: "Chọn đúng khóa để con tiến bộ ngay từ những tuần đầu",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Xem khóa và bắt đầu/i }).first()).toBeVisible();
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
        name: "Mỗi khóa là một mục tiêu học rõ ràng, dễ theo dõi",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Xem chi tiết khóa/i }).first()).toBeVisible();
  });
});
