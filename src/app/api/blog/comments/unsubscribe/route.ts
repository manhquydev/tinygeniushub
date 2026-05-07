import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import {
  parseCommentReplyUnsubscribeToken,
  verifyCommentReplyUnsubscribeToken,
} from "@/modules/blog/comment-reply-notification-token";

const unsubscribeQuerySchema = z.object({
  token: z.string().trim().min(20).max(512),
});

function renderHtmlMessage(message: string) {
  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Thông báo bình luận</title>
  </head>
  <body style="font-family: system-ui, sans-serif; margin: 0; background: #f8fafc; color: #0f172a;">
    <main style="max-width: 560px; margin: 64px auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h1 style="font-size: 20px; margin: 0 0 12px;">TinyGenius Hub</h1>
      <p style="font-size: 16px; margin: 0; line-height: 1.6;">${message}</p>
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
    const searchParams = new URL(request.url).searchParams;
    const { token } = unsubscribeQuerySchema.parse({
      token: searchParams.get("token") ?? "",
    });

    const parsedToken = parseCommentReplyUnsubscribeToken(token);
    if (!parsedToken) {
      return renderHtmlMessage("Link hủy đăng ký không hợp lệ.");
    }

    const comment = await prisma.blogComment.findUnique({
      where: { id: parsedToken.commentId },
      select: {
        id: true,
        authorEmail: true,
        notifyOnReply: true,
      },
    });

    if (!comment) {
      return renderHtmlMessage("Không tìm thấy bình luận tương ứng với link này.");
    }

    const verifiedCommentId = verifyCommentReplyUnsubscribeToken({
      token,
      authorEmail: comment.authorEmail,
    });

    if (!verifiedCommentId || verifiedCommentId !== comment.id) {
      return renderHtmlMessage("Link hủy đăng ký không hợp lệ hoặc đã hết hạn.");
    }

    if (!comment.notifyOnReply) {
      return renderHtmlMessage("Bạn đã tắt thông báo trả lời bình luận trước đó.");
    }

    await prisma.blogComment.update({
      where: { id: comment.id },
      data: {
        notifyOnReply: false,
      },
    });

    return renderHtmlMessage("Bạn đã tắt thông báo email cho phản hồi bình luận.");
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.comments.unsubscribe",
    });
  }
}
