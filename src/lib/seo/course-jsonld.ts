const BASE_URL = "https://cungcontuhoc.io.vn";

/** Safely serialize JSON-LD for dangerouslySetInnerHTML — escapes <, >, & to prevent XSS */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

const PROVIDER = {
  "@type": "Organization",
  name: "Cùng Con Tự Học",
  url: BASE_URL,
};

type CourseJsonLdInput = {
  slug: string;
  title: string;
  description: string;
  priceVnd: number;
  durationDays: number;
  reviewAverageRating: number | null;
  reviewCount: number;
};

export function buildCourseJsonLd(course: CourseJsonLdInput) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: `${BASE_URL}/courses/${course.slug}`,
    provider: PROVIDER,
    offers: {
      "@type": "Offer",
      price: course.priceVnd,
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/courses/${course.slug}`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `P${Math.ceil(course.durationDays / 7)}W`,
    },
    inLanguage: "vi",
  };

  if (course.reviewCount > 0 && course.reviewAverageRating !== null) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: course.reviewAverageRating.toFixed(1),
      reviewCount: course.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
}

export function buildCourseListJsonLd(courses: Array<{ slug: string; title: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Khóa học - Cùng Con Tự Học",
    url: `${BASE_URL}/courses`,
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/courses/${course.slug}`,
      name: course.title,
    })),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
