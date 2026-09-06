import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireParentAndOwnedChildMock, canAccessVideoMock, getAccessibleGradesMock } = vi.hoisted(() => ({
  requireParentAndOwnedChildMock: vi.fn(),
  canAccessVideoMock: vi.fn(),
  getAccessibleGradesMock: vi.fn(),
}));

vi.mock("@/lib/auth/require-parent-child", () => ({
  requireParentAndOwnedChild: requireParentAndOwnedChildMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    childProfile: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/abeka/access", () => ({
  packageAccessControl: {
    canAccessVideo: canAccessVideoMock,
    getAccessibleGrades: getAccessibleGradesMock,
  },
}));

import { GET } from "@/app/api/abeka/videos/check-access/route";

describe("GET /api/abeka/videos/check-access auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated parentId query without cookie", async () => {
    requireParentAndOwnedChildMock.mockResolvedValueOnce({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/abeka/videos/check-access?parentId=spoof-parent&childId=child-1&grade=1",
      ),
    );

    expect(response.status).toBe(401);
    expect(requireParentAndOwnedChildMock).toHaveBeenCalled();
    expect(canAccessVideoMock).not.toHaveBeenCalled();
    expect(getAccessibleGradesMock).not.toHaveBeenCalled();
  });
});
