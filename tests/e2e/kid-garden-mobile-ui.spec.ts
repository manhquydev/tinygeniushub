import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PARENT_EMAIL = "demo.parent@cungcontuhoc.vn";
const DEMO_PARENT_PASSWORD = "DemoPass123!";

let testChildId: string | null = null;
let targetCourseSlug: string | null = null;
let createdEnrollmentId: string | null = null;

test.describe("Kid Garden Mobile UI", () => {
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
        nickname: `E2E Garden Kid ${Date.now()}`,
        ageBand: "4-5",
        dailyGoalMinutes: 15,
      },
      select: { id: true },
    });
    testChildId = child.id;

    let enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        parentId: parent.id,
        course: { isPublished: true },
      },
      orderBy: { enrolledAt: "asc" },
      select: {
        id: true,
        courseId: true,
        course: { select: { slug: true } },
      },
    });

    if (!enrollment) {
      const fallbackCourse = await prisma.course.findFirst({
        where: { isPublished: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, slug: true },
      });

      if (!fallbackCourse) {
        throw new Error("No published course found for kid garden mobile e2e");
      }

      enrollment = await prisma.courseEnrollment.create({
        data: {
          parentId: parent.id,
          courseId: fallbackCourse.id,
        },
        select: {
          id: true,
          courseId: true,
          course: { select: { slug: true } },
        },
      });

      createdEnrollmentId = enrollment.id;
    }

    targetCourseSlug = enrollment.course.slug;

    const journey = await prisma.childCourseJourney.upsert({
      where: {
        childId_courseId: {
          childId: child.id,
          courseId: enrollment.courseId,
        },
      },
      update: {
        status: "ACTIVE",
        seedName: "Mầm E2E",
        currentTierNo: 1,
        currentTierProgress: 35,
        activatedAt: new Date(),
      },
      create: {
        childId: child.id,
        courseId: enrollment.courseId,
        sourceEnrollmentId: enrollment.id,
        status: "ACTIVE",
        seedName: "Mầm E2E",
        currentTierNo: 1,
        currentTierProgress: 35,
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
        lessonTotal: 10,
        lessonCompleted: 3,
        isUnlocked: true,
      },
      create: {
        journeyId: journey.id,
        tierNo: 1,
        title: "Tier 1",
        tierKey: "e2e:tier-1",
        lessonTotal: 10,
        lessonCompleted: 3,
        isUnlocked: true,
        unlockedAt: new Date(),
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

  test("mobile UX has ambient motion, plot idle interaction, sparkle and navigation", async ({ page }) => {
    if (!testChildId) {
      throw new Error("E2E setup is missing child");
    }

    await page.goto("/auth/login");
    await page.locator('input[type="email"]').first().fill(DEMO_PARENT_EMAIL);
    await page.locator('input[type="password"]').first().fill(DEMO_PARENT_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/parent\/dashboard/);

    await page.goto(`/kid/garden?childId=${testChildId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kid-garden-scene")).toBeVisible();
    await expect(page.getByTestId("kid-garden-ambient")).toBeVisible();
    await expect(page.getByTestId("kid-garden-grid")).toBeVisible();
    await expect
      .poll(async () => page.locator('article[data-testid^="kid-garden-plot-"]').count(), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);

    const preferredPlot =
      targetCourseSlug ? page.getByTestId(`kid-garden-plot-${targetCourseSlug}`).first() : null;
    const plot =
      preferredPlot && (await preferredPlot.count()) > 0
        ? preferredPlot
        : page.locator('article[data-testid^="kid-garden-plot-"]').first();
    await expect(plot).toBeVisible();

    const plotTestId = await plot.getAttribute("data-testid");
    if (!plotTestId) {
      throw new Error("Missing data-testid on selected plot");
    }
    const renderedCourseSlug = plotTestId.replace("kid-garden-plot-", "");

    await plot.dispatchEvent("pointerdown");
    await expect
      .poll(async () => (await plot.getAttribute("class")) ?? "", { timeout: 1000 })
      .toContain("is-tapping");

    const activeSparkle = plot.locator(".ksg-state-sparkle-active");
    await expect(activeSparkle).toBeVisible();

    await page.screenshot({
      path: "test-results/playwright-artifacts/kid-garden-mobile-ui.png",
      fullPage: true,
    });

    const cta = page.getByTestId(`kid-garden-plot-cta-${renderedCourseSlug}`).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(new RegExp(`/kid/courses/${renderedCourseSlug}\\?childId=${testChildId}`));
    await expect(page.locator(".kid-nav-feedback-overlay")).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId("kid-course-scene")).toBeVisible();
  });
});
