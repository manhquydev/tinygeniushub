export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("vi-VN");
}

export function normalizeStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "NO_SUBSCRIPTION";
  }
  return status;
}

export function getSubscriptionBadgeClass(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE_STANDARD":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "TRIALING":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "GRACE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "ACTIVE_FAMILYPLUS":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "CANCELED_AT_PERIOD_END":
    case "CANCELED":
    case "EXPIRED":
    case "REFUNDED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function toCurrency(amountVnd: number) {
  return amountVnd.toLocaleString("vi-VN");
}
