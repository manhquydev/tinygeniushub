import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  enqueueNotifyBlogCommentReplyMock,
  notifyCommentReplyMock,
  logWarnMock,
  prismaMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  enqueueNotifyBlogCommentReplyMock: vi.fn(),
  notifyCommentReplyMock: vi.fn(),
  logWarnMock: vi.fn(),
  prismaMock: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/security/admin-rate-limit", () => ({
  enforceAdminMutationRateLimit: enforceAdminMutationRateLimitMock,
}));

vi.mock("@/worker/queue", () => ({
  enqueueNotifyBlogCommentReply: enqueueNotifyBlogCommentReplyMock,
}));

vi.mock("@/modules/reader/reader-service", () => ({
  notifyCommentReply: notifyCommentReplyMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logWarn: logWarnMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { POST } from "@/app/api/admin/blog/comments/bulk/route";

describe("admin blog comments bulk route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
    logWarnMock.mockReset();

    prismaMock.$transaction.mockImplementation(async (callback: (tx: { blogComment: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> } }) => unknown) => {
      const tx = {
        blogComment: {
          findMany: vi.fn(),
          updateMany: vi.fn(),
        },
      };
      return callback(tx);
    });
  });

  it("moderates comments in bulk", async () => {
    prismaMock.$transaction.mockImplementationOnce(async (callback: (tx: { blogComment: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> } }) => unknown) => {
      const tx = {
        blogComment: {
          findMany: vi.fn().mockResolvedValue([{ id: "comment-1" }, { id: "comment-2" }]),
          updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };
      return callback(tx);
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/comments/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "spam",
          commentIds: ["comment-1", "comment-2"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ updatedCount: 2 });
    expect(enqueueNotifyBlogCommentReplyMock).not.toHaveBeenCalled();
    expect(notifyCommentReplyMock).not.toHaveBeenCalled();
  });

  it("returns 404 when any requested comment is missing", async () => {
    prismaMock.$transaction.mockImplementationOnce(async (callback: (tx: { blogComment: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> } }) => unknown) => {
      const tx = {
        blogComment: {
          findMany: vi.fn().mockResolvedValue([{ id: "comment-1" }]),
          updateMany: vi.fn(),
        },
      };
      return callback(tx);
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/comments/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "approve",
          commentIds: ["comment-1", "comment-2"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.message).toBe("One or more comments were not found");
    expect(enqueueNotifyBlogCommentReplyMock).not.toHaveBeenCalled();
    expect(notifyCommentReplyMock).not.toHaveBeenCalled();
  });

  it("enqueues notifications for approved replies after transaction", async () => {
    prismaMock.$transaction.mockImplementationOnce(async (callback: (tx: { blogComment: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> } }) => unknown) => {
      const findManyMock = vi
        .fn()
        .mockResolvedValueOnce([{ id: "comment-1" }])
        .mockResolvedValueOnce([
          {
            id: "comment-1",
            post: { slug: "bai-viet-a", titleVi: "Bai viet A" },
            parent: { id: "parent-1", authorEmail: "reader@example.com" },
          },
        ]);
      const tx = {
        blogComment: {
          findMany: findManyMock,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/comments/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "approve",
          commentIds: ["comment-1"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ updatedCount: 1 });
    expect(enqueueNotifyBlogCommentReplyMock).toHaveBeenCalledWith({
      parentCommentId: "parent-1",
      replyCommentId: "comment-1",
      postSlug: "bai-viet-a",
    });
    expect(notifyCommentReplyMock).toHaveBeenCalledWith({
      recipientEmail: "reader@example.com",
      postTitle: "Bai viet A",
      postSlug: "bai-viet-a",
    });
  });

  it("skips side effects when comments already have requested status", async () => {
    prismaMock.$transaction.mockImplementationOnce(async (callback: (tx: { blogComment: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> } }) => unknown) => {
      const tx = {
        blogComment: {
          findMany: vi.fn().mockResolvedValue([{ id: "comment-1", status: "APPROVED" }]),
          updateMany: vi.fn(),
        },
      };
      return callback(tx);
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/comments/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "approve",
          commentIds: ["comment-1"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ updatedCount: 0 });
    expect(enqueueNotifyBlogCommentReplyMock).not.toHaveBeenCalled();
    expect(notifyCommentReplyMock).not.toHaveBeenCalled();
  });

  it("does not fail request when notification side effects throw", async () => {
    prismaMock.$transaction.mockImplementationOnce(async (callback: (tx: { blogComment: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> } }) => unknown) => {
      const findManyMock = vi
        .fn()
        .mockResolvedValueOnce([{ id: "comment-1", status: "PENDING" }])
        .mockResolvedValueOnce([
          {
            id: "comment-1",
            post: { slug: "bai-viet-a", titleVi: "Bai viet A" },
            parent: { id: "parent-1", authorEmail: "reader@example.com" },
          },
        ]);
      const tx = {
        blogComment: {
          findMany: findManyMock,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });
    enqueueNotifyBlogCommentReplyMock.mockRejectedValueOnce(new Error("queue down"));

    const response = await POST(
      new Request("http://localhost/api/admin/blog/comments/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "approve",
          commentIds: ["comment-1"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ updatedCount: 1 });
    expect(logWarnMock).toHaveBeenCalledWith(
      "admin.blog.comments.bulk.notification_failed",
      expect.objectContaining({ reason: "queue down" }),
    );
  });
});

