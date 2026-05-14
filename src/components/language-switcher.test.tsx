// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "@/components/language-switcher";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const labels = {
  ariaLabel: "Choose display language",
  english: "English",
  vietnamese: "Vietnamese",
};

describe("LanguageSwitcher", () => {
  beforeEach(() => {
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
});
