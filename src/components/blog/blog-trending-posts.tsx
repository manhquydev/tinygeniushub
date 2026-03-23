import Link from "next/link";
import type { BlogPostCardDTO } from "@/modules/blog/blog-types";

type BlogTrendingPostsProps = {
  posts: BlogPostCardDTO[];
};

export function BlogTrendingPosts({ posts }: BlogTrendingPostsProps) {
  return (
    <div className="space-y-3">
      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có bài viết thịnh hành.</p>
      ) : (
        <ol className="space-y-3">
          {posts.map((post, index) => (
            <li key={post.id} className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                {index + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/blog/${post.slug}`}
                  className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-teal-700"
                >
                  {post.titleVi}
                </Link>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{post.category.nameVi}</span>
                  <span>·</span>
                  <span>{post.viewCount} lượt xem</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
