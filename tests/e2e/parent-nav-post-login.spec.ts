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
      legalAccepted: true,
    },
  });

  expect(signup.status()).toBe(200);
  const signupBody = (await signup.json()) as { ok?: boolean };
  expect(signupBody.ok).toBe(true);

  await page.goto("/parent/dashboard");
  await expect(page).toHaveURL(/\/(parent\/dashboard|setup)(\?.*)?$/);

  const desktopNav = page.locator("header.app-nav .nav-links-desktop");
  await expect(desktopNav.getByRole("link", { name: "Overview" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Baby profile" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Course" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Report" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Service pack" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Introduce" })).toHaveCount(0);

  await desktopNav.getByRole("button", { name: "Help" }).click();
  const supportMenu = page.getByRole("menu", { name: "Help menu" });
  await expect(supportMenu.getByRole("menuitem", { name: "Blog" })).toBeVisible();
  await expect(supportMenu.getByRole("menuitem", { name: "Introduce" })).toBeVisible();
  await expect(supportMenu.getByRole("menuitem", { name: "Help" })).toBeVisible();

  await desktopNav.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
});
