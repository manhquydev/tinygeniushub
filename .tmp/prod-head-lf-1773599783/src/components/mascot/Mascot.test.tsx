// @vitest-environment jsdom

import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Mascot } from "@/components/mascot";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
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

  type MotionMockProps = Record<string, unknown> & {
    children?: React.ReactNode;
    animate?: unknown;
    transition?: unknown;
  };

  const toDataValue = (value: unknown) => {
    if (typeof value === "undefined") return undefined;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const createMotionTag = (tagName: keyof React.JSX.IntrinsicElements) => {
    const MotionTag = React.forwardRef<Element, MotionMockProps>(({ children, ...props }, ref) => {
      const domProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !motionOnlyProps.has(key)),
      ) as Record<string, unknown>;

      const animateValue = toDataValue(props.animate);
      const transitionValue = toDataValue(props.transition);
      if (animateValue) domProps["data-motion-animate"] = animateValue;
      if (transitionValue) domProps["data-motion-transition"] = transitionValue;

      return React.createElement(tagName, { ...domProps, ref }, children as React.ReactNode);
    });

    MotionTag.displayName = `MotionTag(${tagName})`;
    return MotionTag;
  };

  const tags = [
    "svg",
    "g",
    "path",
    "circle",
    "text",
    "polygon",
    "defs",
    "radialGradient",
    "stop",
    "title",
    "rect",
    "line",
  ] as const;

  return Object.fromEntries(tags.map((tag) => [tag, createMotionTag(tag)]));
});

describe("Mascot", () => {
  let observerCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    observerCallback = null;

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("supports independent parent/child state and action for duo mascot", () => {
    const { container } = render(
      <Mascot
        variant="duo"
        state="idle"
        actionProp="none"
        parentState="celebrating"
        childState="playful"
        parentActionProp="heart"
        childActionProp="music"
        motionLevel="minimal"
      />,
    );

    const hasParentStar = Array.from(container.querySelectorAll("polygon")).some((node) =>
      (node.getAttribute("points") ?? "").startsWith("165,98"),
    );
    const hasChildWink = Array.from(container.querySelectorAll("path")).some(
      (node) => node.getAttribute("d") === "M 178 160 C 182 165 190 165 194 160",
    );
    const hasHeartProp = Array.from(container.querySelectorAll("path")).some((node) =>
      (node.getAttribute("d") ?? "").startsWith("M 132 88 C 132 80"),
    );
    const hasMusicProp = Array.from(container.querySelectorAll("path")).some((node) =>
      (node.getAttribute("d") ?? "").startsWith("M 174 140 L 174 156"),
    );

    expect(hasParentStar).toBe(true);
    expect(hasChildWink).toBe(true);
    expect(hasHeartProp).toBe(true);
    expect(hasMusicProp).toBe(true);
  });

  it("drops to minimal motion when mascot moves offscreen", async () => {
    const { container } = render(
      <Mascot variant="big" state="celebrating" actionProp="magic" motionLevel="full" pauseWhenOffscreen />,
    );

    const readAnimatedPayload = () =>
      Array.from(container.querySelectorAll("g[data-motion-animate]"))
        .map((node) => node.getAttribute("data-motion-animate") ?? "")
        .join("\n");

    expect(readAnimatedPayload()).toContain("[0,-14,0]");

    const rootSvg = container.querySelector("svg");
    if (!rootSvg || !observerCallback) {
      throw new Error("Expected svg root and IntersectionObserver callback");
    }

    act(() => {
      const offscreenEntry: IntersectionObserverEntry = {
        time: Date.now(),
        rootBounds: null,
        boundingClientRect: rootSvg.getBoundingClientRect(),
        intersectionRect: rootSvg.getBoundingClientRect(),
        isIntersecting: false,
        intersectionRatio: 0,
        target: rootSvg,
      };

      observerCallback?.(
        [offscreenEntry],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(readAnimatedPayload()).toContain("\"y\":0");
      expect(readAnimatedPayload()).toContain("\"scale\":1");
    });
  });

  it.each([
    ["playful-music", "playful", "music"],
    ["proud-magic", "proud", "magic"],
    ["love-heart", "love", "heart"],
  ] as const)("matches snapshot for %s", (_name, state, actionProp) => {
    const { container } = render(
      <Mascot variant="small" state={state} actionProp={actionProp} motionLevel="minimal" />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
