import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  listPostVersionsMock,
  saveCurrentPostVersionMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  listPostVersionsMock: vi.fn(),
  saveCurrentPostVersionMock: vi.fn(),
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

vi.mock("@/modules/blog/blog-service", () => ({
  blogService: {
    listPostVersions: listPostVersionsMock,
    saveCurrentPostVersion: saveCurrentPostVersionMock,
  },
}));

import { GET, POST } from "@/app/api/admin/blog/posts/[id]/versions/route";

describe("admin blog post versions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
  });

  it("returns post versions for an authorized admin", async () => {
    listPostVersionsMock.mockResolvedValue([
      {
        id: "version-1",
        titleVi: "Version 1",
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/admin/blog/posts/post-1/versions?limit=10") as never,
      {
        params: Promise.resolve({ id: "post-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      versions: [
        {
          id: "version-1",
          titleVi: "Version 1",
        },
      ],
    });
    expect(listPostVersionsMock).toHaveBeenCalledWith("post-1", 10);
  });

  it("saves a manual version for the current post", async () => {
    saveCurrentPostVersionMock.mockResolvedValue({
      id: "version-2",
      postId: "post-1",
    });

    const response = await POST(
      new Request("http://localhost/api/admin/blog/posts/post-1/versions", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
      {
        params: Promise.resolve({ id: "post-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      version: {
        id: "version-2",
        postId: "post-1",
      },
    });
    expect(assertTrustedOriginMock).toHaveBeenCalledTimes(1);
    expect(enforceAdminMutationRateLimitMock).toHaveBeenCalledTimes(1);
    expect(saveCurrentPostVersionMock).toHaveBeenCalledWith("post-1", "admin@example.com");
  });
});
