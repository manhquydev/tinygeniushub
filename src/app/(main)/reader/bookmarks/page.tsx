import Image from "next/image";
import Link from "next/link";
import { requireReaderFromServerCookie } from "@/lib/auth/reader";
import { listBookmarks } from "@/modules/reader/reader-service";

export default async function ReaderBookmarksPage() {
  const reader = await requireReaderFromServerCookie();
  const bookmarks = await listBookmarks(reader.id, 1, 100);

  return (
    <div className="page-stack space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">
          Article saved
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You have saved {bookmarks.total} posts.
        </p>
      </section>

      {bookmarks.items.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No saved articles yet. Visit the Blog page and click "Save article".
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.items.map((item: typeof bookmarks.items[number]) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-video bg-slate-100">
                {item.post.coverImageUrl ? (
                  <Image
                    src={item.post.coverImageUrl}
                    alt={item.post.titleVi}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs font-semibold text-teal-700">
                  {item.post.category.nameVi}
                </p>
                <h2 className="text-base font-bold text-slate-900">{item.post.titleVi}</h2>
                <p className="line-clamp-3 text-sm text-slate-600">{item.post.excerptVi}</p>
                <Link
                  href={`/blog/${item.post.slug}`}
                  className="inline-flex text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                >
                  Read article →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
