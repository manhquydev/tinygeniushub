"use client";

import type { Transition } from "motion";
import * as m from "motion/react-m";

interface BeanTipGrowthFxProps {
  fromBottom: number;
  toBottom: number;
  active: boolean;
  pulse: number;
  prefersReducedMotion: boolean;
}

export function BeanTipGrowthFx({
  fromBottom,
  toBottom,
  active,
  pulse,
  prefersReducedMotion,
}: BeanTipGrowthFxProps) {
  const motionTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.92,
        ease: [0.34, 1.56, 0.64, 1],
      };

  const animateBottom = active && !prefersReducedMotion ? [fromBottom, toBottom] : toBottom;
  const animateScale = active && !prefersReducedMotion ? [0.9, 1.12, 1] : 1;
  const animateRotate = active && !prefersReducedMotion ? [0, -8, 6, 0] : 0;
  const animateGlow = active && !prefersReducedMotion ? [0.16, 0.42, 0.2] : 0.2;

  return (
    <m.div
      key={`bean-tip-${pulse}`}
      className="ksg-tip"
      style={{ left: "50%" }}
      initial={false}
      animate={{
        bottom: animateBottom,
        scale: animateScale,
        rotate: animateRotate,
        "--ksg-tip-glow-opacity": animateGlow,
      }}
      transition={motionTransition}
      aria-hidden="true"
    >
      <span className="ksg-tip-glow" />
      <span className="ksg-tip-core" />
      <span className="ksg-tip-leaf ksg-tip-leaf-left" />
      <span className="ksg-tip-leaf ksg-tip-leaf-right" />
    </m.div>
  );
}

