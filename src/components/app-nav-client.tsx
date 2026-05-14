"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { defaultLocale, type AppLocale } from "@/i18n/locales";
import { trackEvent } from "@/lib/analytics/track-event";
import { LanguageSwitcher } from "@/components/language-switcher";

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
  guestCtaVariant: "A" | "B";
  currentLocale?: AppLocale;
  copy?: AppNavCopy;
}

type NavMatchMode = "exact" | "prefix";

type NavItemConfig = {
  href: string;
  label: string;
  hideOnMobile?: boolean;
  matchMode?: NavMatchMode;
};

type NavTrackingLocation = "desktop_top" | "mobile_panel";

export type AppNavCopy = {
  language: {
    ariaLabel: string;
    english: string;
    vietnamese: string;
  };
  guest: {
    courses: string;
    pricing: string;
    howItWorks: string;
    forSchools: string;
    login: string;
    ctaDefaultFull: string;
    ctaDefaultShort: string;
    ctaCourseFull: string;
    ctaCourseShort: string;
  };
  parent: {
    overview: string;
    childProfiles: string;
    courses: string;
    reports: string;
    billing: string;
    admin: string;
    help: string;
    blog: string;
    about: string;
    contact: string;
    logout: string;
    loggingOut: string;
  };
  mobile: {
    openMenu: string;
    closeMenu: string;
    openMenuText: string;
    closeMenuText: string;
  };
};

export const defaultAppNavCopy: AppNavCopy = {
  language: {
    ariaLabel: "Choose display language",
    english: "English",
    vietnamese: "Vietnamese",
  },
  guest: {
    courses: "Courses",
    pricing: "Pricing",
    howItWorks: "How it works",
    forSchools: "For schools",
    login: "Log in",
    ctaDefaultFull: "Get started for free",
    ctaDefaultShort: "Start",
    ctaCourseFull: "View courses",
    ctaCourseShort: "Courses",
  },
  parent: {
    overview: "Overview",
    childProfiles: "Children",
    courses: "Courses",
    reports: "Reports",
    billing: "Billing",
    admin: "Admin",
    help: "Support",
    blog: "Blog",
    about: "About",
    contact: "Contact",
    logout: "Sign out",
    loggingOut: "Signing out...",
  },
  mobile: {
    openMenu: "Open the navigation menu",
    closeMenu: "Close navigation menu",
    openMenuText: "Open the menu",
    closeMenuText: "Close the menu",
  },
};

function isPathActive(pathname: string, href: string, mode: NavMatchMode = "prefix") {
  if (href === "/") {
    return pathname === "/";
  }

  if (href.startsWith("/#")) {
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
  onTrack?: (item: NavItemConfig) => void;
  onNavigate?: () => void;
  className?: string;
}

function NavTextLink({ item, pathname, onIntercept, onTrack, onNavigate, className }: NavTextLinkProps) {
  const active = isPathActive(pathname, item.href, item.matchMode ?? "prefix");
  const resolvedClassName = ["nav-link-item", active ? "nav-link-item-active" : "nav-link-item-inactive", item.hideOnMobile ? "nav-hide-mobile" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={item.href}
      className={resolvedClassName}
      onClick={(event) => {
        onTrack?.(item);
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

export function AppNavClient({
  hasParent,
  isAdmin,
  guestCtaVariant,
  currentLocale = defaultLocale,
  copy = defaultAppNavCopy,
}: AppNavClientProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isAdminRoute = pathname.startsWith("/admin");

  const [gateOpen, setGateOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);

  const isKidUI = pathname.startsWith("/kid");

  const parentLinks: NavItemConfig[] = [
    { href: "/parent/dashboard", label: copy.parent.overview, matchMode: "prefix" },
    { href: "/parent/children", label: copy.parent.childProfiles, matchMode: "prefix" },
    { href: "/parent/courses", label: copy.parent.courses, matchMode: "prefix" },
    { href: "/parent/reports", label: copy.parent.reports, matchMode: "prefix" },
    { href: "/parent/billing", label: copy.parent.billing, matchMode: "prefix" },
    ...(isAdmin ? [{ href: "/admin", label: copy.parent.admin, matchMode: "prefix" as const }] : []),
  ];

  const guestLinks: NavItemConfig[] = [
    { href: "/courses", label: copy.guest.courses, matchMode: "prefix" },
    { href: "/pricing", label: copy.guest.pricing, matchMode: "prefix" },
    { href: "/#features", label: copy.guest.howItWorks, matchMode: "exact" },
    { href: "/for-schools", label: copy.guest.forSchools, hideOnMobile: true, matchMode: "prefix" },
  ];
  const parentSupportLinks: NavItemConfig[] = [
    { href: "/blog", label: copy.parent.blog, matchMode: "prefix" },
    { href: "/about", label: copy.parent.about, matchMode: "prefix" },
    { href: "/contact", label: copy.parent.contact, matchMode: "prefix" },
  ];
  const currentLinks = hasParent ? parentLinks : guestLinks;
  const mobileLinks = currentLinks.map((item) => ({ ...item, hideOnMobile: false }));
  const guestCtaLabelFull = guestCtaVariant === "B" ? copy.guest.ctaCourseFull : copy.guest.ctaDefaultFull;
  const guestCtaLabelShort = guestCtaVariant === "B" ? copy.guest.ctaCourseShort : copy.guest.ctaDefaultShort;

  const trackNavClick = (item: NavItemConfig, location: NavTrackingLocation) => {
    trackEvent("nav_click", {
      state: hasParent ? "parent" : "guest",
      location,
      label: item.label,
      href: item.href,
    });
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMobileMenuOpen(false);
    setSupportMenuOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleInterceptNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isKidUI) return;

    if (!href.startsWith("/kid")) {
      event.preventDefault();
      pendingHrefRef.current = href;
      setGateOpen(true);
    }
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/");
    router.refresh();
  };

  const handleInterceptLogout = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isKidUI) {
      handleLogout();
      return;
    }

    event.preventDefault();
    pendingHrefRef.current = null;
    setGateOpen(true);
  };

  const handleGateSuccess = () => {
    setGateOpen(false);
    if (pendingHrefRef.current) {
      router.push(pendingHrefRef.current);
      pendingHrefRef.current = null;
    } else {
      handleLogout();
    }
  };

  const handleGateCancel = () => {
    setGateOpen(false);
    pendingHrefRef.current = null;
  };

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <header className="app-nav">
        <div className="container nav-inner">
          <Link
            href="/"
            className="brand brand-feature-logo"
            aria-label="TinyGenius Hub home page"
            onClick={(event) => handleInterceptNavigation(event, "/")}
          >
            <Image
              src="/logos/tinygeniushub_logo_horizon.png"
              alt="Logo TinyGenius Hub"
              width={1584}
              height={672}
              priority
              className="brand-feature-image"
            />
          </Link>

          <button
            type="button"
            className="nav-mobile-toggle"
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-nav-mobile"
            aria-label={mobileMenuOpen ? copy.mobile.closeMenu : copy.mobile.openMenu}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            <span>{mobileMenuOpen ? copy.mobile.closeMenuText : copy.mobile.openMenuText}</span>
          </button>

          <nav className="nav-links nav-links-desktop">
            {currentLinks.map((item) => (
              <NavTextLink
                key={item.href}
                item={item}
                pathname={pathname}
                onIntercept={handleInterceptNavigation}
                onTrack={(targetItem) => trackNavClick(targetItem, "desktop_top")}
              />
            ))}

            {hasParent ? (
              <>
                <div className="relative z-[90] shrink-0">
                  <ParentNotificationCenter />
                </div>
                <div className="relative nav-hide-mobile">
                  <button
                    type="button"
                    className="ghost-button"
                    aria-haspopup="menu"
                    aria-expanded={supportMenuOpen}
                    aria-controls="parent-support-menu"
                    onClick={() => setSupportMenuOpen((current) => !current)}
                  >
                    {copy.parent.help}
                  </button>
                  {supportMenuOpen ? (
                    <div
                      id="parent-support-menu"
                      role="menu"
                      aria-label={copy.parent.help}
                      className="absolute right-0 top-[calc(100%+0.55rem)] z-[120] grid min-w-[11rem] gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_14px_32px_rgba(15,23,42,0.16)]"
                    >
                      {parentSupportLinks.map((item) => (
                        <Link
                          key={`desktop-support-${item.href}`}
                          href={item.href}
                          role="menuitem"
                          className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                          onClick={(event) => {
                            trackNavClick(item, "desktop_top");
                            handleInterceptNavigation(event, item.href);
                            setSupportMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={(event) => {
                    trackNavClick({ href: "/auth/logout", label: copy.parent.logout }, "desktop_top");
                    handleInterceptLogout(event);
                  }}
                  disabled={loggingOut}
                >
                    {loggingOut ? copy.parent.loggingOut : copy.parent.logout}
                  </button>
              </>
            ) : (
              <>
                <NavTextLink
                  item={{ href: "/auth/login", label: copy.guest.login, hideOnMobile: true, matchMode: "prefix" }}
                  pathname={pathname}
                  onIntercept={handleInterceptNavigation}
                  onTrack={(item) => trackNavClick(item, "desktop_top")}
                />
                <Link
                  href="/auth/signup"
                  className="solid-button"
                  onClick={(event) => {
                    trackEvent("nav_click", {
                      state: "guest",
                      location: "desktop_top",
                      label: guestCtaLabelFull,
                      href: "/auth/signup",
                    });
                    handleInterceptNavigation(event, "/auth/signup");
                  }}
                >
                  <span className="nav-cta-short">{guestCtaLabelShort}</span>
                  <span className="nav-cta-full">{guestCtaLabelFull}</span>
                </Link>
              </>
            )}

            <LanguageSwitcher currentLocale={currentLocale} labels={copy.language} className="nav-desktop-language" />
          </nav>
        </div>

        {mobileMenuOpen ? (
          <div id="primary-nav-mobile" className="container nav-mobile-panel">
            <LanguageSwitcher currentLocale={currentLocale} labels={copy.language} className="nav-mobile-language" />

            {mobileLinks.map((item) => (
              <NavTextLink
                key={`${item.href}-mobile`}
                item={item}
                pathname={pathname}
                onIntercept={handleInterceptNavigation}
                onTrack={(targetItem) => trackNavClick(targetItem, "mobile_panel")}
                onNavigate={() => setMobileMenuOpen(false)}
                className="nav-mobile-link"
              />
            ))}

            {hasParent ? (
              <div className="nav-mobile-actions">
                {parentSupportLinks.map((item) => (
                  <NavTextLink
                    key={`mobile-support-${item.href}`}
                    item={item}
                    pathname={pathname}
                    onIntercept={handleInterceptNavigation}
                    onTrack={(targetItem) => trackNavClick(targetItem, "mobile_panel")}
                    onNavigate={() => setMobileMenuOpen(false)}
                    className="nav-mobile-link"
                  />
                ))}
                <div className="relative z-[90] shrink-0">
                  <ParentNotificationCenter />
                </div>
                <button
                    type="button"
                    className="ghost-button nav-mobile-button"
                    onClick={(event) => {
                      trackNavClick({ href: "/auth/logout", label: copy.parent.logout }, "mobile_panel");
                      handleInterceptLogout(event);
                      setMobileMenuOpen(false);
                    }}
                    disabled={loggingOut}
                  >
                    {loggingOut ? copy.parent.loggingOut : copy.parent.logout}
                  </button>
              </div>
            ) : (
              <div className="nav-mobile-actions">
                <NavTextLink
                  item={{ href: "/auth/login", label: copy.guest.login, matchMode: "prefix" }}
                  pathname={pathname}
                  onIntercept={handleInterceptNavigation}
                  onTrack={(item) => trackNavClick(item, "mobile_panel")}
                  onNavigate={() => setMobileMenuOpen(false)}
                  className="nav-mobile-link"
                />
                <Link
                  href="/auth/signup"
                  className="solid-button nav-mobile-button"
                  onClick={(event) => {
                    trackEvent("nav_click", {
                      state: "guest",
                      location: "mobile_panel",
                      label: guestCtaLabelFull,
                      href: "/auth/signup",
                    });
                    handleInterceptNavigation(event, "/auth/signup");
                    setMobileMenuOpen(false);
                  }}
                >
                  {guestCtaLabelFull}
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

