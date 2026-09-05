import { resolveAppLocale, type AppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";

type BlogCategoryLabelInput = {
  slug: string;
  nameEn?: string | null;
  nameVi?: string | null;
};

export function getBlogCategoryDisplayName(category: BlogCategoryLabelInput, locale: AppLocale | string): string {
  const appLocale = resolveAppLocale(locale);
  const localizedName = appLocale === "vi" ? category.nameVi?.trim() : category.nameEn?.trim();
  if (localizedName) {
    return localizedName;
  }

  const catalogKey = `blog.chrome.categories.${category.slug}`;
  const fromCatalog = translate(catalogKey, undefined, appLocale);
  if (fromCatalog !== catalogKey) {
    return fromCatalog;
  }

  return titleizeSlug(category.slug);
}

function titleizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
