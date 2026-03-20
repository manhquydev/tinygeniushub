import { z } from "zod";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { newsletterService } from "@/modules/blog/newsletter-service";

const payloadSchema = z.object({
  email: z.string().email(),
  nameVi: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await newsletterService.subscribe(parsed.data.email, {
      nameVi: parsed.data.nameVi,
    });

    return NextResponse.json({ message: "Please check your email to confirm subscription" });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.newsletter.subscribe",
    });
  }
}

