import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COURSE_SLUG = "little-fox-en-level-1";
const ABEKA_COURSE_SLUG = "abeka";
const DEMO_PARENT_EMAIL = "demo.parent@tinygeniushubvn.tech";
const DEMO_PARENT_PASSWORD = "DemoPass123!";

let testChildId: string | null = null;
let patchedLessonIds: string[] = [];
const originalLessonStateById = new Map<
  string,
  {
    videoSource: string | null;
    bunnyVideoId: string | null;
    videoStatus: string;
  }
>();

test.describe("Kid Course Lesson Flow", () => {
  test.beforeAll(async () => {
    const parent = await prisma.parentAccount.findFirst({
      where: {
        email: {
          equals: DEMO_PARENT_EMAIL,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });
    if (!parent) {
      throw new Error(`Parent account not found for ${DEMO_PARENT_EMAIL}`);
    }

    const child = await prisma.childProfile.create({
      data: {
        parentId: parent.id,
        nickname: `E2E Kid ${Date.now()}`,
        ageBand: "4-5",
        dailyGoalMinutes: 20,
      },
      select: { id: true },
    });
    testChildId = child.id;

    const firstLessons = await prisma.courseLesson.findMany({
      where: {
        course: {
          slug: COURSE_SLUG,
        },
      },
      orderBy: {
        orderNo: "asc",
      },
      take: 3,
      select: {
        lesson: {
          select: {
            id: true,
            videoSource: true,
            bunnyVideoId: true,
            videoStatus: true,
          },
        },
      },
    });

    if (firstLessons.length === 0) {
      throw new Error(`No lessons found for course slug ${COURSE_SLUG}`);
    }

    patchedLessonIds = firstLessons.map((row) => row.lesson.id);
    for (const row of firstLessons) {
      originalLessonStateById.set(row.lesson.id, {
        videoSource: row.lesson.videoSource,
        bunnyVideoId: row.lesson.bunnyVideoId,
        videoStatus: row.lesson.videoStatus,
      });
    }

    await prisma.lesson.updateMany({
      where: {
        id: {
          in: patchedLessonIds,
        },
      },
      data: {
        videoSource: null,
        bunnyVideoId: null,
        videoStatus: "none",
      },
    });
  });

  test.afterAll(async () => {
    if (patchedLessonIds.length > 0) {
      for (const lessonId of patchedLessonIds) {
        const original = originalLessonStateById.get(lessonId);
        if (!original) continue;
        await prisma.lesson.update({
          where: { id: lessonId },
          data: original,
        });
      }
    }

    if (testChildId) {
      await prisma.lessonCompletion.deleteMany({
        where: {
          childId: testChildId,
        },
      });

      await prisma.childProfile.delete({
        where: {
          id: testChildId,
        },
      });
    }

    await prisma.$disconnect();
  });

  test("start lesson -> intro/video -> no-activity fallback complete -> back to map", async ({
    page,
  }) => {
    if (!testChildId) {
      throw new Error("testChildId was not initialized");
    }

    await page.goto("/auth/login");
    await page.locator('input[type="email"]').first().fill(DEMO_PARENT_EMAIL);
    await page.locator('input[type="password"]').first().fill(DEMO_PARENT_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/parent\/dashboard/);

    await page.goto(`/kid/courses/${COURSE_SLUG}?childId=${testChildId}&focusTierNo=1`, {
      waitUntil: "domcontentloaded",
    });

    const startCardButton = page.locator(".lesson-flow-card button").first();
    await expect(startCardButton).toBeVisible();
    await expect(startCardButton).toBeEnabled();
    await startCardButton.click();

    const scene = page.locator(".lp-scene");
    await expect(scene).toBeVisible();

    const continueButton = scene.locator(".lp-video-panel .lp-btn-primary").first();
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    const fallbackCompleteButton = scene.locator("button").nth(1);
    await expect(fallbackCompleteButton).toBeVisible();
    await fallbackCompleteButton.click();

    // Player can close immediately after completion because map state advances to next tier.
    await expect(scene).toHaveCount(0);

    await expect(page.locator(".lesson-flow-card")).toContainText("2. Best Friends");

    const firstLessonId = patchedLessonIds[0];
    if (!firstLessonId) {
      throw new Error("No patched lesson id");
    }

    const completion = await prisma.lessonCompletion.findUnique({
      where: {
        childId_lessonId: {
          childId: testChildId,
          lessonId: firstLessonId,
        },
      },
      select: { id: true },
    });
    expect(completion?.id).toBeTruthy();
  });

  test("abeka: open lesson then tap Thoat to close player", async ({ page }) => {
    if (!testChildId) {
      throw new Error("testChildId was not initialized");
    }

    await page.goto("/auth/login");
    await page.locator('input[type="email"]').first().fill(DEMO_PARENT_EMAIL);
    await page.locator('input[type="password"]').first().fill(DEMO_PARENT_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/parent\/dashboard/);

    await page.goto(`/kid/courses/${ABEKA_COURSE_SLUG}?childId=${testChildId}&focusTierNo=1`, {
      waitUntil: "domcontentloaded",
    });

    const startCardButton = page.locator(".lesson-flow-card button").first();
    await expect(startCardButton).toBeVisible();
    await expect(startCardButton).toBeEnabled();
    await startCardButton.click();

    const scene = page.locator(".lp-scene");
    await expect(scene).toBeVisible();

    const watchedPercent = scene.locator(".lp-watch-progress-value").first();
    await expect(watchedPercent).toHaveText(/0%/);
    await page.waitForTimeout(6500);
    await expect(watchedPercent).toHaveText(/0%/);

    const exitButton = scene.getByRole("button", { name: /thoat bai hoc|thoat bai hoc/i });
    await expect(exitButton).toBeVisible();
    await exitButton.click();

    await expect(scene).toHaveCount(0);
    await expect(page).toHaveURL(
      new RegExp(`/kid/courses/${ABEKA_COURSE_SLUG}\\?childId=${testChildId}`),
    );
  });
});
