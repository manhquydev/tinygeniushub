import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getParentFromServerCookie } from "@/lib/auth/session";

export async function requireParent() {
  const parent = await getParentFromServerCookie();

  if (!parent) {
    const requestHeaders = await headers();
    const nextPath = requestHeaders.get("x-next-pathname") ?? "";
    const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/session-expired${nextQuery}`);
  }

  return parent;
}
