import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertTrustedOriginMock,
  getRequestIpMock,
  buildRateLimitIdentityMock,
  enforceRateLimitMock,
  getReaderFromRequestMock,
  findPostBySlugMock,
  getBlogLikeIdentityHashMock,
  registerPostLikeMock,
  randomUUIDMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  buildRateLimitIdentityMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  getReaderFromRequestMock: vi.fn(),
  findPostBySlugMock: vi.fn(),
  getBlogLikeIdentityHashMock: vi.fn(),
  registerPostLikeMock: vi.fn(),
  randomUUIDMock: vi.fn(),
}));

vi.mock("node:crypto", () => ({
  randomUUID: randomUUIDMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  getRequestIp: getRequestIpMock,
  buildRateLimitIdentity: buildRateLimitIdentityMock,
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/lib/auth/reader", () => ({
  getReaderFromRequest: getReaderFromRequestMock,
}));

vi.mock("@/modules/blog/blog-repository", () => ({
  BLOG_LIKE_SESSION_COOKIE_NAME: "ccth_blog_like_session",
  findPostBySlug: findPostBySlugMock,
  getBlogLikeIdentityHash: getBlogLikeIdentityHashMock,
  registerPostLike: registerPostLikeMock,
}));

import { POST } from "@/app/api/blog/posts/[slug]/like/route";

describe("blog like route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertTrustedOriginMock.mockImplementation(() => {});
    getRequestIpMock.mockReturnValue("203.0.113.8");
    buildRateLimitIdentityMock.mockImplementation((value: string) => `hash:${value}`);
    enforceRateLimitMock.mockResolvedValue({ allowed: true, remaining: 9 });
    getReaderFromRequestMock.mockResolvedValue(null);
    findPostBySlugMock.mockResolvedValue({ id: "post-1" });
    getBlogLikeIdentityHashMock.mockReturnValue("identity-1");
    registerPostLikeMock.mockResolvedValue({ likeCount: 3, created: true });
    randomUUIDMock.mockReturnValue("generated-session-token");
  });

  it("returns 429 when rate limit exceeded", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      retryAfterMs: 12_000,
    });

    const response = await POST(
      new Request("http://localhost/api/blog/posts/post-1/like", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }),
      {
        params: Promise.resolve({ slug: "post-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toContain("Too many likes");
    expect(response.headers.get("Retry-After")).toBe("12");
    expect(findPostBySlugMock).not.toHaveBeenCalled();
  });

  it("returns 404 when blog post not found", async () => {
    findPostBySlugMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/blog/posts/missing/like", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }),
      {
        params: Promise.resolve({ slug: "missing" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("creates like for anonymous request and sets like-session cookie", async () => {
    const response = await POST(
      new Request("http://localhost/api/blog/posts/post-1/like", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }),
      {
        params: Promise.resolve({ slug: "post-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      likeCount: 3,
      liked: true,
      alreadyLiked: false,
    });
    expect(getBlogLikeIdentityHashMock).toHaveBeenCalledWith({
      readerId: undefined,
      sessionToken: "generated-session-token",
    });
    expect(registerPostLikeMock).toHaveBeenCalledWith("post-1", "identity-1");
    expect(response.headers.get("set-cookie")).toContain("ccth_blog_like_session=generated-session-token");
  });

  it("uses existing session token and does not reset cookie", async () => {
    registerPostLikeMock.mockResolvedValueOnce({ likeCount: 7, created: false });

    const response = await POST(
      new Request("http://localhost/api/blog/posts/post-1/like", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          cookie: "ccth_blog_like_session=existing-session",
        },
      }),
      {
        params: Promise.resolve({ slug: "post-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      likeCount: 7,
      liked: false,
      alreadyLiked: true,
    });
    expect(getBlogLikeIdentityHashMock).toHaveBeenCalledWith({
      readerId: undefined,
      sessionToken: "existing-session",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
