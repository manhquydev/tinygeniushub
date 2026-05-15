// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppNavClient } from "@/components/app-nav-client";
import { trackEvent } from "@/lib/analytics/track-event";

const pushMock = vi.fn();
const refreshMock = vi.fn();

let pathnameValue = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameValue,
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("next/image", () => ({
  default: ({ priority: _priority, ...props }: Record<string, unknown> & { priority?: boolean }) => (
    <img {...props} alt={String(props.alt ?? "")} />
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return function DynamicComponentMock() {
      return null;
    };
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    [key: string]: unknown;
  }) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

describe("AppNavClient", () => {
  beforeEach(() => {
    pathnameValue = "/";
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("renders guest funnel-first links and tracks top-nav clicks", () => {
    render(<AppNavClient hasParent={false} isAdmin={false} guestCtaVariant="A" />);

    expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How it works" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pricing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "For schools" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByText("Get started for free")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Courses" }));
    expect(trackEvent).toHaveBeenCalledWith("nav_click", {
      state: "guest",
      location: "desktop_top",
      label: "Courses",
      href: "/courses",
    });
  });

  it("does not render user nav on admin routes", () => {
    pathnameValue = "/admin/operations";

    const { container } = render(<AppNavClient hasParent={true} isAdmin={true} guestCtaVariant="A" />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("link", { name: "Courses" })).not.toBeInTheDocument();
  });

  it("renders variant B CTA and tracks click label correctly", () => {
    render(<AppNavClient hasParent={false} isAdmin={false} guestCtaVariant="B" />);

    const cta = screen.getByRole("link", { name: /View courses/i });
    fireEvent.click(cta);

    expect(trackEvent).toHaveBeenCalledWith("nav_click", {
      state: "guest",
      location: "desktop_top",
      label: "View courses",
      href: "/auth/signup",
    });
  });

  it("shows parent activation links and support menu only on demand", () => {
    render(<AppNavClient hasParent={true} isAdmin={false} guestCtaVariant="A" />);

    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Children" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Support" }));

    expect(screen.getByRole("menuitem", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Contact" })).toBeInTheDocument();
  });

  it("tracks logout click for parent nav", () => {
    render(<AppNavClient hasParent={true} isAdmin={false} guestCtaVariant="A" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(trackEvent).toHaveBeenCalledWith("nav_click", {
      state: "parent",
      location: "desktop_top",
      label: "Sign out",
      href: "/auth/logout",
    });
  });
});
