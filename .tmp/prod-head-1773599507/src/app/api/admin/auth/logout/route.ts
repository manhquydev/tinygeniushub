import { cookies } from "next/headers";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";

const COOKIE_NAME = "ccth_admin_session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return ok({ message: "Signed out" });
  } catch (error) {
    return handleRouteError(error);
  }
}
