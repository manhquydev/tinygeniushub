import { z } from "zod";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";

const offeringSelect = {
  id: true,
  code: true,
  kind: true,
  catalogKey: true,
  active: true,
  stripePriceId: true,
} as const;

export const updateAdminOfferingActiveSchema = z.object({
  active: z.boolean(),
});

export async function listAdminOfferings() {
  return prisma.offering.findMany({
    select: offeringSelect,
    orderBy: { code: "asc" },
  });
}

export async function updateAdminOfferingActive(input: { id: string; active: boolean }) {
  const existing = await prisma.offering.findUnique({
    where: { id: input.id },
    select: { id: true },
  });
  if (!existing) {
    throw new DomainError("Offering not found", 404, "OFFERING_NOT_FOUND");
  }

  return prisma.offering.update({
    where: { id: input.id },
    data: { active: input.active },
    select: offeringSelect,
  });
}
