import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { MascotSupportHub } from "@/components/mascot-support-hub";
import { MainShell } from "@/components/main-shell";
import { SiteFooter } from "@/components/site-footer";
import { SystemAnnouncementBanner } from "@/components/system-announcement-banner";
import { getAuthenticatedParentFromServerCookie, getParentFromServerCookie } from "@/lib/auth/session";

export default async function MainRouteLayout({ children }: { children: ReactNode }) {
  const [displayParent, authenticatedParent] = await Promise.all([
    getParentFromServerCookie(),
    getAuthenticatedParentFromServerCookie(),
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
      <MainShell>{children}</MainShell>
      <MascotSupportHub />
      <SiteFooter />
    </>
  );
}

