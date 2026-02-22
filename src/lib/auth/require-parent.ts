import { redirect } from "next/navigation";
import { getParentFromServerCookie } from "@/lib/auth/session";

export async function requireParent() {
  const parent = await getParentFromServerCookie();

  if (!parent) {
    redirect("/auth/login");
  }

  return parent;
}
