import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_COURSE_SLUG = "abeka";
const E2E_VIDEO_SOURCE = "https://fileta.hoctienganh.xyz/e2e/learning-flow.mp4";

let patchedLessonId: string | null = null;
let originalLessonState: { bunnyVideoId: string | null; videoStatus: string; videoSource: string | null } | null = null;

test.describe("Learning Flow Integration", () => {
  test.beforeAll(async () => {
    await prisma.course.updateMany({
      where: {
        slug: {
          in: ["abeka", "littlefox", "littlefoxcn"],
        },
      },
      data: {
        isPublished: true,
      },
    });

    const firstCourseLesson = await prisma.courseLesson.findFirst({
      where: {
        course: {
          slug: TARGET_COURSE_SLUG,
        },
      },
      orderBy: {
        orderNo: "asc",
      },
      select: {
        lesson: {
          select: {
            id: true,
            bunnyVideoId: true,
            videoStatus: true,
            videoSource: true,
          },
        },
      },
    });

    if (firstCourseLesson?.lesson) {
      patchedLessonId = firstCourseLesson.lesson.id;
      originalLessonState = {
        bunnyVideoId: firstCourseLesson.lesson.bunnyVideoId,
        videoStatus: firstCourseLesson.lesson.videoStatus,
        videoSource: firstCourseLesson.lesson.videoSource,
      };

      await prisma.lesson.update({
        where: { id: patchedLessonId },
        data: {
          bunnyVideoId: null,
          videoStatus: "none",
          videoSource: E2E_VIDEO_SOURCE,
        },
      });
    }
  });

  test.afterAll(async () => {
    if (patchedLessonId && originalLessonState) {
      await prisma.lesson.update({
        where: { id: patchedLessonId },
        data: originalLessonState,
      });
    }

    await prisma.$disconnect();
  });

  test("outside-in flow: signup -> enroll -> open lessons player -> resolve secure video", async ({
    page,
    baseURL,
  }) => {
    const unique = Date.now();
    const email = `e2e.learning.${unique}@example.com`;
    const password = "E2eLearning@12345";
    const displayName = `E2E Parent ${unique}`;

    await page.goto("/auth/signup");
    await page.getByLabel("Tên hiển thị").fill(displayName);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu").fill(password);
    await page.getByRole("button", { name: /Bắt đầu dùng thử/i }).click();

    await expect(page).toHaveURL(/\/setup/);

    await page.locator("#setup-child-nickname").fill("Be Sao");
    await page.getByRole("button", { name: /^Tiếp tục$/i }).click();
    await page.getByRole("button", { name: /Hoàn tất thiết lập/i }).click();
    await page.getByRole("button", { name: /Vào bảng điều khiển phụ huynh/i }).click();

    await expect(page).toHaveURL(/\/parent\/dashboard/);

    await page.goto(`/courses/${TARGET_COURSE_SLUG}`);

    const learningNowLink = page.getByRole("link", { name: /Vào học ngay/i });
    if (await learningNowLink.count()) {
      await learningNowLink.first().click();
    } else {
      const checkoutButton = page.getByRole("button", { name: /Mua khóa học/i });
      await expect(checkoutButton).toBeVisible();
      await checkoutButton.click();
    }

    await expect(page).toHaveURL(new RegExp(`/courses/${TARGET_COURSE_SLUG}/lessons`));

    const videoTokenResponse = await page.waitForResponse((response) =>
      /\/api\/lessons\/[^/]+\/video-token$/.test(response.url()),
    );
    expect(videoTokenResponse.ok()).toBeTruthy();
    const tokenPayload = (await videoTokenResponse.json()) as {
      ok?: boolean;
      data?: { embedUrl?: string };
    };
    expect(tokenPayload.ok).toBe(true);
    expect(typeof tokenPayload.data?.embedUrl).toBe("string");

    const secureIframe = page
      .locator('iframe[src*="/api/lessons/"][src*="/secure-playback"]')
      .first();
    const secureVideo = page
      .locator(
        'video[data-playback-src*="/api/lessons/"][data-playback-src*="/secure-playback"], video[src*="/api/lessons/"][src*="/secure-playback"]',
      )
      .first();
    const hasSecureIframe = (await secureIframe.count()) > 0;
    const hasSecureVideo = (await secureVideo.count()) > 0;
    expect(hasSecureIframe || hasSecureVideo).toBe(true);
    expect(hasSecureIframe).toBe(false);
    const player = hasSecureIframe ? secureIframe : secureVideo;
    await expect(player).toBeVisible();
    const playerSrc = hasSecureIframe
      ? await player.getAttribute("src")
      : (await player.getAttribute("data-playback-src")) ?? (await player.getAttribute("src"));
    expect(playerSrc).toBeTruthy();

    if (playerSrc && baseURL) {
      const parsed = new URL(playerSrc, baseURL);
      expect(parsed.pathname).toMatch(/\/api\/lessons\/[^/]+\/secure-playback$/);
      expect(parsed.searchParams.get("token")).toBeTruthy();

      const secureResponse = await page.request.get(parsed.toString(), {
        maxRedirects: 0,
      });
      expect([302, 307, 308]).toContain(secureResponse.status());
      const location = secureResponse.headers()["location"];
      expect(typeof location).toBe("string");
      expect(location).toMatch(/^https?:\/\//i);
    }
  });
});
