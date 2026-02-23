import { z } from "zod";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { newsletterService } from "@/modules/blog/newsletter-service";

const payloadSchema = z.object({
  email: z.string().email(),
  nameVi: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    await newsletterService.subscribe(payload.email, {
      nameVi: payload.nameVi,
    });

    return NextResponse.json({ message: "Vui long kiem tra email de xac nhan" });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.newsletter.subscribe",
    });
  }
}

