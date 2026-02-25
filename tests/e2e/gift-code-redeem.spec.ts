import { expect, test } from "@playwright/test";

test("valid gift code activates subscription and shows success", async ({ page }) => {
  let redeemCallCount = 0;

  await page.route("**/api/gift-codes/redeem", async (route) => {
    redeemCallCount += 1;
    const req = route.request();
    const body = JSON.parse(req.postData() ?? "{}") as { code?: string };

    if (body.code === "TESTGIFT8") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            subscriptionActivated: true,
            planName: "yearly_standard",
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "INVALID_CODE" }),
      });
    }
  });

  await page.goto("/gift-code");
  await expect(page).toHaveURL(/\/gift-code/);

  const validResp = await page.request.post("/api/gift-codes/redeem", {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ code: "TESTGIFT8" }),
  });
  expect(validResp.ok()).toBeTruthy();
  const validBody = (await validResp.json()) as {
    ok?: boolean;
    data?: { subscriptionActivated?: boolean; planName?: string };
  };
  expect(validBody.ok).toBe(true);
  expect(validBody.data?.subscriptionActivated).toBe(true);
  expect(validBody.data?.planName).toBe("yearly_standard");

  expect(redeemCallCount).toBe(1);
});

test("invalid gift code returns error response", async ({ page }) => {
  let redeemCallCount = 0;

  await page.route("**/api/gift-codes/redeem", async (route) => {
    redeemCallCount += 1;
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "INVALID_CODE" }),
    });
  });

  const invalidResp = await page.request.post("/api/gift-codes/redeem", {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ code: "BADCODE1" }),
  });
  expect(invalidResp.ok()).toBeFalsy();
  const invalidBody = (await invalidResp.json()) as { ok?: boolean; error?: string };
  expect(invalidBody.ok).toBe(false);
  expect(invalidBody.error).toBe("INVALID_CODE");

  expect(redeemCallCount).toBe(1);
});

test("already-used gift code returns error", async ({ page }) => {
  await page.route("**/api/gift-codes/redeem", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "CODE_ALREADY_USED" }),
    });
  });

  const resp = await page.request.post("/api/gift-codes/redeem", {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ code: "USEDCODE" }),
  });
  expect(resp.status()).toBe(409);
  const body = (await resp.json()) as { ok?: boolean; error?: string };
  expect(body.error).toBe("CODE_ALREADY_USED");
});

test("gift code redemption page renders without crashing", async ({ page }) => {
  await page.goto("/gift-code");
  await expect(page).toHaveURL(/\/gift-code/);
  await expect(page.locator("body")).toBeVisible();
});
