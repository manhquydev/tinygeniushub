import { expect, test } from "@playwright/test";

test("guest can navigate homepage -> pricing -> blog -> blog detail", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main").first()).toBeVisible();

  await page.locator('a[href="/pricing"]:visible').first().click();
  await expect(page).toHaveURL(/\/pricing$/);
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
