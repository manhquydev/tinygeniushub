// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/site-footer";
import { trackEvent } from "@/lib/analytics/track-event";

let pathnameValue = "/";

vi.mock("next/image", () => ({
  default: ({ priority, ...props }: Record<string, unknown> & { priority?: boolean }) => (
    <img {...props} alt={String(props.alt ?? "")} />
  ),
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

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameValue,
}));

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

describe("SiteFooter", () => {
  beforeEach(() => {
    pathnameValue = "/";
    vi.clearAllMocks();
  });

  it("tracks internal footer links with parent state", () => {
    render(<SiteFooter hasParent={true} />);

    fireEvent.click(screen.getByRole("link", { name: "Bảng giá" }));

    expect(trackEvent).toHaveBeenCalledWith("nav_click", {
      state: "parent",
      location: "footer",
      label: "Bảng giá",
      href: "/pricing",
    });
  });

  it("does not track external social links", () => {
    render(<SiteFooter hasParent={false} />);

    fireEvent.click(screen.getByLabelText("Facebook Cùng Con Tự Học"));

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("does not render on admin routes", () => {
    pathnameValue = "/admin/overview";

    const { container } = render(<SiteFooter hasParent={false} />);

    expect(container.firstChild).toBeNull();
  });
});
