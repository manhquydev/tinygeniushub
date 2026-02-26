import { adminAuth } from "@/lib/auth/admin-auth";
import { appendSetCookieHeaders, normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { DomainError } from "@/modules/platform/errors";
import type { NextRequest } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const body = loginSchema.parse(await request.json());

    const signIn = await adminAuth.api.signInEmail({
      headers: request.headers,
      body: {
        email: body.email,
        password: body.password,
        rememberMe: false,
      },
      returnHeaders: true,
      returnStatus: true,
    });

    const user = (signIn.response as { user?: { id?: string } } | null)?.user;
    if (!user?.id) {
      return fail("Invalid credentials", 401);
    }

    const response = ok({ user: { id: user.id } });
    appendSetCookieHeaders(response, signIn.headers);
    return response;
  } catch (error) {
    const normalized = normalizeBetterAuthError(error);
    if (normalized instanceof DomainError && normalized.status === 401) {
      return fail("Invalid credentials", 401);
    }
    return handleRouteError(normalized);
  }
}
