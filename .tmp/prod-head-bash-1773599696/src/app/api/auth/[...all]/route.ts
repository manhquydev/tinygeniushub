import { fail } from "@/lib/http";

function notFound() {
  return fail("Not found", 404);
}

export async function GET() {
  return notFound();
}

export async function POST() {
  return notFound();
}

export async function PATCH() {
  return notFound();
}

export async function PUT() {
  return notFound();
}

export async function DELETE() {
  return notFound();
}
