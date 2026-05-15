import { expect, test } from "@playwright/test";

test("guest can navigate homepage -> courses -> blog -> blog detail", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main").first()).toBeVisible();
  await expect(page.locator('a[href="/pricing"]')).toHaveCount(0);
  await expect(page.locator('a[href="/for-schools"]')).toHaveCount(0);

  await page.locator('a[href="/courses"]:visible').first().click();
  await expect(page).toHaveURL(/\/courses(?:\?.*)?$/);
  await expect(page.locator("h1")).toBeVisible();

  const blogFooterLink = page.locator('footer a[href="/blog"]').first();
  await blogFooterLink.scrollIntoViewIfNeeded();
  await blogFooterLink.click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator("h1")).toBeVisible();

  const firstBlogPostLink = page
    .locator('a[href^="/blog/"]:visible:not([href="/blog/search"]):not([href^="/blog/category/"])')
    .first();
  await expect(firstBlogPostLink).toBeVisible();
  await firstBlogPostLink.click();

  await expect(page).toHaveURL(/\/blog\/[^/?#]+/);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText("404")).toHaveCount(0);
});

test("pricing and for-schools routes are hidden", async ({ page }) => {
  const pricingResponse = await page.goto("/pricing");
  expect(pricingResponse?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();

  const forSchoolsResponse = await page.goto("/for-schools");
  expect(forSchoolsResponse?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
});
