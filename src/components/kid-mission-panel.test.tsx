// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../locales/en/translation.json";

const playPopMock = vi.fn();
const playTingMock = vi.fn();
const playYayMock = vi.fn();
const pushMock = vi.fn();
const replaceMock = vi.fn();
const prefetchMock = vi.fn();
const backMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    prefetch: prefetchMock,
    back: backMock,
  }),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
  LazyMotion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  MotionConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  domAnimation: {},
}));

const motionOnlyProps = new Set([
  "animate",
  "exit",
  "initial",
  "layout",
  "onHoverStart",
  "onTapStart",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
]);

function createMotionElement(tag: keyof React.JSX.IntrinsicElements) {
  function MotionElement({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
    const domProps = Object.fromEntries(Object.entries(props).filter(([key]) => !motionOnlyProps.has(key)));
    return React.createElement(tag, domProps, children);
  }

  MotionElement.displayName = `MockMotion.${tag}`;
  return MotionElement;
}

vi.mock("motion/react-m", () => {
  return {
    button: createMotionElement("button"),
    div: createMotionElement("div"),
    header: createMotionElement("header"),
    section: createMotionElement("section"),
  };
});

vi.mock("@/lib/audio-utils", () => ({
  synth: {
    playPop: playPopMock,
    playTing: playTingMock,
    playYay: playYayMock,
  },
}));

describe("KidMissionPanel", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            lessons: [
              {
                id: "lesson-2",
                title: "Color the alphabet",
                objective: "Practice letter recognition",
                estimatedMinutes: 12,
              },
            ],
          },
        }),
      }),
    );
  });

  it("renders lesson information", async () => {
    const { KidMissionPanel } = await import("@/components/kid-mission-panel");

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}><KidMissionPanel
        childrenProfiles={[
          { id: "child-1", nickname: "Nina" },
          { id: "child-2", nickname: "Ben" },
        ]}
        initialChildId="child-1"
        initialLessons={[
          {
            id: "lesson-1",
            title: "Learn letter A",
            objective: "Identify the letter A",
            estimatedMinutes: 10,
          },
        ]}
      />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Learn letter A")).toBeInTheDocument();
    expect(screen.getByText("Identify the letter A")).toBeInTheDocument();
    expect(screen.getByText(/10\s*minutes/i)).toBeInTheDocument();
    expect(screen.getByText("Nina")).toBeInTheDocument();
  });

  it("starts lesson when start button is clicked", async () => {
    const { KidMissionPanel } = await import("@/components/kid-mission-panel");

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}><KidMissionPanel
        childrenProfiles={[{ id: "child-1", nickname: "Nina" }]}
        initialChildId="child-1"
        initialLessons={[
          {
            id: "lesson-1",
            title: "Learn letter A",
            objective: "Identify the letter A",
            estimatedMinutes: 10,
          },
        ]}
      />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /start the lesson/i }));

    await waitFor(() => {
      expect(screen.getByText(/starting learn letter a/i)).toBeInTheDocument();
    });
  });

  it("calls audio feedback functions", async () => {
    const { KidMissionPanel } = await import("@/components/kid-mission-panel");

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}><KidMissionPanel
        childrenProfiles={[
          { id: "child-1", nickname: "Nina" },
          { id: "child-2", nickname: "Ben" },
        ]}
        initialChildId="child-1"
        initialLessons={[
          {
            id: "lesson-1",
            title: "Learn letter A",
            objective: "Identify the letter A",
            estimatedMinutes: 10,
          },
        ]}
      />
      </NextIntlClientProvider>,
    );

    const mascotButton = screen.getByRole("button", { name: /guide mascot/i });
    fireEvent.click(mascotButton);
    expect(playYayMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Nina" }));
    const childBinEntry = await screen.findByText("Ben");
    const childBinWrapper = childBinEntry.closest("div");
    const childBinButton = childBinWrapper?.querySelector("button");
    expect(childBinButton).not.toBeNull();

    if (!childBinButton) {
      throw new Error("Expected child switch button for Ben");
    }

    fireEvent.click(childBinButton);
    expect(playPopMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
