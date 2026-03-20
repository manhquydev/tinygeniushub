"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface MainShellProps {
  children: ReactNode;
}

export function MainShell({ children }: MainShellProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isAuthRoute = pathname.startsWith("/auth");

  if (isHomepage) {
    return <main className="main-shell main-shell-home">{children}</main>;
  }

  if (isAuthRoute) {
    return <main className="main-shell">{children}</main>;
  }

  return <main className="container main-shell">{children}</main>;
}
