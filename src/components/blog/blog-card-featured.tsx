import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import type { BlogPostCardDTO } from "@/modules/blog/blog-types";

function formatDate(value: Date | null) {
  if (!value) {
    return "Chua xu?t b?n";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export function BlogCardFeatured({ post }: { post: BlogPostCardDTO }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <Link href={`/blog/${post.slug}`} className="group relative block">
        <div className="relative aspect-video overflow-hidden bg-slate-200">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.titleVi}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white sm:p-7">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: post.category.color ?? "#0f766e" }}
            >
              {post.category.emoji ?? "??"} {post.category.nameVi}
            </span>

            <h2 className="text-2xl font-black leading-tight tracking-[-0.02em] sm:text-3xl">{post.titleVi}</h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-100">
              <span>{post.author.displayName}</span>
              <span>·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>·</span>
              <span>{post.readingTimeMin} phút d?c</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-100">
              <span className="inline-flex items-center gap-1">
                <Eye size={16} /> {post.viewCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart size={16} /> {post.likeCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

