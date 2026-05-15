"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track-event";
import {
  DEFAULT_FOOTER_SOCIAL_LINKS,
  type FooterSocialLinks,
} from "@/modules/platform/footer-social-links";

export type SiteFooterCopy = {
  brandAriaLabel: string;
  logoAlt: string;
  taglineLine1: string;
  taglineLine2: string;
  socialFacebookAriaLabel: string;
  socialYoutubeAriaLabel: string;
  navAriaLabel: string;
  columns: {
    product: string;
    company: string;
    account: string;
    legal: string;
  };
  links: {
    features: string;
    pricing: string;
    courses: string;
    forSchools: string;
    faq: string;
    about: string;
    blog: string;
    contact: string;
    referral: string;
    giftCode: string;
    waitlist: string;
    login: string;
    signup: string;
    privacy: string;
    terms: string;
    cookiePolicy: string;
    refundPolicy: string;
  };
  bottom: {
    rightsReserved: string;
    security: string;
    clause: string;
    cookie: string;
    refund: string;
  };
};

const defaultSiteFooterCopy: SiteFooterCopy = {
  brandAriaLabel: "TinyGenius Hub home page",
  logoAlt: "TinyGeniusHub Logo",
  taglineLine1: "Math & English for children 2-6 years old.",
  taglineLine2: "15 minutes a day, you can clearly see your child's progress.",
  socialFacebookAriaLabel: "Facebook TinyGenius Hub",
  socialYoutubeAriaLabel: "YouTube TinyGenius Hub",
  navAriaLabel: "Footer navigation",
  columns: {
    product: "Product",
    company: "Company",
    account: "Account",
    legal: "Legal",
  },
  links: {
    features: "Features",
    pricing: "Price list",
    courses: "Course",
    forSchools: "For school",
    faq: "Frequently asked questions",
    about: "Introduce",
    blog: "Blog",
    contact: "Contact",
    referral: "Introducing you",
    giftCode: "Gift code",
    waitlist: "Book early",
    login: "Log in",
    signup: "Register",
    privacy: "Privacy policy",
    terms: "Terms of use",
    cookiePolicy: "Cookie policy",
    refundPolicy: "Refund policy",
  },
  bottom: {
    rightsReserved: "All rights reserved.",
    security: "Security",
    clause: "Clause",
    cookie: "Cookie",
    refund: "Refund",
  },
};

interface SiteFooterProps {
  hasParent?: boolean;
  socialLinks?: FooterSocialLinks;
  copy?: SiteFooterCopy;
}

export function SiteFooter({ hasParent = false, socialLinks, copy }: SiteFooterProps) {
  const pathname = usePathname() ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const currentYear = new Date().getFullYear();
  const resolvedSocialLinks = socialLinks ?? DEFAULT_FOOTER_SOCIAL_LINKS;
  const resolvedCopy = copy ?? defaultSiteFooterCopy;

  if (isAdminRoute) {
    return null;
  }

  const trackFooterNavigation = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/")) return;

    const label = anchor.textContent?.trim() || href;
    trackEvent("nav_click", {
      state: hasParent ? "parent" : "guest",
      location: "footer",
      label,
      href,
    });
  };

  return (
    <footer className="site-footer" onClickCapture={trackFooterNavigation}>
      <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-6 lg:px-4">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="footer-brand-logo" aria-label={resolvedCopy.brandAriaLabel}>
              <Image
                src="/logos/tinygeniushub_logo_stacked.png"
                alt={resolvedCopy.logoAlt}
                width={848}
                height={1264}
                className="footer-logo-image"
              />
            </Link>

            <p className="footer-tagline">
              {resolvedCopy.taglineLine1}
              <br />
              {resolvedCopy.taglineLine2}
            </p>

            <div className="footer-social">
              <a
                href={resolvedSocialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label={resolvedCopy.socialFacebookAriaLabel}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  <path fill="#fff" d="M16.671 15.542l.532-3.469h-3.328V9.823c0-.949.465-1.874 1.956-1.874h1.514V5s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.642H7.078v3.469h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z"/>
                </svg>
              </a>

              <a
                href={resolvedSocialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label={resolvedCopy.socialYoutubeAriaLabel}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                  <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          <nav className="footer-nav-grid" aria-label={resolvedCopy.navAriaLabel}>
            <div className="footer-col">
              <p className="footer-col-title">{resolvedCopy.columns.product}</p>
              <Link href="/#features">{resolvedCopy.links.features}</Link>
              <Link href="/courses">{resolvedCopy.links.courses}</Link>
              <Link href="/#faq">{resolvedCopy.links.faq}</Link>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">{resolvedCopy.columns.company}</p>
              <Link href="/about">{resolvedCopy.links.about}</Link>
              <Link href="/blog">{resolvedCopy.links.blog}</Link>
              <Link href="/contact">{resolvedCopy.links.contact}</Link>
              <Link href="/referral">{resolvedCopy.links.referral}</Link>
              <Link href="/gift-code">{resolvedCopy.links.giftCode}</Link>
              <Link href="/waitlist">{resolvedCopy.links.waitlist}</Link>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">{resolvedCopy.columns.account}</p>
              <Link href="/auth/login">{resolvedCopy.links.login}</Link>
              <Link href="/auth/signup">{resolvedCopy.links.signup}</Link>
              <p className="footer-col-title" style={{ marginTop: "0.75rem" }}>{resolvedCopy.columns.legal}</p>
              <Link href="/privacy">{resolvedCopy.links.privacy}</Link>
              <Link href="/terms">{resolvedCopy.links.terms}</Link>
              <Link href="/cookie-policy">{resolvedCopy.links.cookiePolicy}</Link>
              <Link href="/refund-policy">{resolvedCopy.links.refundPolicy}</Link>
            </div>
          </nav>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-bottom-copy">
            <span className="footer-bottom-flag">🇻🇳</span>
            <span>© {currentYear} TinyGenius Hub. {resolvedCopy.bottom.rightsReserved}</span>
          </p>
          <div className="footer-bottom-links">
            <Link href="/privacy">{resolvedCopy.bottom.security}</Link>
            <Link href="/terms">{resolvedCopy.bottom.clause}</Link>
            <Link href="/cookie-policy">{resolvedCopy.bottom.cookie}</Link>
            <Link href="/refund-policy">{resolvedCopy.bottom.refund}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
