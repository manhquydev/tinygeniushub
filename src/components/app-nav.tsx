import { AppNavClient } from "./app-nav-client";
import { isAdminEmail } from "@/lib/auth/admin";
import { getParentFromServerCookie } from "@/lib/auth/session";

export async function AppNav() {
  const parent = await getParentFromServerCookie();
  const isAdmin = parent ? isAdminEmail(parent.email) : false;

  return <AppNavClient hasParent={!!parent} isAdmin={isAdmin} />;
}
