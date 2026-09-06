import { EntitlementStatus, OfferingKind } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";
import { PLATFORM_PASS_CODE, PLATFORM_PASS_KEY } from "@/modules/entitlement/offering-types";

type TicketRow = {
  id: string;
  parentId: string;
  offeringId: string;
  status: EntitlementStatus;
  validFrom: Date;
  validUntil: Date | null;
};

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    $transaction: vi.fn(),
    parentAccount: { findUnique: vi.fn() },
    offering: { findUnique: vi.fn() },
    entitlement: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lesson: { findUnique: vi.fn() },
    adminActionLog: { create: vi.fn() },
  };
  return { prismaMock };
});

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { canAccess } from "@/modules/entitlement/entitlement-service";
import {
  listAdminHouseholdTickets,
  updateAdminParentTicket,
} from "@/modules/admin/admin-ticket-service";

const parentId = "parent-1";
const lessonId = "lesson-1";
const offering = {
  id: "offering-pass",
  code: PLATFORM_PASS_CODE,
  catalogKey: PLATFORM_PASS_KEY,
  kind: OfferingKind.RECURRING,
};
const adminEmail = "admin@example.com";

function lessonRow() {
  return {
    unit: {
      level: {
        id: "level-real",
        track: { code: "ENGLISH" },
      },
    },
    courseItems: [{ courseId: "course-abc" }],
  };
}

describe("admin-ticket-service", () => {
  let tickets: TicketRow[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    tickets = [];

    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
      callback(prismaMock),
    );
    prismaMock.parentAccount.findUnique.mockResolvedValue({ id: parentId });
    prismaMock.offering.findUnique.mockImplementation(async ({ where }: { where: { code: string } }) =>
      where.code === PLATFORM_PASS_CODE ? offering : null,
    );
    prismaMock.lesson.findUnique.mockResolvedValue(lessonRow());
    prismaMock.adminActionLog.create.mockResolvedValue({ id: "log-1" });

    prismaMock.entitlement.findFirst.mockImplementation(
      async ({
        where,
      }: {
        where: { parentId?: string; offeringId?: string; status?: { in: EntitlementStatus[] } };
      }) =>
        tickets.find((ticket) => {
          if (where.parentId && ticket.parentId !== where.parentId) return false;
          if (where.offeringId && ticket.offeringId !== where.offeringId) return false;
          if (where.status?.in && !where.status.in.includes(ticket.status)) return false;
          return true;
        }) ?? null,
    );

    prismaMock.entitlement.findMany.mockImplementation(
      async ({
        where,
      }: {
        where: { parentId?: string; status?: { in: EntitlementStatus[] } };
      }) =>
        tickets
          .filter((ticket) => {
            if (where.parentId && ticket.parentId !== where.parentId) return false;
            if (where.status?.in && !where.status.in.includes(ticket.status)) return false;
            return true;
          })
          .map((ticket) => ({
            ...ticket,
            offering,
          })),
    );

    prismaMock.entitlement.create.mockImplementation(async ({ data }: { data: Omit<TicketRow, "id"> }) => {
      const row = { id: `ent-${tickets.length + 1}`, ...data };
      tickets.push(row);
      return row;
    });

    prismaMock.entitlement.update.mockImplementation(
      async ({ where, data }: { where: { id: string }; data: Partial<TicketRow> }) => {
        const row = tickets.find((ticket) => ticket.id === where.id);
        if (!row) {
          throw new Error("ticket missing");
        }
        Object.assign(row, data);
        return row;
      },
    );
  });

  it("lists empty entitlements", async () => {
    await expect(listAdminHouseholdTickets(parentId)).resolves.toEqual([]);
  });

  it("grants platform-pass", async () => {
    const ticket = await updateAdminParentTicket({
      parentId,
      offeringCode: PLATFORM_PASS_CODE,
      action: "grant",
      adminEmail,
    });

    expect(ticket).toMatchObject({
      parentId,
      offeringId: offering.id,
      status: EntitlementStatus.ACTIVE,
    });
    expect(prismaMock.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId,
        offeringId: offering.id,
        status: EntitlementStatus.ACTIVE,
      }),
    });
    await expect(listAdminHouseholdTickets(parentId)).resolves.toEqual([
      expect.objectContaining({
        offeringCode: PLATFORM_PASS_CODE,
        catalogKey: PLATFORM_PASS_KEY,
        kind: OfferingKind.RECURRING,
        status: EntitlementStatus.ACTIVE,
      }),
    ]);
  });

  it("expires platform-pass so canAccess is false when no other live ticket", async () => {
    await updateAdminParentTicket({
      parentId,
      offeringCode: PLATFORM_PASS_CODE,
      action: "grant",
      adminEmail,
    });
    await expect(canAccess({ parentId, lessonId })).resolves.toBe(true);

    await updateAdminParentTicket({
      parentId,
      offeringCode: PLATFORM_PASS_CODE,
      action: "expire",
      adminEmail,
    });

    await expect(canAccess({ parentId, lessonId })).resolves.toBe(false);
  });

  it("rejects unknown offeringCode with 400", async () => {
    await expect(
      updateAdminParentTicket({
        parentId,
        offeringCode: "not-a-real-offering",
        action: "grant",
        adminEmail,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "UNKNOWN_OFFERING_CODE",
    } satisfies Partial<DomainError>);
    expect(prismaMock.entitlement.create).not.toHaveBeenCalled();
  });
});
