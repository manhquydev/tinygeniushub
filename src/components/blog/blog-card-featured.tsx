import Image from "next/image";
import Link from "next/link";
import { getBlogCategoryDisplayName } from "@/modules/blog/blog-category-labels";
import type { BlogPostCardDTO } from "@/modules/blog/blog-types";

function formatDate(value: Date | null) {
  if (!value) {
    return "Unpublished";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
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
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
              style={getCategoryBadgeStyle(post.category.color)}
            >
              {getBlogCategoryDisplayName(post.category)}
            </span>

            <h2 className="break-words text-2xl font-black leading-tight tracking-[-0.02em] sm:text-3xl">{post.titleVi}</h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-100">
              <span>{post.author.displayName}</span>
              <span>·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>·</span>
              <span>{post.readingTimeMin} min read</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-100">
              <span>{post.viewCount} views</span>
              <span>·</span>
              <span>{post.likeCount} likes</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

