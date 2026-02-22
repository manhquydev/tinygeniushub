import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { MainShell } from "@/components/main-shell";
import { SiteFooter } from "@/components/site-footer";

export default function MainRouteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppNav />
      <MainShell>{children}</MainShell>
      <SiteFooter />
    </>
  );
}

