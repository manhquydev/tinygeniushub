import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { prisma } from "@/lib/db";
import { blogService } from "@/modules/blog/blog-service";

export const revalidate = 1800;

type BlogCategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string | string[] }> | { page?: string | string[] };
};

function resolvePage(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 1;
}

export default async function BlogCategoryPage({ params, searchParams }: BlogCategoryPageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = resolvePage(resolvedSearchParams?.page);

  const category = await prisma.blogCategory.findFirst({
    where: {
      slug,
      active: true,
    },
    select: {
      id: true,
      slug: true,
      nameVi: true,
      description: true,
      emoji: true,
      color: true,
    },
  });

  if (!category) {
    notFound();
  }

  const result = await blogService.listPosts({
    page,
    limit: 12,
    category: category.slug,
  });

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-4xl">{category.emoji ?? "??"}</p>
          <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">{category.nameVi}</h1>
          {category.description ? <p className="max-w-[70ch] text-slate-600">{category.description}</p> : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {result.posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </section>
    </div>
  );
}

