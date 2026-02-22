import { fail } from "@/lib/http";

export async function POST() {
  return fail("Not found", 404);
}
