import { getCourseBundleByCourseSlug } from "@/modules/courses/course-bundles";

export function resolveCourseCoverImage(courseSlug: string, coverImageUrl?: string | null): string | null {
  if (coverImageUrl && coverImageUrl.trim().length > 0) {
    return coverImageUrl;
  }

  const bundle = getCourseBundleByCourseSlug(courseSlug);
  if (!bundle) {
    return null;
  }

  return bundle.coverImageUrl;
}
