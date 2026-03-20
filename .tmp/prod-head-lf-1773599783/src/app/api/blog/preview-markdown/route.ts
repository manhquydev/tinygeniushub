import { NextRequest, NextResponse } from "next/server";
import { renderMarkdown } from "@/modules/blog/blog-markdown";

export async function POST(request: NextRequest) {
  const { markdown } = (await request.json()) as { markdown?: unknown };

  if (typeof markdown !== "string") {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  if (markdown.length > 50_000) {
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  }

  const html = await renderMarkdown(markdown);
  return NextResponse.json({ html });
}
