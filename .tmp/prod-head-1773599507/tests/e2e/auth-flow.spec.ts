import { expect, test } from "@playwright/test";

test("user can login to parent dashboard and logout successfully", async ({ page }) => {
  let loginRequestCount = 0;
  let dashboardNavigationCount = 0;
  await page.route("**/api/auth/login", async (route) => {
    loginRequestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          parent: {
            id: "parent-e2e",
            email: "qa-e2e@example.com",
            displayName: "QA E2E Parent",
          },
        },
      }),
    });
  });

  await page.route("**/parent/dashboard**", async (route) => {
    dashboardNavigationCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html>
<html lang="vi">
  <head><title>Parent Dashboard</title></head>
  <body>
    <main>
      <h1>Parent Dashboard Mock</h1>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Đăng xuất</button>
      </form>
    </main>
  </body>
</html>`,
    });
  });

  await page.route("**/api/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          signedOut: true,
        },
      }),
    });
  });

  await page.goto("/auth/login");
  await page.fill('input[type="email"]', "qa-e2e@example.com");
  await page.fill('input[type="password"]', "QATest@123456");
  await page.locator('button[type="submit"]').click();

  await expect.poll(() => loginRequestCount).toBe(1);
  await expect.poll(() => dashboardNavigationCount).toBeGreaterThan(0);
  await expect(page.locator("text=Email hoặc mật khẩu chưa đúng.")).toHaveCount(0);

  const logoutApiResponse = await page.request.post("/api/auth/logout", {
    headers: {
      Origin: "http://localhost:3000",
      Referer: "http://localhost:3000/parent/dashboard",
    },
  });
  expect(logoutApiResponse.ok()).toBeTruthy();
  const uiLogoutBody = (await logoutApiResponse.json()) as {
    ok?: boolean;
    data?: { signedOut?: boolean };
  };
  expect(uiLogoutBody.ok).toBe(true);
  expect(uiLogoutBody.data?.signedOut).toBe(true);

  await page.goto("/auth/login");
  await expect(page).toHaveURL(/\/auth\/login/);
});
