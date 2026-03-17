import { expect, test } from "@playwright/test";

test("post-login parent nav shows activation links and support menu", async ({ page, baseURL }) => {
  const origin = baseURL ?? "http://127.0.0.1:3200";
  const readiness = await page.request.get("/api/health/ready");
  test.skip(readiness.status() !== 200, `Skipping: /api/health/ready=${readiness.status()}`);

  const email = `e2e.parent.nav+${Date.now()}@example.com`;
  const password = "ParentNavE2E!123";

  const signup = await page.request.post("/api/auth/signup", {
    headers: {
      Origin: origin,
    },
    data: {
      email,
      password,
      displayName: "E2E Parent Nav",
    },
  });

  expect(signup.status()).toBe(200);
  const signupBody = (await signup.json()) as { ok?: boolean };
  expect(signupBody.ok).toBe(true);

  await page.goto("/parent/dashboard");
  await expect(page).toHaveURL(/\/(parent\/dashboard|setup)(\?.*)?$/);

  const desktopNav = page.locator("header.app-nav .nav-links-desktop");
  await expect(desktopNav.getByRole("link", { name: "Tổng quan" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Hồ sơ bé" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Khóa học" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Báo cáo" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Gói dịch vụ" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Giới thiệu" })).toHaveCount(0);

  await desktopNav.getByRole("button", { name: "Trợ giúp" }).click();
  const supportMenu = page.getByRole("menu", { name: "Menu trợ giúp" });
  await expect(supportMenu.getByRole("menuitem", { name: "Blog" })).toBeVisible();
  await expect(supportMenu.getByRole("menuitem", { name: "Giới thiệu" })).toBeVisible();
  await expect(supportMenu.getByRole("menuitem", { name: "Trợ giúp" })).toBeVisible();

  await desktopNav.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/$/);
});
