import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminFromRequestMock, prismaMock } = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  prismaMock: {
    $transaction: vi.fn(),
    blogPost: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    blogReadHistory: {
      groupBy: vi.fn(),
    },
    blogCategory: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { GET } from "@/app/api/admin/blog/analytics/route";

function buildRequest() {
  return {
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as Parameters<typeof GET>[0];
}

describe("admin blog analytics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });
  });

  it("reports post/view analytics without querying the newsletter subscriber table", async () => {
    prismaMock.$transaction.mockResolvedValue([
      { _sum: { viewCount: 120 } },
      { _sum: { likeCount: 12 } },
      3,
      [],
      [],
      [],
      [],
    ]);

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(body.totalViews).toBe(120);
    expect(body.totalLikes).toBe(12);
    expect(body.totalPublishedPosts).toBe(3);
    expect(body).not.toHaveProperty("totalSubscribers");
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const queries = prismaMock.$transaction.mock.calls[0][0] as unknown[];
    expect(queries).toHaveLength(7);
  });
});
