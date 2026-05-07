import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PARENT_EMAIL = "demo.parent@tinygeniushubvn.tech";
const DEMO_PARENT_PASSWORD = "DemoPass123!";

let testChildId: string | null = null;
let targetCourseSlug: string | null = null;
let targetCourseId: string | null = null;
let createdEnrollmentId: string | null = null;
let firstLessonId: string | null = null;

test.describe("Kid Course Mobile UI", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

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
        nickname: `E2E Course Kid ${Date.now()}`,
        ageBand: "4-5",
        dailyGoalMinutes: 15,
      },
      select: { id: true },
    });
    testChildId = child.id;

    let enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        parentId: parent.id,
        course: {
          isPublished: true,
          lessons: {
            some: {},
          },
        },
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
      const fallbackCourse = await prisma.course.findFirst({
        where: { isPublished: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, slug: true },
      });

      if (!fallbackCourse) {
        throw new Error("No published course found for kid course mobile e2e");
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
    targetCourseId = enrollment.courseId;

    const firstLesson = await prisma.courseLesson.findFirst({
      where: {
        courseId: enrollment.courseId,
      },
      orderBy: {
        orderNo: "asc",
      },
      select: {
        lessonId: true,
      },
    });

    if (!firstLesson) {
      throw new Error(`No lesson found for course ${targetCourseSlug}`);
    }

    firstLessonId = firstLesson.lessonId;

    const journey = await prisma.childCourseJourney.upsert({
      where: {
        childId_courseId: {
          childId: child.id,
          courseId: enrollment.courseId,
        },
      },
      update: {
        status: "ACTIVE",
        seedName: "Mam E2E",
        currentTierNo: 2,
        currentTierProgress: 50,
        activatedAt: new Date(),
      },
      create: {
        childId: child.id,
        courseId: enrollment.courseId,
        sourceEnrollmentId: enrollment.id,
        status: "ACTIVE",
        seedName: "Mam E2E",
        currentTierNo: 2,
        currentTierProgress: 50,
        activatedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.childCourseJourneyTier.upsert({
      where: {
        journeyId_tierNo: {
          journeyId: journey.id,
          tierNo: 1,
        },
      },
      update: {
        title: "Tier 1",
        tierKey: "e2e:tier-1",
        lessonTotal: 1,
        lessonCompleted: 1,
        isUnlocked: true,
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        journeyId: journey.id,
        tierNo: 1,
        title: "Tier 1",
        tierKey: "e2e:tier-1",
        lessonTotal: 1,
        lessonCompleted: 1,
        isUnlocked: true,
        unlockedAt: new Date(),
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    await prisma.lessonCompletion.upsert({
      where: {
        childId_lessonId: {
          childId: child.id,
          lessonId: firstLesson.lessonId,
        },
      },
      update: {
        quizScore: 100,
        checklist: {},
        minutesLearned: 10,
      },
      create: {
        childId: child.id,
        lessonId: firstLesson.lessonId,
        quizScore: 100,
        checklist: {},
        minutesLearned: 10,
      },
    });
  });

  test.afterAll(async () => {
    if (testChildId) {
      await prisma.childCourseJourneyEvent.deleteMany({
        where: {
          journey: { childId: testChildId },
        },
      });
      await prisma.childCourseJourneyTier.deleteMany({
        where: {
          journey: { childId: testChildId },
        },
      });
      await prisma.childCourseJourney.deleteMany({
        where: { childId: testChildId },
      });
      await prisma.lessonCompletion.deleteMany({
        where: { childId: testChildId },
      });
      await prisma.childProfile.deleteMany({
        where: { id: testChildId },
      });
    }

    if (createdEnrollmentId) {
      await prisma.courseEnrollment.deleteMany({
        where: { id: createdEnrollmentId },
      });
    }

    await prisma.$disconnect();
  });

  test("mobile course detail shows journey state and interactive cloud map", async ({ page }) => {
    if (!testChildId || !targetCourseSlug || !targetCourseId || !firstLessonId) {
      throw new Error("E2E setup is missing required course context");
    }

    await page.goto("/auth/login");
    await page.locator('input[type="email"]').first().fill(DEMO_PARENT_EMAIL);
    await page.locator('input[type="password"]').first().fill(DEMO_PARENT_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/parent\/dashboard/);

    await page.goto(`/kid/courses/${targetCourseSlug}?childId=${testChildId}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("kid-course-scene")).toBeVisible();
    await expect(page.getByTestId("kid-course-hero")).toBeVisible();
    await expect(page.getByTestId("kid-course-map")).toBeVisible();

    const journeyState = page.getByTestId("kid-course-journey-state");
    await expect(journeyState).toBeVisible();
    await expect(journeyState).toContainText(/Mầm mới|Đang lớn lên|Tạm nghỉ|Đã nở hoa/);

    await expect
      .poll(async () => page.locator('article[data-testid^="kid-course-tier-"]').count(), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);

    const activeTier = page.locator('article[data-node-state="active"]').first();
    await expect(activeTier).toBeVisible();

    const lockButton = page.locator(".ksg2-node-lock").first();
    if ((await lockButton.count()) > 0) {
      await lockButton.click();
      await expect(page.locator(".ksg2-status")).toContainText(/mở khóa tầng mới/i);
    }

    await page.screenshot({
      path: "test-results/playwright-artifacts/kid-course-mobile-ui.png",
      fullPage: true,
    });
  });
});

