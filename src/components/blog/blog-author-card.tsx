import Image from "next/image";
import Link from "next/link";
import type { BlogAuthorSummary } from "@/modules/blog/blog-types";

type BlogAuthorCardProps = {
  author: BlogAuthorSummary;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

export function BlogAuthorCard({ author }: BlogAuthorCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
        Author
      </h3>
      <div className="flex items-start gap-4">
        {author.avatarUrl ? (
          <Image
            src={author.avatarUrl}
            alt={author.displayName}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
            sizes="56px"
          />
        ) : (
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
            {initials(author.displayName)}
          </span>
        )}

        <div className="min-w-0 space-y-1">
          <p className="text-lg font-bold text-slate-900">{author.displayName}</p>
          <p className="text-sm font-medium text-slate-600">{author.role}</p>
          {author.bio ? <p className="text-sm leading-relaxed text-slate-600">{author.bio}</p> : null}
          {author.linkedinUrl ? (
            <Link
              href={author.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Xem LinkedIn
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
