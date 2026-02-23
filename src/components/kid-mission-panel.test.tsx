// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const playPopMock = vi.fn();
const playTingMock = vi.fn();
const playYayMock = vi.fn();

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
  LazyMotion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  MotionConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  domAnimation: {},
}));

vi.mock("motion/react-m", () => {
  const motionOnlyProps = new Set([
    "variants",
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "layout",
  ]);

  const createMotionTag = (tagName: string) => {
    const MotionTag = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...props }, ref) => {
      const domProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !motionOnlyProps.has(key)),
      );
      return React.createElement(tagName, { ...domProps, ref }, children);
    });
    MotionTag.displayName = `MotionTag(${tagName})`;
    return MotionTag;
  };

  return {
    section: createMotionTag("section"),
    div: createMotionTag("div"),
    button: createMotionTag("button"),
    article: createMotionTag("article"),
    span: createMotionTag("span"),
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
            title: "Học chữ A",
            objective: "Nhận diện chữ A",
            estimatedMinutes: 10,
          },
        ]}
      />,
    );

    expect(screen.getByText("Học chữ A")).toBeInTheDocument();
    expect(screen.getByText("Nhận diện chữ A")).toBeInTheDocument();
    expect(screen.getByText("10 phút")).toBeInTheDocument();
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
            title: "Học chữ A",
            objective: "Nhận diện chữ A",
            estimatedMinutes: 10,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu bài học" }));

    await waitFor(() => {
      expect(screen.getByText("Bắt đầu Học chữ A nha!")).toBeInTheDocument();
    });
    expect(playTingMock).toHaveBeenCalledTimes(1);
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
            title: "Học chữ A",
            objective: "Nhận diện chữ A",
            estimatedMinutes: 10,
          },
        ]}
      />,
    );

    const mascotButton = screen.getByRole("button", { name: /há»— trá»£ tráº» em/i });
    fireEvent.click(mascotButton);
    expect(playYayMock).toHaveBeenCalledTimes(1);

    const childBinEntry = screen.getByText("Be Bin").closest("div");
    const childBinButton = childBinEntry?.querySelector("button");
    expect(childBinButton).not.toBeNull();

    if (!childBinButton) {
      throw new Error("Expected child switch button for Be Bin");
    }

    fireEvent.click(childBinButton);
    expect(playPopMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
