import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlogPostStatus } from "@prisma/client";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  invalidateBlogCacheMock,
  createVersionMock,
  deleteOldVersionsMock,
  notifyNewPostMock,
  prismaMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  invalidateBlogCacheMock: vi.fn(),
  createVersionMock: vi.fn(),
  deleteOldVersionsMock: vi.fn(),
  notifyNewPostMock: vi.fn(),
  prismaMock: {
    blogPost: {
      findMany: vi.fn(),
    },
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

vi.mock("@/lib/blog-cache", () => ({
  invalidateBlogCache: invalidateBlogCacheMock,
}));

vi.mock("@/modules/blog/blog-version-repository", () => ({
  createVersion: createVersionMock,
  deleteOldVersions: deleteOldVersionsMock,
}));

vi.mock("@/modules/reader/reader-service", () => ({
  notifyNewPost: notifyNewPostMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { POST } from "@/app/api/admin/blog/posts/bulk/route";

describe("admin blog posts bulk route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
  });

  it("publishes posts in bulk and saves versions for status changes", async () => {
    prismaMock.blogPost.findMany.mockResolvedValue([
      {
        id: "post-1",
        titleVi: "Post 1",
        contentMarkdown: "Content 1",
        excerptVi: "Excerpt 1",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.DRAFT,
        publishedAt: null,
      },
      {
        id: "post-2",
        titleVi: "Post 2",
        contentMarkdown: "Content 2",
        excerptVi: "Excerpt 2",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: new Date("2026-03-23T10:00:00.000Z"),
      },
    ]);

    const updateMock = vi
      .fn()
      .mockResolvedValueOnce({
        id: "post-1",
        titleVi: "Post 1",
        contentMarkdown: "Content 1",
        excerptVi: "Excerpt 1",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.PUBLISHED,
      })
      .mockResolvedValueOnce({
        id: "post-2",
        titleVi: "Post 2",
        contentMarkdown: "Content 2",
        excerptVi: "Excerpt 2",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.PUBLISHED,
      });

    prismaMock.$transaction.mockImplementation(async (callback: (tx: { blogPost: { update: typeof updateMock } }) => Promise<void>) => {
      await callback({
        blogPost: {
          update: updateMock,
        },
      });
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/posts/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "publish",
          postIds: ["post-1", "post-2"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ updatedCount: 2 });
    expect(createVersionMock).toHaveBeenCalledTimes(1);
    expect(createVersionMock).toHaveBeenCalledWith(
      "post-1",
      expect.objectContaining({
        titleVi: "Post 1",
        status: BlogPostStatus.PUBLISHED,
      }),
      "admin@example.com",
      expect.any(Object),
    );
    expect(deleteOldVersionsMock).toHaveBeenCalledTimes(1);
    expect(deleteOldVersionsMock).toHaveBeenCalledWith("post-1", 50);
    expect(notifyNewPostMock).toHaveBeenCalledTimes(1);
    expect(notifyNewPostMock).toHaveBeenCalledWith("post-1");
    expect(invalidateBlogCacheMock).toHaveBeenCalledWith("*");
  });

  it("archives posts in bulk without triggering publish notifications", async () => {
    prismaMock.blogPost.findMany.mockResolvedValue([
      {
        id: "post-1",
        titleVi: "Post 1",
        contentMarkdown: "Content 1",
        excerptVi: "Excerpt 1",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: new Date("2026-03-23T10:00:00.000Z"),
      },
      {
        id: "post-2",
        titleVi: "Post 2",
        contentMarkdown: "Content 2",
        excerptVi: "Excerpt 2",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.DRAFT,
        publishedAt: null,
      },
    ]);

    const updateMock = vi
      .fn()
      .mockResolvedValueOnce({
        id: "post-1",
        titleVi: "Post 1",
        contentMarkdown: "Content 1",
        excerptVi: "Excerpt 1",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.ARCHIVED,
      })
      .mockResolvedValueOnce({
        id: "post-2",
        titleVi: "Post 2",
        contentMarkdown: "Content 2",
        excerptVi: "Excerpt 2",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.ARCHIVED,
      });

    prismaMock.$transaction.mockImplementation(async (callback: (tx: { blogPost: { update: typeof updateMock } }) => Promise<void>) => {
      await callback({
        blogPost: {
          update: updateMock,
        },
      });
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/posts/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "archive",
          postIds: ["post-1", "post-2"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ updatedCount: 2 });
    expect(createVersionMock).toHaveBeenCalledTimes(2);
    expect(deleteOldVersionsMock).toHaveBeenCalledTimes(2);
    expect(notifyNewPostMock).not.toHaveBeenCalled();
    expect(invalidateBlogCacheMock).toHaveBeenCalledWith("*");
  });

  it("deduplicates post ids before delete bulk action", async () => {
    prismaMock.blogPost.findMany.mockResolvedValue([
      {
        id: "post-1",
        titleVi: "Post 1",
        contentMarkdown: "Content 1",
        excerptVi: "Excerpt 1",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: new Date("2026-03-23T10:00:00.000Z"),
      },
    ]);

    const updateMock = vi.fn().mockResolvedValue({
      id: "post-1",
      titleVi: "Post 1",
      contentMarkdown: "Content 1",
      excerptVi: "Excerpt 1",
      metaTitleVi: null,
      metaDescVi: null,
      coverImageUrl: null,
      status: BlogPostStatus.ARCHIVED,
    });

    prismaMock.$transaction.mockImplementation(async (callback: (tx: { blogPost: { update: typeof updateMock } }) => Promise<void>) => {
      await callback({
        blogPost: {
          update: updateMock,
        },
      });
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/posts/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "delete",
          postIds: ["post-1", "post-1"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ updatedCount: 1 });
    expect(prismaMock.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: {
            in: ["post-1"],
          },
        },
      }),
    );
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(notifyNewPostMock).not.toHaveBeenCalled();
    expect(invalidateBlogCacheMock).toHaveBeenCalledWith("*");
  });

  it("returns 404 when any requested post is missing", async () => {
    prismaMock.blogPost.findMany.mockResolvedValue([
      {
        id: "post-1",
        titleVi: "Post 1",
        contentMarkdown: "Content 1",
        excerptVi: "Excerpt 1",
        metaTitleVi: null,
        metaDescVi: null,
        coverImageUrl: null,
        status: BlogPostStatus.DRAFT,
        publishedAt: null,
      },
    ]);

    const response = await POST(
      new Request("http://localhost/api/admin/blog/posts/bulk", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "archive",
          postIds: ["post-1", "post-2"],
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.message).toBe("One or more blog posts were not found");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
