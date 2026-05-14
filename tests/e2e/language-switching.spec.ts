import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const viMessages = JSON.parse(readFileSync("locales/vi/translation.json", "utf8")) as {
  language: { english: string };
  navigation: { guest: { courses: string; ctaDefaultFull: string } };
  generated: { the_learning_garden_is_on_both_sides_leaving_3effe7b9: string };
};
const enMessages = JSON.parse(readFileSync("locales/en/translation.json", "utf8")) as {
  language: { vietnamese: string };
  navigation: { guest: { courses: string } };
  generated: { the_learning_garden_is_on_both_sides_leaving_3effe7b9: string };
};

test("guest language defaults to English and can switch to Vietnamese", async ({ page, context }) => {
  await context.clearCookies();

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: enMessages.navigation.guest.courses }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: enMessages.generated.the_learning_garden_is_on_both_sides_leaving_3effe7b9 })).toBeVisible();

  await page.getByRole("button", { name: enMessages.language.vietnamese }).click();
  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.getByRole("link", { name: viMessages.navigation.guest.courses }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: viMessages.navigation.guest.ctaDefaultFull }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: viMessages.generated.the_learning_garden_is_on_both_sides_leaving_3effe7b9 })).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "tgh_locale")?.value).toBe("vi");

  await page.getByRole("button", { name: viMessages.language.english }).click();
  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: enMessages.navigation.guest.courses }).first()).toBeVisible();
});
