// @vitest-environment jsdom

import React from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Mascot } from "@/components/mascot";

vi.mock("motion/react", () => ({
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("motion/react-m", () => {
  type MotionMockProps = React.HTMLAttributes<HTMLDivElement> & {
    animate?: unknown;
    transition?: unknown;
    children?: React.ReactNode;
  };

  const toDataValue = (value: unknown) => {
    if (typeof value === "undefined") return undefined;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const Div = React.forwardRef<HTMLDivElement, MotionMockProps>(({ children, animate, transition, ...rest }, ref) => {
    const animateValue = toDataValue(animate);
    const transitionValue = toDataValue(transition);

    return (
      <div
        {...rest}
        ref={ref}
        data-motion-animate={animateValue}
        data-motion-transition={transitionValue}
      >
        {children}
      </div>
    );
  });

  Div.displayName = "MotionDivMock";

  return {
    div: Div,
  };
});

function getMascotRoot(container: HTMLElement) {
  const root = container.querySelector('[role="img"][data-motion-animate]');
  if (!root) {
    throw new Error("Mascot root not found");
  }
  return root as HTMLElement;
}

describe("Mascot", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("renders mascot container and image alt correctly", () => {
    const { container, getByAltText } = render(<Mascot variant="small" state="playful" motionLevel="minimal" />);

    const mascotRoot = getMascotRoot(container);
    const image = getByAltText("Fox mascot TinyGeniusHub");

    expect(mascotRoot.tagName.toLowerCase()).toBe("div");
    expect(mascotRoot.getAttribute("data-motion-animate")).toContain('"y":0');
    expect(image.tagName.toLowerCase()).toBe("img");
  });

  it("applies active loop animation for celebrating state", () => {
    const { container } = render(<Mascot variant="big" state="celebrating" motionLevel="full" />);

    const mascotRoot = getMascotRoot(container);
    const animatePayload = mascotRoot.getAttribute("data-motion-animate") ?? "";

    expect(animatePayload).toContain("[0,-10,0]");
    expect(animatePayload).toContain('"scale":[1,1.04,1]');
  });

  it("keeps minimal motion payload when motionLevel is minimal", () => {
    const { container } = render(<Mascot variant="big" state="celebrating" motionLevel="minimal" />);

    const mascotRoot = getMascotRoot(container);
    const animatePayload = mascotRoot.getAttribute("data-motion-animate") ?? "";

    expect(animatePayload).toContain('"y":0');
    expect(animatePayload).toContain('"scale":1');
  });

  it("calls onSequenceComplete when running sequence mode", () => {
    vi.useFakeTimers();

    const onSequenceComplete = vi.fn();

    render(
      <Mascot
        variant="small"
        state="happy"
        animationMode="sequence"
        sequence={[
          { state: "happy", duration: 300 },
          { state: "celebrating", duration: 500 },
        ]}
        onSequenceComplete={onSequenceComplete}
      />,
    );

    expect(onSequenceComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(799);
    });

    expect(onSequenceComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(201);
    });

    expect(onSequenceComplete).toHaveBeenCalledTimes(1);
  });

  it("calculates family mascot size based on layout", () => {
    const { container } = render(
      <Mascot variant="family" state="idle" size={160} layout="horizontal" motionLevel="minimal" />,
    );

    const mascotRoot = getMascotRoot(container);

    expect(mascotRoot.getAttribute("style")).toContain("width: 264px");
    expect(mascotRoot.getAttribute("style")).toContain("height: 160px");
  });
});