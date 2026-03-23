import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, Heart } from "lucide-react";
import type { BlogPostCardDTO } from "@/modules/blog/blog-types";

function formatDate(value: Date | null) {
  if (!value) {
    return "Chưa xuất bản";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

export function BlogCard({ post }: { post: BlogPostCardDTO }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.titleVi}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
              Không có ảnh
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>

        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: post.category.color ?? "#0f766e" }}
            >
              {post.category.emoji ?? "??"} {post.category.nameVi}
            </span>
            {post.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 2).map((tag) => (
                  <span key={tag.slug} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    #{tag.nameVi}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <h2 className="line-clamp-2 break-words text-lg font-bold text-slate-900">{post.titleVi}</h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{post.excerptVi}</p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.displayName}
                width={24}
                height={24}
                className="rounded-full object-cover"
                sizes="24px"
              />
            ) : (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                {initials(post.author.displayName)}
              </span>
            )}
            <span>{post.author.displayName}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={14} />
              {post.readingTimeMin} phút đọc
            </span>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Eye size={14} />
              {post.viewCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={14} />
              {post.likeCount}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
