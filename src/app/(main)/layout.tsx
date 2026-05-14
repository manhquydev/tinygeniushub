import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { AppNav } from "@/components/app-nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { MascotSupportHub } from "@/components/mascot-support-hub";
import { MainShell } from "@/components/main-shell";
import { ReaderTopBar } from "@/components/layout/reader-top-bar";
import { SiteFooter, type SiteFooterCopy } from "@/components/site-footer";
import { SystemAnnouncementBanner } from "@/components/system-announcement-banner";
import { resolveAppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";
import { getReaderFromServerCookie } from "@/lib/auth/reader";
import { getAuthenticatedParentFromServerCookie, getParentFromServerCookie } from "@/lib/auth/session";
import { getFooterSocialLinks } from "@/modules/platform/site-content-settings-service";

function buildSiteFooterCopy(locale: ReturnType<typeof resolveAppLocale>): SiteFooterCopy {
  return {
    brandAriaLabel: translate("footer.brandAriaLabel", undefined, locale),
    logoAlt: translate("footer.logoAlt", undefined, locale),
    taglineLine1: translate("footer.taglineLine1", undefined, locale),
    taglineLine2: translate("footer.taglineLine2", undefined, locale),
    socialFacebookAriaLabel: translate("footer.socialFacebookAriaLabel", undefined, locale),
    socialYoutubeAriaLabel: translate("footer.socialYoutubeAriaLabel", undefined, locale),
    navAriaLabel: translate("footer.navAriaLabel", undefined, locale),
    columns: {
      product: translate("footer.columns.product", undefined, locale),
      company: translate("footer.columns.company", undefined, locale),
      account: translate("footer.columns.account", undefined, locale),
      legal: translate("footer.columns.legal", undefined, locale),
    },
    links: {
      features: translate("footer.links.features", undefined, locale),
      pricing: translate("footer.links.pricing", undefined, locale),
      courses: translate("footer.links.courses", undefined, locale),
      forSchools: translate("footer.links.forSchools", undefined, locale),
      faq: translate("footer.links.faq", undefined, locale),
      about: translate("footer.links.about", undefined, locale),
      blog: translate("footer.links.blog", undefined, locale),
      contact: translate("footer.links.contact", undefined, locale),
      referral: translate("footer.links.referral", undefined, locale),
      giftCode: translate("footer.links.giftCode", undefined, locale),
      waitlist: translate("footer.links.waitlist", undefined, locale),
      login: translate("footer.links.login", undefined, locale),
      signup: translate("footer.links.signup", undefined, locale),
      privacy: translate("footer.links.privacy", undefined, locale),
      terms: translate("footer.links.terms", undefined, locale),
      cookiePolicy: translate("footer.links.cookiePolicy", undefined, locale),
      refundPolicy: translate("footer.links.refundPolicy", undefined, locale),
    },
    bottom: {
      rightsReserved: translate("footer.bottom.rightsReserved", undefined, locale),
      security: translate("footer.bottom.security", undefined, locale),
      clause: translate("footer.bottom.clause", undefined, locale),
      cookie: translate("footer.bottom.cookie", undefined, locale),
      refund: translate("footer.bottom.refund", undefined, locale),
    },
  };
}

export default async function MainRouteLayout({ children }: { children: ReactNode }) {
  const [displayParent, authenticatedParent, reader, footerSocialLinks, rawLocale] = await Promise.all([
    getParentFromServerCookie(),
    getAuthenticatedParentFromServerCookie(),
    getReaderFromServerCookie(),
    getFooterSocialLinks(),
    getLocale(),
  ]);
  const locale = resolveAppLocale(rawLocale);
  const isImpersonating =
    !!displayParent &&
    !!authenticatedParent &&
    displayParent.id !== authenticatedParent.id;

  return (
    <>
      <SystemAnnouncementBanner />
      {isImpersonating ? <ImpersonationBanner parentEmail={displayParent.email} /> : null}
      {isImpersonating ? <div className="h-11" aria-hidden /> : null}
      <AppNav />
      {!displayParent && reader ? <ReaderTopBar displayName={reader.displayName} /> : null}
      <MainShell>{children}</MainShell>
      <MascotSupportHub />
      <SiteFooter hasParent={!!displayParent} socialLinks={footerSocialLinks} copy={buildSiteFooterCopy(locale)} />
    </>
  );
}

