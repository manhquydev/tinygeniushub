import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { MascotSupportHub } from "@/components/mascot-support-hub";
import { MainShell } from "@/components/main-shell";
import { ReaderTopBar } from "@/components/layout/reader-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { SystemAnnouncementBanner } from "@/components/system-announcement-banner";
import { getReaderFromServerCookie } from "@/lib/auth/reader";
import { getAuthenticatedParentFromServerCookie, getParentFromServerCookie } from "@/lib/auth/session";
import { getFooterSocialLinks } from "@/modules/platform/site-content-settings-service";

export default async function MainRouteLayout({ children }: { children: ReactNode }) {
  const [displayParent, authenticatedParent, reader, footerSocialLinks] = await Promise.all([
    getParentFromServerCookie(),
    getAuthenticatedParentFromServerCookie(),
    getReaderFromServerCookie(),
    getFooterSocialLinks(),
  ]);
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
      <SiteFooter hasParent={!!displayParent} socialLinks={footerSocialLinks} />
    </>
  );
}

