import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import type { NextRequest } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255),
});

const SESSION_DURATION_S = 60 * 60 * 8; // 8 hours
const COOKIE_NAME = "ccth_admin_session";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const body = loginSchema.parse(await request.json());

    const admin = await prisma.adminAccount.findUnique({
      where: { email: body.email },
      select: { id: true, email: true, displayName: true, role: true, isActive: true, passwordHash: true },
    });

    if (!admin || !admin.isActive) {
      return fail("Invalid credentials", 401);
    }

    const valid = await compare(body.password, admin.passwordHash);
    if (!valid) {
      return fail("Invalid credentials", 401);
    }

    // Update last login
    await prisma.adminAccount.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Create JWT session token
    const secret = new TextEncoder().encode(env.BETTER_AUTH_SECRET + "_admin");
    const token = await new SignJWT({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      displayName: admin.displayName,
      isActive: admin.isActive,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION_S}s`)
      .sign(secret);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_S,
    });

    return ok({
      user: { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
