import { AppNavClient } from "./app-nav-client";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/auth/admin";
import { getParentFromServerCookie } from "@/lib/auth/session";

export async function AppNav() {
  const [parent, cookieStore] = await Promise.all([getParentFromServerCookie(), cookies()]);
  const isAdmin = parent ? isAdminEmail(parent.email) : false;
  const guestCtaVariant = cookieStore.get("ab_pricing_v")?.value === "B" ? "B" : "A";

  return <AppNavClient hasParent={!!parent} isAdmin={isAdmin} guestCtaVariant={guestCtaVariant} />;
}
