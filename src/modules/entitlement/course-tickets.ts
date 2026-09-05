import { prisma } from "@/lib/db";
import { courseCatalogKey } from "@/modules/entitlement/catalog-key";
import { LIVE_ENTITLEMENT_STATUSES } from "@/modules/entitlement/offering-types";

const LIVE_STATUSES = [...LIVE_ENTITLEMENT_STATUSES];

export type LiveCourseTicket = {
  courseId: string;
  validFrom: Date;
};

function isCurrentlyValid(ticket: { validFrom: Date; validUntil: Date | null }, now: Date) {
  if (ticket.validFrom > now) {
    return false;
  }
  return ticket.validUntil == null || ticket.validUntil > now;
}

export async function listLiveCourseTickets(parentId: string): Promise<LiveCourseTicket[]> {
  const now = new Date();
  const tickets = await prisma.entitlement.findMany({
    where: { parentId, status: { in: LIVE_STATUSES } },
    select: {
      validFrom: true,
      validUntil: true,
      offering: { select: { catalogKey: true } },
    },
    orderBy: { validFrom: "asc" },
  });

  const seen = new Set<string>();
  const live: LiveCourseTicket[] = [];
  for (const ticket of tickets) {
    if (!isCurrentlyValid(ticket, now)) {
      continue;
    }
    const catalogKey = ticket.offering.catalogKey;
    if (catalogKey.includes(":level:")) {
      continue;
    }
    const prefix = "course:";
    if (!catalogKey.startsWith(prefix)) {
      continue;
    }
    const courseId = catalogKey.slice(prefix.length);
    if (!courseId || courseId.includes(":")) {
      continue;
    }
    if (courseCatalogKey(courseId) !== catalogKey) {
      continue;
    }
    if (seen.has(courseId)) {
      continue;
    }
    seen.add(courseId);
    live.push({ courseId, validFrom: ticket.validFrom });
  }

  return live;
}

export async function listLiveCourseIds(parentId: string): Promise<string[]> {
  const tickets = await listLiveCourseTickets(parentId);
  return tickets.map((ticket) => ticket.courseId);
}
