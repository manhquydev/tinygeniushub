// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("motion/react-m", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react-m")>();
  return actual;
});

vi.mock("@/lib/audio-utils", () => ({
  synth: {
    playPop: playPopMock,
    playTing: playTingMock,
    playYay: playYayMock,
  },
}));

describe("KidMissionPanel", () => {
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
                title: "To mau chu cai",
                objective: "Luyen tap nhan dien chu cai",
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
      <KidMissionPanel
        childrenProfiles={[
          { id: "child-1", nickname: "Be Na" },
          { id: "child-2", nickname: "Be Bin" },
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
      />,
    );

    expect(screen.getByText("Learn letter A")).toBeInTheDocument();
    expect(screen.getByText("Identify the letter A")).toBeInTheDocument();
    expect(screen.getByText(/10\s*ph.u?t/i)).toBeInTheDocument();
    expect(screen.getByText("Be Na")).toBeInTheDocument();
  });

  it("starts lesson when start button is clicked", async () => {
    const { KidMissionPanel } = await import("@/components/kid-mission-panel");

    render(
      <KidMissionPanel
        childrenProfiles={[{ id: "child-1", nickname: "Be Na" }]}
        initialChildId="child-1"
        initialLessons={[
          {
            id: "lesson-1",
            title: "Learn letter A",
            objective: "Identify the letter A",
            estimatedMinutes: 10,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /bat dau bai hoc|start lesson/i }));

    await waitFor(() => {
      expect(screen.getByText(/start learning letter a|bat dau hoc chu a/i)).toBeInTheDocument();
    });
  });

  it("calls audio feedback functions", async () => {
    const { KidMissionPanel } = await import("@/components/kid-mission-panel");

    render(
      <KidMissionPanel
        childrenProfiles={[
          { id: "child-1", nickname: "Be Na" },
          { id: "child-2", nickname: "Be Bin" },
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
      />,
    );

    const mascotButton = screen.getByRole("button", { name: /mascot guide/i });
    fireEvent.click(mascotButton);
    expect(playYayMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Be Na" }));
    const childBinEntry = await screen.findByText("Be Bin");
    const childBinWrapper = childBinEntry.closest("div");
    const childBinButton = childBinWrapper?.querySelector("button");
    expect(childBinButton).not.toBeNull();

    if (!childBinButton) {
      throw new Error("Expected child switch button for Be Bin");
    }

    fireEvent.click(childBinButton);
    expect(playPopMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
