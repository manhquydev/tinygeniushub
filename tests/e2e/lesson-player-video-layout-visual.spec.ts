import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COURSE_SLUG = "abeka";
const DEMO_PARENT_EMAIL = "demo.parent@cungcontuhoc.vn";
const DEMO_PARENT_PASSWORD = "DemoPass123!";

const VIEWPORT_CASES = [
  { name: "laptop-1366", width: 1366, height: 768, minWidthPct: 0.62 },
  { name: "desktop-1536", width: 1536, height: 864, minWidthPct: 0.65 },
  { name: "small-laptop-1024", width: 1024, height: 768, minWidthPct: 0.78 },
  { name: "tablet-834", width: 834, height: 1112, minWidthPct: 0.9 },
  { name: "tablet-768", width: 768, height: 1024, minWidthPct: 0.9 },
  { name: "mobile-390", width: 390, height: 844, minWidthPct: 0.88 },
] as const;

let testChildId: string | null = null;

async function loginAsDemoParent(page: Page) {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(DEMO_PARENT_EMAIL);
  await page.locator('input[type="password"]').first().fill(DEMO_PARENT_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await expect(page).toHaveURL(/\/parent\/dashboard/);
}

async function openLessonVideoStep(
  page: Page,
  childId: string,
) {
  await page.goto(`/kid/courses/${COURSE_SLUG}?childId=${childId}&focusTierNo=1`, {
    waitUntil: "domcontentloaded",
  });

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
        nickname: `Visual QA Kid ${Date.now()}`,
        ageBand: "4-5",
        dailyGoalMinutes: 20,
      },
      select: { id: true },
    });
    testChildId = child.id;
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
    await prisma.$disconnect();
  });

  for (const viewportCase of VIEWPORT_CASES) {
    test(`video panel snapshot and width ratio @${viewportCase.name}`, async ({ page }) => {
      if (!testChildId) {
        throw new Error("testChildId was not initialized");
      }

      await page.setViewportSize({
        width: viewportCase.width,
        height: viewportCase.height,
      });

      await loginAsDemoParent(page);
      await openLessonVideoStep(page, testChildId);
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
          maxDiffPixelRatio: 0.012,
        },
      );
    });
  }
});
