import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireReaderFromRequestMock,
  assertTrustedOriginMock,
  enforceRateLimitMock,
  listBookmarksMock,
  addBookmarkMock,
} = vi.hoisted(() => ({
  requireReaderFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  listBookmarksMock: vi.fn(),
  addBookmarkMock: vi.fn(),
}));

vi.mock("@/lib/auth/reader", () => ({
  requireReaderFromRequest: requireReaderFromRequestMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/modules/reader/reader-service", () => ({
  listBookmarks: listBookmarksMock,
  addBookmark: addBookmarkMock,
}));

import { GET, POST } from "@/app/api/reader/bookmarks/route";

describe("reader bookmarks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireReaderFromRequestMock.mockResolvedValue({ id: "reader-1" });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceRateLimitMock.mockResolvedValue({ allowed: true, remaining: 29 });
  });

  it("returns bookmarks list for authenticated reader", async () => {
    listBookmarksMock.mockResolvedValue({
      total: 1,
      items: [{ id: "bookmark-1" }],
    });

    const response = await GET(
      new Request("http://localhost/api/reader/bookmarks?page=1&limit=20") as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.total).toBe(1);
    expect(listBookmarksMock).toHaveBeenCalledWith("reader-1", 1, 20);
  });

  it("creates bookmark for authenticated reader", async () => {
    addBookmarkMock.mockResolvedValue({ id: "bookmark-2" });

    const response = await POST(
      new Request("http://localhost/api/reader/bookmarks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ postId: "post-1" }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(addBookmarkMock).toHaveBeenCalledWith("reader-1", "post-1");
  });
});
