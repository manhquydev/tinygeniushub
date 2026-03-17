import { listCourseBundles } from "@/modules/courses/course-bundles";

const explicitLegacyRouteSlugs = ["abeka", "little-fox-en", "little-fox-cn"];
const entryCourseSlugs = listCourseBundles().map((bundle) => bundle.entryCourseSlug);

const legacyBundleRouteSlugSet = new Set([...explicitLegacyRouteSlugs, ...entryCourseSlugs]);

export function isLegacyBundleRouteSlug(slug: string) {
  return legacyBundleRouteSlugSet.has(slug);
}
