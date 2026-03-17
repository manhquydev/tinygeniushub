import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "e2e.admin@cungcontuhoc.vn";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "E2EAdmin@2026!";

test.describe("admin manual reconcile", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("admin can reconcile a pending payment and sync enrollment", async ({ page }) => {
    const publishedCourse = await prisma.course.findFirst({
      where: { isPublished: true },
      select: { id: true, slug: true, title: true },
      orderBy: { createdAt: "desc" },
    });
    expect(publishedCourse).toBeTruthy();
    if (!publishedCourse) {
      return;
    }

    const runId = Date.now();
    const parentEmail = `e2e.reconcile.parent.${runId}@cungcontuhoc.vn`;
    const parent = await prisma.parentAccount.create({
      data: {
        email: parentEmail,
        passwordHash: hashSync("ParentPass@2026!", 10),
        displayName: "E2E Reconcile Parent",
      },
      select: { id: true },
    });

    const providerTransactionId = `${runId}${Math.floor(Math.random() * 900 + 100)}`;
    const payment = await prisma.paymentRecord.create({
      data: {
        parentId: parent.id,
        provider: "payos",
        providerTransactionId,
        amountVnd: 1000,
        status: "PENDING",
        rawPayload: {
          kind: "course_checkout",
          target: {
            kind: "course",
            courseId: publishedCourse.id,
            courseSlug: publishedCourse.slug,
            title: publishedCourse.title,
          },
        },
      },
      select: { id: true, providerTransactionId: true },
    });

    const webhook = await prisma.webhookEvent.create({
      data: {
        provider: "payos",
        eventId: `${providerTransactionId}:manual-e2e`,
        signatureValid: true,
        status: "RECEIVED",
        payload: {
          orderCode: providerTransactionId,
          source: "e2e_admin_manual_reconcile",
        },
      },
      select: { id: true },
    });

    try {
      await page.goto("/admin/login");
      await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
      await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);

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
      await expect(page.getByRole("heading", { name: /Vận hành hệ thống/i }).first()).toBeVisible();

      await page.locator('input[type="number"]').first().fill("100");
      await page.getByRole("button", { name: /giao dịch/i }).first().click();

      const paymentRow = page
        .locator("tr", {
          hasText: payment.providerTransactionId,
          has: page.getByRole("button", { name: "Manual reconcile" }),
        })
        .first();
      await expect(paymentRow).toBeVisible({ timeout: 20_000 });

      await paymentRow.getByRole("button", { name: "Manual reconcile" }).click();

      await page.getByLabel("Action").selectOption("MARK_SUCCEEDED_AND_SYNC");
      await page.getByLabel("Webhook resolution").selectOption("PROCESSED");
      await page.getByLabel(/Chọn webhook liên quan/i).selectOption(webhook.id);
      await page.locator("textarea").first().fill("E2E reconcile payment + webhook + enrollment");
      await page.getByRole("button", { name: /Thực hiện reconcile/i }).click();

      await expect(paymentRow).toContainText("SUCCEEDED");

      const [updatedPayment, updatedWebhook, enrollment] = await Promise.all([
        prisma.paymentRecord.findUnique({
          where: { id: payment.id },
          select: { status: true },
        }),
        prisma.webhookEvent.findUnique({
          where: { id: webhook.id },
          select: { status: true },
        }),
        prisma.courseEnrollment.findUnique({
          where: {
            courseId_parentId: {
              courseId: publishedCourse.id,
              parentId: parent.id,
            },
          },
          select: { id: true, paymentId: true },
        }),
      ]);

      expect(updatedPayment?.status).toBe("SUCCEEDED");
      expect(updatedWebhook?.status).toBe("PROCESSED");
      expect(enrollment?.id).toBeTruthy();
      expect(enrollment?.paymentId).toBe(payment.id);
    } finally {
      await prisma.courseEnrollment.deleteMany({
        where: {
          parentId: parent.id,
          paymentId: payment.id,
        },
      });
      await prisma.webhookEvent.deleteMany({
        where: { id: webhook.id },
      });
      await prisma.paymentRecord.deleteMany({
        where: { id: payment.id },
      });
      await prisma.parentAccount.deleteMany({
        where: { id: parent.id },
      });
    }
  });
});
