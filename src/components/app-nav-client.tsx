"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ParentNotificationCenter } from "./parent-notification-center";
import { ParentalGateModal } from "./parental-gate-modal";

interface AppNavClientProps {
  hasParent: boolean;
  isAdmin: boolean;
}

type NavMatchMode = "exact" | "prefix";

type NavItemConfig = {
  href: string;
  label: string;
  hideOnMobile?: boolean;
  matchMode?: NavMatchMode;
};

function isPathActive(pathname: string, href: string, mode: NavMatchMode = "prefix") {
  if (href === "/") {
    return pathname === "/";
  }

  if (mode === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavTextLinkProps {
  item: NavItemConfig;
  pathname: string;
  onIntercept: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

function NavTextLink({ item, pathname, onIntercept }: NavTextLinkProps) {
  const active = isPathActive(pathname, item.href, item.matchMode ?? "prefix");
  const className = ["nav-link-item", active ? "nav-link-item-active" : "nav-link-item-inactive", item.hideOnMobile ? "nav-hide-mobile" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={item.href} className={className} onClick={(event) => onIntercept(event, item.href)}>
      {active ? (
        <motion.div
          layoutId="nav-active-indicator"
          className="nav-active-indicator"
          transition={{ type: "spring", stiffness: 560, damping: 38, mass: 0.6 }}
        />
      ) : null}
      <span className="relative z-[1]">{item.label}</span>
    </Link>
  );
}

export function AppNavClient({ hasParent, isAdmin }: AppNavClientProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const [gateOpen, setGateOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const pendingFormRef = useRef<HTMLFormElement | null>(null);

  const isKidUI = pathname.startsWith("/kid");

  const parentLinks: NavItemConfig[] = [
    { href: "/pricing", label: "Bảng giá", hideOnMobile: true, matchMode: "prefix" },
    { href: "/blog", label: "Blog", hideOnMobile: true, matchMode: "prefix" },
    { href: "/parent/dashboard", label: "Dashboard", matchMode: "prefix" },
    { href: "/parent/children", label: "Hồ sơ bé", matchMode: "prefix" },
    { href: "/parent/reports", label: "Báo cáo", matchMode: "prefix" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", matchMode: "prefix" as const }] : []),
  ];

  const guestLinks: NavItemConfig[] = [
    { href: "/pricing", label: "Bảng giá", hideOnMobile: true, matchMode: "prefix" },
    { href: "/blog", label: "Blog", hideOnMobile: true, matchMode: "prefix" },
  ];

  const handleInterceptNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isKidUI) return;

    if (!href.startsWith("/kid")) {
      event.preventDefault();
      pendingHrefRef.current = href;
      pendingFormRef.current = null;
      setGateOpen(true);
    }
  };

  const handleInterceptLogout = (event: React.FormEvent<HTMLFormElement>) => {
    if (!isKidUI) return;

    event.preventDefault();
    pendingHrefRef.current = null;
    pendingFormRef.current = event.currentTarget;
    setGateOpen(true);
  };

  const handleGateSuccess = () => {
    setGateOpen(false);
    if (pendingHrefRef.current) {
      router.push(pendingHrefRef.current);
      pendingHrefRef.current = null;
    } else if (pendingFormRef.current) {
      pendingFormRef.current.submit();
      pendingFormRef.current = null;
    }
  };

  const handleGateCancel = () => {
    setGateOpen(false);
    pendingHrefRef.current = null;
    pendingFormRef.current = null;
  };

  return (
    <>
      <header className="app-nav">
        <div className="container nav-inner">
          <Link href="/" className="brand" aria-label="Trang chủ Cùng Con Tự Học" onClick={(event) => handleInterceptNavigation(event, "/")}>
            <Image src="/logo-cungcontuhoc-horizontal.svg" alt="Cùng Con Tự Học Logo" width={180} height={50} priority />
          </Link>

          <nav className="nav-links">
            {(hasParent ? parentLinks : guestLinks).map((item) => (
              <NavTextLink key={item.href} item={item} pathname={pathname} onIntercept={handleInterceptNavigation} />
            ))}

            {hasParent ? (
              <>
                <div className="relative z-[90] shrink-0">
                  <ParentNotificationCenter />
                </div>
                <form action="/api/auth/logout" method="post" onSubmit={handleInterceptLogout}>
                  <button type="submit" className="ghost-button">
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <>
                <NavTextLink
                  item={{ href: "/auth/login", label: "Đăng nhập", hideOnMobile: true, matchMode: "prefix" }}
                  pathname={pathname}
                  onIntercept={handleInterceptNavigation}
                />
                <Link href="/auth/signup" className="solid-button" onClick={(event) => handleInterceptNavigation(event, "/auth/signup")}>
                  <span className="nav-cta-short">Dùng thử</span>
                  <span className="nav-cta-full">Bắt đầu trial 7 ngày</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {gateOpen && <ParentalGateModal onSuccess={handleGateSuccess} onCancel={handleGateCancel} />}
    </>
  );
}
