import { expect, test } from "@playwright/test";

test("contact form submits successfully with mocked API", async ({ page }) => {
  let contactRequestCount = 0;

  await page.route("**/api/contact", async (route) => {
    contactRequestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          message: "Your message has been received",
        },
      }),
    });
  });

  await page.goto("/contact");

  await page.fill("#contact-name", "QA Tester");
  await page.fill("#contact-email", "qa@example.com");
  await page.selectOption("#contact-subject", { index: 3 });
  await page.fill("#contact-message", "This is a valid test message for the contact form.");
  await page.locator('button[type="submit"]').click();

  await expect.poll(() => contactRequestCount).toBe(1);
  await expect(page.getByText("Your message has been received")).toBeVisible();
});

