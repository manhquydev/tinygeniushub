// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "@/components/language-switcher";

const refreshMock = vi.fn();
const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: pushMock,
    replace: replaceMock,
  }),
}));

const labels = {
  ariaLabel: "Choose display language",
  english: "English",
  vietnamese: "Vietnamese",
};

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    document.cookie = "tgh_locale=; Max-Age=0; path=/";
    vi.clearAllMocks();
  });

  it("marks the active locale without refreshing", () => {
    render(<LanguageSwitcher currentLocale="en" labels={labels} />);

    const english = screen.getByRole("button", { name: "English" });
    fireEvent.click(english);

    expect(english).toHaveAttribute("aria-pressed", "true");
    expect(refreshMock).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain("tgh_locale=");
  });

  it("persists the selected locale and refreshes server-rendered copy", () => {
    render(<LanguageSwitcher currentLocale="en" labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: "Vietnamese" }));

    expect(document.cookie).toContain("tgh_locale=vi");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it.each(["/courses?topic=math", "/auth/login?next=%2Fcourses"])("keeps current URL when switching locale on %s", (url) => {
    const target = new URL(url, "http://localhost");
    window.history.replaceState({}, "", target.pathname + target.search);

    render(<LanguageSwitcher currentLocale="en" labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: "Vietnamese" }));

    expect(window.location.pathname).toBe(target.pathname);
    expect(window.location.search).toBe(target.search);
    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
