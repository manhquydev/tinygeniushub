// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/site-footer";
import { trackEvent } from "@/lib/analytics/track-event";

let pathnameValue = "/";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <span data-testid="next-image" data-alt={String(props.alt ?? "")} />
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

    fireEvent.click(screen.getByRole("link", { name: "Price list" }));

    expect(trackEvent).toHaveBeenCalledWith("nav_click", {
      state: "parent",
      location: "footer",
      label: "Price list",
      href: "/pricing",
    });
  });

  it("does not track external social links", () => {
    render(<SiteFooter hasParent={false} />);

    fireEvent.click(screen.getByLabelText(/facebook/i));

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("renders dynamic social links from props", () => {
    render(
      <SiteFooter
        hasParent={false}
        socialLinks={{
          facebook: "https://facebook.com/new-page",
          youtube: "https://youtube.com/@new-channel",
        }}
      />,
    );

    expect(screen.getByLabelText(/facebook/i)).toHaveAttribute("href", "https://facebook.com/new-page");
    expect(screen.getByLabelText(/youtube/i)).toHaveAttribute("href", "https://youtube.com/@new-channel");
  });

  it("does not render on admin routes", () => {
    pathnameValue = "/admin/overview";

    const { container } = render(<SiteFooter hasParent={false} />);

    expect(container.firstChild).toBeNull();
  });
});
