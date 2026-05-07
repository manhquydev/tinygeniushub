import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { handleRouteError } from "@/lib/route-error";
import {
  parseMarketingEmailUnsubscribeToken,
  verifyMarketingEmailUnsubscribeToken,
} from "@/modules/platform/marketing-email-unsubscribe-token";

const unsubscribeQuerySchema = z.object({
  token: z.string().trim().min(20).max(512),
});

function renderHtmlMessage(requestUrl: string, message: string) {
  const homeUrl = resolveEmailPublicBaseUrl(requestUrl);
  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hủy nhận email marketing</title>
  </head>
  <body style="font-family: system-ui, sans-serif; margin: 0; background: #f8fafc; color: #0f172a;">
    <main style="max-width: 560px; margin: 64px auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h1 style="font-size: 20px; margin: 0 0 12px;">TinyGenius Hub</h1>
      <p style="font-size: 16px; margin: 0; line-height: 1.6;">${message}</p>
      <p style="margin: 16px 0 0;">
        <a href="${homeUrl}" style="color: #0369a1; text-decoration: underline;">Quay về trang chủ</a>
      </p>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  try {
    const { token } = unsubscribeQuerySchema.parse({
      token: new URL(request.url).searchParams.get("token") ?? "",
    });

    const parsedToken = parseMarketingEmailUnsubscribeToken(token);
    if (!parsedToken) {
      return renderHtmlMessage(request.url, "Liên kết hủy đăng ký không hợp lệ.");
    }

    const parent = await prisma.parentAccount.findUnique({
      where: { id: parsedToken.parentId },
      select: { id: true, email: true },
    });
    if (!parent) {
      return renderHtmlMessage(request.url, "Không tìm thấy tài khoản tương ứng với liên kết này.");
    }

    const verifiedParentId = verifyMarketingEmailUnsubscribeToken({
      token,
      parentEmail: parent.email,
    });
    if (!verifiedParentId || verifiedParentId !== parent.id) {
      return renderHtmlMessage(request.url, "Liên kết hủy đăng ký không hợp lệ hoặc đã hết hạn.");
    }

    await prisma.parentPreferences.upsert({
      where: { parentId: parent.id },
      create: {
        parentId: parent.id,
        weeklyReportChannel: "IN_APP_AND_EMAIL",
        weeklyReportEmailEnabled: true,
        marketingEmailOptIn: false,
        timezone: "Asia/Bangkok",
      },
      update: {
        marketingEmailOptIn: false,
      },
    });

    return renderHtmlMessage(request.url, "Bạn đã hủy nhận email marketing thành công.");
  } catch (error) {
    return handleRouteError(error, {
      routeId: "email.marketing.unsubscribe",
    });
  }
}
