"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ParentNotificationCenter = dynamic(
  () => import("./parent-notification-center").then((module) => module.ParentNotificationCenter),
  { ssr: false },
);

const ParentalGateModal = dynamic(
  () => import("./parental-gate-modal").then((module) => module.ParentalGateModal),
  { ssr: false },
);

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
  onNavigate?: () => void;
  className?: string;
}

function NavTextLink({ item, pathname, onIntercept, onNavigate, className }: NavTextLinkProps) {
  const active = isPathActive(pathname, item.href, item.matchMode ?? "prefix");
  const resolvedClassName = ["nav-link-item", active ? "nav-link-item-active" : "nav-link-item-inactive", item.hideOnMobile ? "nav-hide-mobile" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={item.href}
      className={resolvedClassName}
      onClick={(event) => {
        onIntercept(event, item.href);
        onNavigate?.();
      }}
    >
      {active ? (
        <span className="nav-active-indicator" />
      ) : null}
      <span className="relative z-[1]">{item.label}</span>
    </Link>
  );
}

export function AppNavClient({ hasParent, isAdmin }: AppNavClientProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const [gateOpen, setGateOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const pendingFormRef = useRef<HTMLFormElement | null>(null);

  const isKidUI = pathname.startsWith("/kid");

  const parentLinks: NavItemConfig[] = [
    { href: "/pricing", label: "Bảng giá", hideOnMobile: true, matchMode: "prefix" },
    { href: "/about", label: "Giới thiệu", hideOnMobile: true, matchMode: "prefix" },
    { href: "/blog", label: "Blog", hideOnMobile: true, matchMode: "prefix" },
    { href: "/parent/dashboard", label: "Dashboard", matchMode: "prefix" },
    { href: "/parent/children", label: "Hồ sơ bé", matchMode: "prefix" },
    { href: "/parent/reports", label: "Báo cáo", matchMode: "prefix" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", matchMode: "prefix" as const }] : []),
  ];

  const guestLinks: NavItemConfig[] = [
    { href: "/pricing", label: "Bảng giá", hideOnMobile: true, matchMode: "prefix" },
    { href: "/about", label: "Giới thiệu", hideOnMobile: true, matchMode: "prefix" },
    { href: "/blog", label: "Blog", hideOnMobile: true, matchMode: "prefix" },
  ];
  const currentLinks = hasParent ? parentLinks : guestLinks;
  const mobileLinks = currentLinks.map((item) => ({ ...item, hideOnMobile: false }));

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

          <button
            type="button"
            className="nav-mobile-toggle"
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-nav-mobile"
            aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            <span>{mobileMenuOpen ? "Đóng menu" : "Mở menu"}</span>
          </button>

          <nav className="nav-links nav-links-desktop">
            {currentLinks.map((item) => (
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

        {mobileMenuOpen ? (
          <div id="primary-nav-mobile" className="container nav-mobile-panel">
            {mobileLinks.map((item) => (
              <NavTextLink
                key={`${item.href}-mobile`}
                item={item}
                pathname={pathname}
                onIntercept={handleInterceptNavigation}
                onNavigate={() => setMobileMenuOpen(false)}
                className="nav-mobile-link"
              />
            ))}

            {hasParent ? (
              <div className="nav-mobile-actions">
                <div className="relative z-[90] shrink-0">
                  <ParentNotificationCenter />
                </div>
                <form
                  action="/api/auth/logout"
                  method="post"
                  onSubmit={(event) => {
                    handleInterceptLogout(event);
                    setMobileMenuOpen(false);
                  }}
                >
                  <button type="submit" className="ghost-button nav-mobile-button">
                    Đăng xuất
                  </button>
                </form>
              </div>
            ) : (
              <div className="nav-mobile-actions">
                <NavTextLink
                  item={{ href: "/auth/login", label: "Đăng nhập", matchMode: "prefix" }}
                  pathname={pathname}
                  onIntercept={handleInterceptNavigation}
                  onNavigate={() => setMobileMenuOpen(false)}
                  className="nav-mobile-link"
                />
                <Link
                  href="/auth/signup"
                  className="solid-button nav-mobile-button"
                  onClick={(event) => {
                    handleInterceptNavigation(event, "/auth/signup");
                    setMobileMenuOpen(false);
                  }}
                >
                  Bắt đầu trial 7 ngày
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </header>

      {gateOpen && <ParentalGateModal onSuccess={handleGateSuccess} onCancel={handleGateCancel} />}
    </>
  );
}
