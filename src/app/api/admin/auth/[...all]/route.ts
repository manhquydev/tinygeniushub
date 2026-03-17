import { fail } from "@/lib/http";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

async function notFound(request: Request) {
  await assertRequestAllowedBySecurityControls(request);
  return fail("Not found", 404);
}

export async function GET(request: Request) {
  return notFound(request);
}

export async function POST(request: Request) {
  return notFound(request);
}

export async function PATCH(request: Request) {
  return notFound(request);
}

export async function PUT(request: Request) {
  return notFound(request);
}

export async function DELETE(request: Request) {
  return notFound(request);
}
