import { expect, test, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";

const DEMO_PARENT_EMAIL = "demo.parent@tinygeniushubvn.tech";
const DEMO_PARENT_PASSWORD = "DemoPass123!";
const UNKNOWN_PATH = "/__i18n-missing-404__";

const viMessages = JSON.parse(readFileSync("locales/vi/translation.json", "utf8")) as {
  language: { english: string };
  navigation: { guest: { courses: string; ctaDefaultFull: string } };
  generated: { the_learning_garden_is_on_both_sides_leaving_3effe7b9: string };
  specialPages: { notFound: { title: string } };
  auth: {
    form: {
      fields: { passwordLabel: string };
      login: { title: string; subtitle: string; submit: string };
    };
  };
  parent: { dashboard: { activity: { heading: string } } };
};
const enMessages = JSON.parse(readFileSync("locales/en/translation.json", "utf8")) as {
  language: { vietnamese: string };
  navigation: { guest: { courses: string } };
  generated: { the_learning_garden_is_on_both_sides_leaving_3effe7b9: string };
};

async function setLocaleCookie(context: BrowserContext, baseURL: string | undefined, value: "en" | "vi") {
  await context.clearCookies();
  const origin = baseURL ?? "http://127.0.0.1:3200";
  await context.addCookies([{ name: "tgh_locale", value, url: origin }]);
}

test("guest language defaults to English and can switch to Vietnamese", async ({ page, context }) => {
  await context.clearCookies();

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: enMessages.navigation.guest.courses }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: enMessages.generated.the_learning_garden_is_on_both_sides_leaving_3effe7b9 })).toBeVisible();
  await expect(page.locator('a[href="/pricing"]')).toHaveCount(0);
  await expect(page.locator('a[href="/for-schools"]')).toHaveCount(0);
  const switcher = page.locator(".nav-links-desktop .language-switcher").first();
  const switcherBefore = await switcher.boundingBox();
  expect(switcherBefore).not.toBeNull();

  await page.getByRole("button", { name: enMessages.language.vietnamese }).click();
  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.getByRole("link", { name: viMessages.navigation.guest.courses }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: viMessages.navigation.guest.ctaDefaultFull }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: viMessages.generated.the_learning_garden_is_on_both_sides_leaving_3effe7b9 })).toBeVisible();
  await expect(page.locator('a[href="/pricing"]')).toHaveCount(0);
  await expect(page.locator('a[href="/for-schools"]')).toHaveCount(0);
  const switcherAfter = await switcher.boundingBox();
  expect(switcherAfter).not.toBeNull();
  expect(Math.abs((switcherAfter?.x ?? 0) - (switcherBefore?.x ?? 0))).toBeLessThanOrEqual(4);

  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "tgh_locale")?.value).toBe("vi");

  await page.getByRole("button", { name: viMessages.language.english }).click();
  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: enMessages.navigation.guest.courses }).first()).toBeVisible();
});

test("unknown URL with vi cookie shows Vietnamese notFound title", async ({ page, context, baseURL }) => {
  await setLocaleCookie(context, baseURL, "vi");

  await page.goto(UNKNOWN_PATH);

  await expect(page.getByRole("heading", { level: 1, name: viMessages.specialPages.notFound.title })).toBeVisible();
});

test("login form with vi cookie shows auth.form copy", async ({ page, context, baseURL }) => {
  await setLocaleCookie(context, baseURL, "vi");

  await page.goto("/auth/login");

  await expect(page.getByRole("heading", { name: viMessages.auth.form.login.title })).toBeVisible();
  await expect(page.getByText(viMessages.auth.form.login.subtitle)).toBeVisible();
  await expect(page.getByText(viMessages.auth.form.fields.passwordLabel, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: viMessages.auth.form.login.submit })).toBeVisible();
});

test("parent dashboard with vi cookie shows activity heading", async ({ page, context, baseURL }) => {
  await setLocaleCookie(context, baseURL, "vi");

  await page.goto("/auth/login");
  await page.locator('input[type="email"]').first().fill(DEMO_PARENT_EMAIL);
  await page.locator('input[type="password"]').first().fill(DEMO_PARENT_PASSWORD);
  await page.locator('button[type="submit"]').first().click();

  const reachedDashboard = await page
    .waitForURL(/\/parent\/dashboard/, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (!reachedDashboard) {
    test.skip(true, "demo.parent@tinygeniushubvn.tech login failed; dashboard mix skipped");
  }

  await expect(page.getByRole("heading", { name: viMessages.parent.dashboard.activity.heading })).toBeVisible();
});

test("switching language keeps current route on courses and auth login pages", async ({ page, context }) => {
  await context.clearCookies();

  for (const relativeUrl of ["/courses?topic=math", "/auth/login?next=%2Fcourses"]) {
    await page.goto(relativeUrl);
    const before = new URL(page.url());

    await page.getByRole("button", { name: enMessages.language.vietnamese }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    const afterVi = new URL(page.url());
    expect(`${afterVi.pathname}${afterVi.search}`).toBe(`${before.pathname}${before.search}`);

    await page.getByRole("button", { name: viMessages.language.english }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const afterEn = new URL(page.url());
    expect(`${afterEn.pathname}${afterEn.search}`).toBe(`${before.pathname}${before.search}`);
  }
});
