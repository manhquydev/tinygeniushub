import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type OpenGraphProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: OpenGraphProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      titleVi: true,
      author: {
        select: {
          displayName: true,
        },
      },
    },
  });

  const title = post?.titleVi ?? "Blog TinyGenius Hub";
  const author = post?.author.displayName ?? "TinyGenius Hub";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #115e59 50%, #0ea5e9 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 18px",
            borderRadius: "999px",
            fontSize: 24,
            fontWeight: 700,
            background: "rgba(255, 255, 255, 0.16)",
          }}
        >
          Blog TinyGenius Hub
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 30, opacity: 0.9 }}>Tác giả: {author}</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

