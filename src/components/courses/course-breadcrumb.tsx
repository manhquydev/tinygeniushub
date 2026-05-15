import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/course-jsonld";

const BASE_URL = "https://www.tinygeniushubvn.tech";

type Props = { courseTitle: string; courseSlug: string };

export function CourseBreadcrumb({ courseTitle, courseSlug }: Props) {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home page", url: BASE_URL },
    { name: "Course", url: `${BASE_URL}/courses` },
    { name: courseTitle, url: `${BASE_URL}/courses/${courseSlug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/courses" className="hover:text-emerald-700 transition-colors">
          Course
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="font-medium text-slate-900 truncate max-w-[280px]">{courseTitle}</span>
      </nav>
    </>
  );
}
