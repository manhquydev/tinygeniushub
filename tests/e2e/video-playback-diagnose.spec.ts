import { expect, test, type Page } from "@playwright/test";

async function signupAndFinishSetup(page: Page) {
  const unique = Date.now();
  const email = `e2e.diag.${unique}@example.com`;
  const password = "DiagPlayback@12345";
  const displayName = `Diag Parent ${unique}`;

  await page.goto("/auth/signup");
  const signupInputs = page.locator("form input");
  await expect(signupInputs.nth(0)).toBeVisible();
  await signupInputs.nth(0).fill(displayName);
  await signupInputs.nth(1).fill(email);
  await signupInputs.nth(2).fill(password);
  await page.locator('button[type="submit"]').first().click();

  await expect(page).toHaveURL(/\/setup/);
  await page.locator("#setup-child-nickname").fill("Be Sao");
  await page.getByRole("button", { name: /^Tiếp tục$/i }).click();
  await page.getByRole("button", { name: /Hoàn tất thiết lập/i }).click();
  await page.getByRole("button", { name: /Vào bảng điều khiển phụ huynh/i }).click();

  await expect(page).toHaveURL(/\/parent\/dashboard/);
}

async function loginExisting(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();

  await expect(page).toHaveURL(/\/parent\/dashboard/);
}

test("diagnose real video playback on abeka lessons", async ({ page, baseURL }) => {
  const diagEmail = process.env.E2E_DIAG_EMAIL;
  const diagPassword = process.env.E2E_DIAG_PASSWORD;

  if (diagEmail && diagPassword) {
    await loginExisting(page, diagEmail, diagPassword);
  } else {
    await signupAndFinishSetup(page);
  }

  await page.goto("/courses/abeka");
  const learningNowLink = page.getByRole("link", { name: /Vào học ngay/i });
  if (await learningNowLink.count()) {
    await learningNowLink.first().click();
  } else {
    const checkoutButton = page.getByRole("button", { name: /Mua khóa học/i });
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();
  }

  await expect(page).toHaveURL(/\/courses\/abeka\/lessons/);

  const iframe = page.locator('iframe[src*="/api/lessons/"][src*="/secure-playback"]').first();
  const video = page
    .locator(
      'video[data-playback-src*="/api/lessons/"][data-playback-src*="/secure-playback"], video[src*="/api/lessons/"][src*="/secure-playback"]',
    )
    .first();
  const hasIframe = (await iframe.count()) > 0;
  const hasVideo = (await video.count()) > 0;

  const player = hasIframe ? iframe : video;
  await expect(player).toBeVisible();
  const playerSrc = hasIframe
    ? await player.getAttribute("src")
    : (await player.getAttribute("data-playback-src")) ?? (await player.getAttribute("src"));
  expect(playerSrc).toBeTruthy();

  const out: Record<string, unknown> = {
    tokenStreamType: null,
    embedUrl: null,
    hasIframe,
    hasVideo,
    playerSrc,
    securePlayback: null,
    upstream: null,
    videoState: null,
  };

  if (playerSrc && baseURL) {
    const parsed = new URL(playerSrc, baseURL);
    const secureResp = await page.request.get(parsed.toString(), { maxRedirects: 0 });
    const secureBody = await secureResp.text();
    const location = secureResp.headers()["location"];
    out.securePlayback = {
      status: secureResp.status(),
      contentType: secureResp.headers()["content-type"] ?? null,
      location: location ?? null,
      bodyHead: secureBody.slice(0, 200),
    };

    if (location) {
      const upstream = await page.request.get(location, { maxRedirects: 2 });
      const upstreamBody = await upstream.text();
      out.upstream = {
        status: upstream.status(),
        contentType: upstream.headers()["content-type"] ?? null,
        url: upstream.url(),
        bodyHead: upstreamBody.slice(0, 220),
      };
    }
  }

  if (hasVideo) {
    await page.waitForTimeout(4000);
    const state = await video.evaluate((el) => {
      const media = el as HTMLVideoElement;
      return {
        currentSrc: media.currentSrc,
        networkState: media.networkState,
        readyState: media.readyState,
        errorCode: media.error ? media.error.code : null,
        errorMessage: media.error ? media.error.message : null,
        canPlayMp4: media.canPlayType("video/mp4"),
        canPlayHls: media.canPlayType("application/vnd.apple.mpegurl"),
      };
    });
    out.videoState = state;
  }

  // eslint-disable-next-line no-console
  console.log(`VIDEO_DIAG ${JSON.stringify(out)}`);
});
