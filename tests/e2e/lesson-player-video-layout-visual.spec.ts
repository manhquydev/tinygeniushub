import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PARENT_EMAIL = "demo.parent@tinygeniushubvn.tech";
const DEMO_PARENT_PASSWORD = "DemoPass123!";
const PREFERRED_COURSE_SLUG = "abeka";
const AUTH_STATE_PATH = path.join(
  process.cwd(),
  "test-results",
  "playwright-artifacts",
  "video-layout-parent-auth-state.json",
);

const VIEWPORT_CASES = [
  { name: "laptop-1366", width: 1366, height: 768, minWidthPct: 0.62 },
  { name: "desktop-1536", width: 1536, height: 864, minWidthPct: 0.65 },
  { name: "small-laptop-1024", width: 1024, height: 768, minWidthPct: 0.78 },
  { name: "tablet-834", width: 834, height: 1112, minWidthPct: 0.9 },
  { name: "tablet-768", width: 768, height: 1024, minWidthPct: 0.9 },
  { name: "mobile-390", width: 390, height: 844, minWidthPct: 0.88 },
] as const;

let testChildId: string | null = null;
let targetCourseSlug: string | null = null;
let createdEnrollmentId: string | null = null;

async function loginAsDemoParent(page: Page) {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(DEMO_PARENT_EMAIL);
  await page.locator('input[type="password"]').first().fill(DEMO_PARENT_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await expect(page).toHaveURL(/\/(parent\/dashboard|setup)/);
}

async function createAuthState(browser: Browser) {
  await mkdir(path.dirname(AUTH_STATE_PATH), { recursive: true });
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await loginAsDemoParent(page);
  await context.storageState({ path: AUTH_STATE_PATH });
  await context.close();
}

async function openLessonVideoStep(
  page: Page,
  childId: string,
  courseSlug: string,
) {
  await page.goto(`/kid/courses/${courseSlug}?childId=${childId}&focusTierNo=1`, {
    waitUntil: "domcontentloaded",
  });

  const necessaryCookies = page.getByRole("button", { name: "Only necessary cookies" });
  if (await necessaryCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
    await necessaryCookies.click();
  }

  const startCardButton = page.locator(".lesson-flow-card button").first();
  await expect(startCardButton).toBeVisible();
  await startCardButton.click();

  const scene = page.locator(".lp-scene");
  await expect(scene).toBeVisible();
  await expect(scene.locator(".lp-video-panel")).toBeVisible();
  await expect(scene.locator(".lp-video-frame")).toBeVisible();
}

async function stabilizeVisualSnapshot(page: Page) {
  await page.addStyleTag({
    content: `
      .lp-three-layer,
      .lp-bg-overlay {
        display: none !important;
      }

      .lp-video-frame video,
      .lp-video-frame iframe {
        visibility: hidden !important;
      }

      .lp-video-frame::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      }

      .lp-watch-progress-value,
      .lp-watch-progress-label,
      .lp-watch-progress-hint,
      .lp-video-head h3,
      .lp-video-head p {
        color: transparent !important;
        text-shadow: none !important;
      }

      .lp-ring-fill {
        opacity: 0 !important;
      }
    `,
  });
}

test.describe("Lesson player video layout guard", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeAll(async ({ browser }) => {
    await createAuthState(browser);

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
        nickname: `Visual QA Kid ${Date.now()}`,
        ageBand: "4-5",
        dailyGoalMinutes: 20,
      },
      select: { id: true },
    });
    testChildId = child.id;

    const preferredCourse = await prisma.course.findFirst({
      where: {
        slug: PREFERRED_COURSE_SLUG,
        isPublished: true,
        lessons: {
          some: {},
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    let enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        parentId: parent.id,
        ...(preferredCourse
          ? {
              courseId: preferredCourse.id,
            }
          : {
              course: {
                isPublished: true,
                lessons: {
                  some: {},
                },
              },
            }),
      },
      orderBy: { enrolledAt: "asc" },
      select: {
        id: true,
        courseId: true,
        course: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!enrollment) {
      const fallbackCourse =
        preferredCourse ??
        (await prisma.course.findFirst({
          where: {
            isPublished: true,
            lessons: {
              some: {},
            },
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            slug: true,
          },
        }));

      if (!fallbackCourse) {
        throw new Error("No published course with lessons found for video layout e2e");
      }

      enrollment = await prisma.courseEnrollment.create({
        data: {
          parentId: parent.id,
          courseId: fallbackCourse.id,
        },
        select: {
          id: true,
          courseId: true,
          course: {
            select: {
              slug: true,
            },
          },
        },
      });
      createdEnrollmentId = enrollment.id;
    }

    targetCourseSlug = enrollment.course.slug;
  });

  test.afterAll(async () => {
    if (testChildId) {
      await prisma.lessonCompletion.deleteMany({
        where: { childId: testChildId },
      });
      await prisma.childProfile.delete({
        where: { id: testChildId },
      });
    }
    if (createdEnrollmentId) {
      await prisma.courseEnrollment.deleteMany({
        where: { id: createdEnrollmentId },
      });
    }
    await rm(AUTH_STATE_PATH, { force: true });
    await prisma.$disconnect();
  });

  for (const viewportCase of VIEWPORT_CASES) {
    test(`video panel snapshot and width ratio @${viewportCase.name}`, async ({ page }) => {
      if (!testChildId) {
        throw new Error("testChildId was not initialized");
      }
      if (!targetCourseSlug) {
        throw new Error("targetCourseSlug was not initialized");
      }

      await page.setViewportSize({
        width: viewportCase.width,
        height: viewportCase.height,
      });

      await openLessonVideoStep(page, testChildId, targetCourseSlug);
      await stabilizeVisualSnapshot(page);

      const metrics = await page.evaluate(() => {
        const frame = document.querySelector<HTMLElement>(".lp-video-frame");
        const panel = document.querySelector<HTMLElement>(".lp-video-panel");
        if (!frame || !panel) {
          return null;
        }
        const frameRect = frame.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        return {
          frameWidth: frameRect.width,
          frameHeight: frameRect.height,
          panelWidth: panelRect.width,
          viewportWidth: window.innerWidth,
          widthPct: frameRect.width / window.innerWidth,
          aspectRatio: frameRect.width / Math.max(1, frameRect.height),
        };
      });

      expect(metrics).toBeTruthy();
      expect(metrics!.widthPct).toBeGreaterThanOrEqual(viewportCase.minWidthPct);
      expect(Math.abs(metrics!.frameWidth - metrics!.panelWidth)).toBeLessThanOrEqual(1.5);
      expect(metrics!.aspectRatio).toBeGreaterThan(1.7);
      expect(metrics!.aspectRatio).toBeLessThan(1.82);

      await expect(page.locator(".lp-video-panel")).toHaveScreenshot(
        `video-panel-${viewportCase.name}.png`,
        {
          animations: "disabled",
          caret: "hide",
          scale: "css",
          maxDiffPixelRatio: viewportCase.name === "desktop-1536" ? 0.025 : 0.012,
        },
      );
    });
  }
});
