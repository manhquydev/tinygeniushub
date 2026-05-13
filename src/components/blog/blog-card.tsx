import Image from "next/image";
import Link from "next/link";
import type { BlogPostCardDTO } from "@/modules/blog/blog-types";

function formatDate(value: Date | null) {
  if (!value) {
    return "Unpublished";
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

function normalizeCategoryColor(value: string | null | undefined) {
  const fallback = "#0f766e";
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

function toHex6(color: string) {
  if (color.length === 4) {
    const [hash, r, g, b] = color;
    return `${hash}${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return color.toLowerCase();
}

function getCategoryBadgeStyle(color: string | null | undefined) {
  const backgroundColor = normalizeCategoryColor(color);
  const hex = toHex6(backgroundColor).slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;

  return {
    backgroundColor,
    color: luminance >= 140 ? "#0f172a" : "#ffffff",
  };
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
              No photos available
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>

        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
              style={getCategoryBadgeStyle(post.category.color)}
            >
              {post.category.nameVi}
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
            <span>{post.readingTimeMin} min read</span>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{post.viewCount} views</span>
            <span>·</span>
            <span>{post.likeCount} likes</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
