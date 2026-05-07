import { expect, test } from "@playwright/test";
import { PrismaClient, type Prisma } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();
const SITE_CONTENT_SETTINGS_ROW_ID = "default";

function asJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

test.describe("admin footer social links", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("admin updates footer social links and homepage reflects immediately", async ({ page }) => {
    const runId = Date.now();
    const adminEmail = `e2e.admin.footer.${runId}@tinygeniushubvn.tech`;
    const adminPassword = "E2EFooterLinks@2026!";

    const originalSettings = await prisma.siteContentSettings.findUnique({
      where: { id: SITE_CONTENT_SETTINGS_ROW_ID },
      select: {
        footerSocialLinks: true,
        updatedByActorId: true,
      },
    });

    await prisma.adminAccount.upsert({
      where: {
        email: adminEmail,
      },
      update: {
        passwordHash: hashSync(adminPassword, 10),
        displayName: "E2E Footer Links Admin",
        role: "SUPER_ADMIN",
        isActive: true,
      },
      create: {
        email: adminEmail,
        passwordHash: hashSync(adminPassword, 10),
        displayName: "E2E Footer Links Admin",
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    const nextLinks = {
      facebook: `https://facebook.com/e2e-footer-${runId}`,
      youtube: `https://youtube.com/@e2e-footer-${runId}`,
      tiktok: `https://tiktok.com/@e2e-footer-${runId}`,
      zalo: `https://zalo.me/e2e-footer-${runId}`,
    };

    try {
      await page.goto("/admin/login");
      await page.locator('input[type="email"]').fill(adminEmail);
      await page.locator('input[type="password"]').fill(adminPassword);

      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/admin/auth/login") &&
            response.request().method() === "POST",
        ),
        page.locator('button[type="submit"]').click(),
      ]);

      await expect(page).toHaveURL(/\/admin\/(overview|operations)(\?.*)?$/, {
        timeout: 20_000,
      });

      await page.goto("/admin/operations");
      await page.waitForURL("**/admin/operations", { timeout: 20_000 });

      await page.getByRole("button", { name: /Footer social/i }).click();
      await expect(page.getByRole("heading", { name: /Footer social links/i })).toBeVisible();

      await page.getByLabel("Facebook").fill(nextLinks.facebook);
      await page.getByLabel("YouTube").fill(nextLinks.youtube);
      await page.getByLabel("TikTok").fill(nextLinks.tiktok);
      await page.getByLabel("Zalo").fill(nextLinks.zalo);

      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/admin/site-settings/footer-social-links") &&
            response.request().method() === "PATCH",
        ),
        page.getByRole("button", { name: /Lưu social links/i }).click(),
      ]);

      await expect(page.getByText("Đã lưu link social ở footer.")).toBeVisible();

      await page.goto("/");
      await expect(page.getByLabel(/facebook/i)).toHaveAttribute("href", nextLinks.facebook);
      await expect(page.getByLabel(/youtube/i)).toHaveAttribute("href", nextLinks.youtube);
      await expect(page.getByLabel(/tiktok/i)).toHaveAttribute("href", nextLinks.tiktok);
      await expect(page.getByLabel(/zalo/i)).toHaveAttribute("href", nextLinks.zalo);
    } finally {
      if (originalSettings) {
        await prisma.siteContentSettings.upsert({
          where: {
            id: SITE_CONTENT_SETTINGS_ROW_ID,
          },
          update: {
            footerSocialLinks: asJsonInput(originalSettings.footerSocialLinks),
            updatedByActorId: originalSettings.updatedByActorId,
          },
          create: {
            id: SITE_CONTENT_SETTINGS_ROW_ID,
            footerSocialLinks: asJsonInput(originalSettings.footerSocialLinks),
            updatedByActorId: originalSettings.updatedByActorId,
          },
        });
      } else {
        await prisma.siteContentSettings.deleteMany({
          where: {
            id: SITE_CONTENT_SETTINGS_ROW_ID,
          },
        });
      }

      await prisma.adminAccount.deleteMany({
        where: {
          email: adminEmail,
        },
      });
    }
  });
});
