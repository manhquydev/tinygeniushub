import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  moderateCommentMock,
  prismaMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  moderateCommentMock: vi.fn(),
  prismaMock: {
    blogComment: {
      findMany: vi.fn(),
    },
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

vi.mock("@/modules/blog/comment-service", () => ({
  commentService: {
    moderateComment: moderateCommentMock,
  },
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
  });

  it("moderates comments in bulk", async () => {
    prismaMock.blogComment.findMany.mockResolvedValue([{ id: "comment-1" }, { id: "comment-2" }]);
    moderateCommentMock.mockResolvedValue(undefined);

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
    expect(moderateCommentMock).toHaveBeenCalledTimes(2);
    expect(moderateCommentMock).toHaveBeenCalledWith("comment-1", "SPAM");
    expect(moderateCommentMock).toHaveBeenCalledWith("comment-2", "SPAM");
  });

  it("returns 404 when any requested comment is missing", async () => {
    prismaMock.blogComment.findMany.mockResolvedValue([{ id: "comment-1" }]);

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
    expect(moderateCommentMock).not.toHaveBeenCalled();
  });
});
