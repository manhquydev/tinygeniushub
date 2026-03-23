import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, countMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  countMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    blogComment: {
      findUnique: findUniqueMock,
      count: countMock,
      create: createMock,
    },
  },
}));

vi.mock("@/modules/reader/reader-service", () => ({
  notifyCommentReply: vi.fn(),
}));

vi.mock("@/worker/queue", () => ({
  enqueueNotifyBlogCommentReply: vi.fn(),
}));

import { commentService } from "@/modules/blog/comment-service";

describe("commentService.submitComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countMock.mockResolvedValue(0);
    createMock.mockResolvedValue({ id: "comment_1" });
  });

  it("rejects when parent comment does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(
      commentService.submitComment({
        postId: "post_1",
        parentId: "missing_parent",
        authorName: "Parent User",
        authorEmail: "parent@example.com",
        content: "Nội dung bình luận hợp lệ với hơn mười ký tự.",
      }),
    ).rejects.toMatchObject({
      code: "PARENT_COMMENT_NOT_FOUND",
      status: 404,
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects when parent comment belongs to another post", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "comment_parent",
      postId: "post_other",
    });

    await expect(
      commentService.submitComment({
        postId: "post_target",
        parentId: "comment_parent",
        authorName: "Parent User",
        authorEmail: "parent@example.com",
        content: "Nội dung bình luận hợp lệ với hơn mười ký tự.",
      }),
    ).rejects.toMatchObject({
      code: "PARENT_COMMENT_POST_MISMATCH",
      status: 400,
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates comment when parent comment is in the same post", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "comment_parent",
      postId: "post_target",
    });

    const result = await commentService.submitComment({
      postId: "post_target",
      parentId: "comment_parent",
      authorName: "Parent User",
      authorEmail: "parent@example.com",
      content: "Nội dung bình luận hợp lệ với hơn mười ký tự.",
      ipHash: "hash_1",
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postId: "post_target",
          parentId: "comment_parent",
          status: "PENDING",
        }),
      }),
    );
    expect(result.shouldSendVerification).toBe(true);
  });
});
