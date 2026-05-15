import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { AppNavClient, type AppNavCopy } from "./app-nav-client";
import { resolveAppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";
import { isAdminEmail } from "@/lib/auth/admin";
import { getParentFromServerCookie } from "@/lib/auth/session";

function buildAppNavCopy(locale: ReturnType<typeof resolveAppLocale>): AppNavCopy {
  return {
    language: {
      ariaLabel: translate("language.ariaLabel", undefined, locale),
      english: translate("language.english", undefined, locale),
      vietnamese: translate("language.vietnamese", undefined, locale),
    },
    guest: {
      courses: translate("navigation.guest.courses", undefined, locale),
      pricing: translate("navigation.guest.pricing", undefined, locale),
      howItWorks: translate("navigation.guest.howItWorks", undefined, locale),
      forSchools: translate("navigation.guest.forSchools", undefined, locale),
      login: translate("navigation.guest.login", undefined, locale),
      ctaDefaultFull: translate("navigation.guest.ctaDefaultFull", undefined, locale),
      ctaDefaultShort: translate("navigation.guest.ctaDefaultShort", undefined, locale),
      ctaCourseFull: translate("navigation.guest.ctaCourseFull", undefined, locale),
      ctaCourseShort: translate("navigation.guest.ctaCourseShort", undefined, locale),
    },
    parent: {
      overview: translate("navigation.parent.overview", undefined, locale),
      childProfiles: translate("navigation.parent.childProfiles", undefined, locale),
      courses: translate("navigation.parent.courses", undefined, locale),
      reports: translate("navigation.parent.reports", undefined, locale),
      billing: translate("navigation.parent.billing", undefined, locale),
      admin: translate("navigation.parent.admin", undefined, locale),
      help: translate("navigation.parent.help", undefined, locale),
      blog: translate("navigation.parent.blog", undefined, locale),
      about: translate("navigation.parent.about", undefined, locale),
      contact: translate("navigation.parent.contact", undefined, locale),
      logout: translate("navigation.parent.logout", undefined, locale),
      loggingOut: translate("navigation.parent.loggingOut", undefined, locale),
    },
    mobile: {
      openMenu: translate("navigation.mobile.openMenu", undefined, locale),
      closeMenu: translate("navigation.mobile.closeMenu", undefined, locale),
      openMenuText: translate("navigation.mobile.openMenuText", undefined, locale),
      closeMenuText: translate("navigation.mobile.closeMenuText", undefined, locale),
    },
  };
}

export async function AppNav() {
  const [parent, cookieStore, rawLocale] = await Promise.all([getParentFromServerCookie(), cookies(), getLocale()]);
  const isAdmin = parent ? isAdminEmail(parent.email) : false;
  const guestCtaVariant = cookieStore.get("ab_pricing_v")?.value === "B" ? "B" : "A";
  const locale = resolveAppLocale(rawLocale);

  return (
    <AppNavClient
      hasParent={!!parent}
      isAdmin={isAdmin}
      guestCtaVariant={guestCtaVariant}
      currentLocale={locale}
      copy={buildAppNavCopy(locale)}
    />
  );
}
