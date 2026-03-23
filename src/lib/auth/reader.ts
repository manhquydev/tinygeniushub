import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DomainError } from "@/modules/platform/errors";
import {
  READER_SESSION_COOKIE_NAME,
  getReaderBySessionToken,
  getReaderSessionTokenFromCookieHeader,
} from "@/modules/reader/reader-auth-service";

export async function getReaderFromRequest(request: Request) {
  const token = getReaderSessionTokenFromCookieHeader(request.headers.get("cookie"));
  return getReaderBySessionToken(token);
}

export async function requireReaderFromRequest(request: Request) {
  const reader = await getReaderFromRequest(request);
  if (!reader) {
    throw new DomainError("Unauthorized", 401, "UNAUTHORIZED");
  }
  return reader;
}

export async function getReaderFromServerCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(READER_SESSION_COOKIE_NAME)?.value ?? null;
  return getReaderBySessionToken(token);
}

export async function requireReaderFromServerCookie() {
  const reader = await getReaderFromServerCookie();
  if (!reader) {
    redirect("/reader/login");
  }
  return reader;
}
