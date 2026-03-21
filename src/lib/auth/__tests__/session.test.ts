import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  headersMock,
  getSessionMock,
  parentFindUniqueMock,
  parentFindFirstMock,
  userUpdateManyMock,
  getImpersonatedParentIdFromCookieHeaderMock,
  adminFindFirstMock,
} = vi.hoisted(() => ({
  headersMock: vi.fn(),
  getSessionMock: vi.fn(),
  parentFindUniqueMock: vi.fn(),
  parentFindFirstMock: vi.fn(),
  userUpdateManyMock: vi.fn(),
  getImpersonatedParentIdFromCookieHeaderMock: vi.fn(),
  adminFindFirstMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/lib/auth/better-auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    parentAccount: {
      findUnique: parentFindUniqueMock,
      findFirst: parentFindFirstMock,
    },
    user: {
      updateMany: userUpdateManyMock,
    },
    adminAccount: {
      findFirst: adminFindFirstMock,
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    ADMIN_EMAILS: ["admin@example.com"],
  },
}));

vi.mock("@/lib/auth/impersonation", () => ({
  getImpersonatedParentIdFromCookieHeader: getImpersonatedParentIdFromCookieHeaderMock,
}));

import { getParentFromRequest, getParentFromServerCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";

describe("SESSION_COOKIE_NAME", () => {
  it("uses expected cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("ccth_session");
  });
});

describe("getParentFromRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpdateManyMock.mockResolvedValue({ count: 1 });
    adminFindFirstMock.mockResolvedValue(null);
  });

  it("returns null when no auth session exists", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const result = await getParentFromRequest({
      headers: new Headers(),
    } as never);

    expect(result).toBeNull();
    expect(parentFindUniqueMock).not.toHaveBeenCalled();
    expect(parentFindFirstMock).not.toHaveBeenCalled();
  });

  it("resolves parent by parentId from session", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "auth-user-1",
        email: "parent@example.com",
        parentId: "parent-1",
      },
    });
    parentFindUniqueMock.mockResolvedValueOnce({
      id: "parent-1",
      email: "parent@example.com",
    });

    const result = await getParentFromRequest({
      headers: new Headers({ cookie: "ccth_session=session-1" }),
    } as never);

    expect(result).toEqual({
      id: "parent-1",
      email: "parent@example.com",
    });
    expect(parentFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "parent-1" },
      }),
    );
    expect(userUpdateManyMock).not.toHaveBeenCalled();
  });

  it("falls back to case-insensitive email match and links parentId to auth user", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "auth-user-2",
        email: "Parent@Example.com",
      },
    });
    parentFindFirstMock.mockResolvedValueOnce({
      id: "parent-email",
      email: "parent@example.com",
    });

    const result = await getParentFromRequest({
      headers: new Headers({ cookie: "ccth_session=session-2" }),
    } as never);

    expect(result).toEqual({
      id: "parent-email",
      email: "parent@example.com",
    });
    expect(parentFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: {
            equals: "Parent@Example.com",
            mode: "insensitive",
          },
        },
      }),
    );
    expect(userUpdateManyMock).toHaveBeenCalledWith({
      where: { id: "auth-user-2" },
      data: { parentId: "parent-email" },
    });
  });

  it("updates auth user parentId when session parentId mismatches real parent", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "auth-user-3",
        email: "parent@example.com",
        parentId: "stale-parent-id",
      },
    });
    parentFindUniqueMock.mockResolvedValueOnce({
      id: "parent-current",
      email: "parent@example.com",
    });

    const result = await getParentFromRequest({
      headers: new Headers({ cookie: "ccth_session=session-3" }),
    } as never);

    expect(result).toEqual({
      id: "parent-current",
      email: "parent@example.com",
    });
    expect(userUpdateManyMock).toHaveBeenCalledWith({
      where: { id: "auth-user-3" },
      data: { parentId: "parent-current" },
    });
  });

  it("returns null when session exists but no parent account found", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "auth-user-4",
        email: "missing@example.com",
      },
    });
    parentFindFirstMock.mockResolvedValueOnce(null);

    const result = await getParentFromRequest({
      headers: new Headers({ cookie: "ccth_session=session-4" }),
    } as never);

    expect(result).toBeNull();
    expect(userUpdateManyMock).not.toHaveBeenCalled();
  });

  it("binds impersonation cookie to the current admin email", async () => {
    adminFindFirstMock.mockResolvedValueOnce({ id: "admin-db-1" });
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "auth-admin-1",
        email: "admin@example.com",
        parentId: "admin-parent",
      },
    });
    parentFindUniqueMock
      .mockResolvedValueOnce({
        id: "admin-parent",
        email: "admin@example.com",
      })
      .mockResolvedValueOnce({
        id: "impersonated-parent",
        email: "parent@example.com",
      });
    getImpersonatedParentIdFromCookieHeaderMock.mockReturnValueOnce("impersonated-parent");

    const result = await getParentFromRequest({
      headers: new Headers({ cookie: "ccth_session=session-admin" }),
    } as never);

    expect(getImpersonatedParentIdFromCookieHeaderMock).toHaveBeenCalledWith(
      "ccth_session=session-admin",
      "admin@example.com",
    );
    expect(result).toEqual({
      id: "impersonated-parent",
      email: "parent@example.com",
    });
  });
});

describe("getParentFromServerCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminFindFirstMock.mockResolvedValue(null);
  });

  it("resolves parent using server cookie headers", async () => {
    headersMock.mockResolvedValueOnce(new Headers({ cookie: "ccth_session=server-cookie" }));
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "auth-user-5",
        email: "parent@example.com",
        parentId: "parent-5",
      },
    });
    parentFindUniqueMock.mockResolvedValueOnce({
      id: "parent-5",
      email: "parent@example.com",
    });

    const result = await getParentFromServerCookie();

    expect(result).toEqual({
      id: "parent-5",
      email: "parent@example.com",
    });
    expect(headersMock).toHaveBeenCalledTimes(1);
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });
});
