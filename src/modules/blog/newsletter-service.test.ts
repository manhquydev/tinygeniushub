import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, enqueueVerifyBlogNewsletterEmailMock } = vi.hoisted(() => ({
  prismaMock: {
    blogNewsletterSubscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  enqueueVerifyBlogNewsletterEmailMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/worker/queue", () => ({
  enqueueVerifyBlogNewsletterEmail: enqueueVerifyBlogNewsletterEmailMock,
}));

import { newsletterService } from "@/modules/blog/newsletter-service";

describe("newsletterService.subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates subscriber and enqueues verify email for first-time subscribe", async () => {
    prismaMock.blogNewsletterSubscriber.findUnique.mockResolvedValueOnce(null);
    prismaMock.blogNewsletterSubscriber.create.mockResolvedValueOnce({
      id: "sub-1",
      email: "parent@example.com",
      nameVi: "Phụ huynh",
    });

    const result = await newsletterService.subscribe("Parent@example.com", {
      nameVi: "Phụ huynh",
    });

    expect(result.token).toMatch(/^[a-z0-9]+$/i);
    expect(prismaMock.blogNewsletterSubscriber.create).toHaveBeenCalledTimes(1);
    expect(enqueueVerifyBlogNewsletterEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriberId: "sub-1",
        email: "parent@example.com",
        nameVi: "Phụ huynh",
      }),
    );
  });

  it("handles concurrent duplicate subscribe without throwing 500", async () => {
    prismaMock.blogNewsletterSubscriber.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "sub-2",
        email: "parent@example.com",
        nameVi: "Parent",
        verified: false,
        unsubscribedAt: null,
        verifyToken: "existing-token",
      });
    prismaMock.blogNewsletterSubscriber.create.mockRejectedValueOnce({
      code: "P2002",
    });
    prismaMock.blogNewsletterSubscriber.update.mockResolvedValueOnce({
      id: "sub-2",
    });

    const result = await newsletterService.subscribe("parent@example.com");

    expect(result).toEqual({ token: "existing-token" });
    expect(prismaMock.blogNewsletterSubscriber.create).toHaveBeenCalledTimes(1);
    expect(enqueueVerifyBlogNewsletterEmailMock).toHaveBeenCalledWith({
      subscriberId: "sub-2",
      email: "parent@example.com",
      nameVi: "Parent",
      verifyToken: "existing-token",
    });
  });

  it("does not enqueue verification for active verified subscriber", async () => {
    prismaMock.blogNewsletterSubscriber.findUnique.mockResolvedValueOnce({
      id: "sub-3",
      email: "parent@example.com",
      nameVi: "Parent",
      verified: true,
      unsubscribedAt: null,
      verifyToken: null,
    });
    prismaMock.blogNewsletterSubscriber.update.mockResolvedValueOnce({
      id: "sub-3",
    });

    const result = await newsletterService.subscribe("parent@example.com", {
      nameVi: "New Name",
    });

    expect(result).toEqual({ token: "" });
    expect(enqueueVerifyBlogNewsletterEmailMock).not.toHaveBeenCalled();
  });
});
