import { OfferingKind } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    offering: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import {
  listAdminOfferings,
  updateAdminOfferingActive,
} from "@/modules/admin/admin-offering-service";

const offering = {
  id: "off-1",
  code: "course-course-1",
  kind: OfferingKind.ONE_TIME_PROGRAM,
  catalogKey: "course:course-1",
  active: true,
  stripePriceId: null,
};

describe("admin-offering-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists existing offerings and does not seed", async () => {
    prismaMock.offering.findMany.mockResolvedValueOnce([]);

    await expect(listAdminOfferings()).resolves.toEqual([]);
    expect(prismaMock.offering.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        code: true,
        kind: true,
        catalogKey: true,
        active: true,
        stripePriceId: true,
      },
      orderBy: { code: "asc" },
    });
    expect(prismaMock.offering.create).not.toHaveBeenCalled();
    expect(prismaMock.offering.upsert).not.toHaveBeenCalled();
  });

  it("patches active on an existing offering", async () => {
    prismaMock.offering.findUnique.mockResolvedValueOnce({ id: offering.id });
    prismaMock.offering.update.mockResolvedValueOnce({ ...offering, active: false });

    await expect(
      updateAdminOfferingActive({ id: offering.id, active: false }),
    ).resolves.toMatchObject({
      id: offering.id,
      code: offering.code,
      kind: offering.kind,
      catalogKey: offering.catalogKey,
      active: false,
      stripePriceId: null,
    });
  });

  it("throws when the offering id is missing", async () => {
    prismaMock.offering.findUnique.mockResolvedValueOnce(null);

    await expect(
      updateAdminOfferingActive({ id: "missing", active: true }),
    ).rejects.toMatchObject({
      status: 404,
      code: "OFFERING_NOT_FOUND",
    } satisfies Partial<DomainError>);
    expect(prismaMock.offering.update).not.toHaveBeenCalled();
  });
});
