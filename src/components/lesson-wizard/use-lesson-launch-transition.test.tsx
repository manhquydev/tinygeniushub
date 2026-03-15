// @vitest-environment jsdom

import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { synth } from "@/lib/audio-utils";
import { useLessonLaunchTransition } from "./use-lesson-launch-transition";

vi.mock("@/lib/audio-utils", () => ({
  synth: {
    playPop: vi.fn(),
  },
}));

describe("useLessonLaunchTransition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("still opens lesson when audio playback fails", () => {
    const onSelect = vi.fn();
    vi.mocked(synth.playPop).mockImplementation(() => {
      throw new Error("audio-unavailable");
    });

    const { result } = renderHook(() =>
      useLessonLaunchTransition({
        lessonId: "lesson-1",
        onSelect,
        prefersReducedMotion: true,
      }),
    );

    act(() => {
      result.current.handleStartLesson();
    });

    expect(onSelect).toHaveBeenCalledWith("lesson-1");
    expect(result.current.isOpen).toBe(true);
    expect(result.current.isLaunching).toBe(false);
  });
});
