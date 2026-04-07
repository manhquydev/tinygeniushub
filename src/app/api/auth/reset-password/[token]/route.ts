import { env } from "@/lib/env";

function sanitizeToken(rawToken: string) {
  return rawToken.replace(/\u00ad/g, "").replace(/%C2%AD/gi, "").trim();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const safeToken = sanitizeToken(token);
  const redirectUrl = new URL("/auth/reset-password", env.BETTER_AUTH_URL);

  if (safeToken.length > 0) {
    redirectUrl.searchParams.set("token", safeToken);
  }

  const callbackUrl = new URL(request.url).searchParams.get("callbackURL");
  if (callbackUrl && callbackUrl.trim().length > 0) {
    redirectUrl.searchParams.set("callbackURL", callbackUrl.trim());
  }

  return Response.redirect(redirectUrl.toString(), 302);
}
