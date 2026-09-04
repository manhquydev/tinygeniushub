import { addDays, addMonths, addYears } from "date-fns";

export const ENTITLEMENT_GRACE_DAYS = 3;

export function resolvePeriodEnd(
  planCode: string,
  periodStart: Date,
  stripePeriodEnd?: Date,
) {
  if (stripePeriodEnd) {
    return stripePeriodEnd;
  }

  if (planCode === "MONTHLY_STANDARD") {
    return addMonths(periodStart, 1);
  }

  return addYears(periodStart, 1);
}

export function resolveGraceUntil(now = new Date()) {
  return addDays(now, ENTITLEMENT_GRACE_DAYS);
}
