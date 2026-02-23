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

  return <main className={isHomepage || isAuthRoute ? "main-shell" : "container main-shell"}>{children}</main>;
}
