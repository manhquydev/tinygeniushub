import type { Variants } from "motion/react";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const wobble: Variants = {
  idle: {
    rotate: 0,
    scale: 1,
    y: 0,
  },
  wobble: {
    rotate: [0, -6, 6, -4, 3, 0],
    scale: [1, 1.04, 1.03, 1.02, 1],
    y: [0, -2, 0],
    transition: {
      duration: 0.6,
      ease: "easeInOut",
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
  },
};

export const bounceIn: Variants = {
  rest: {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: "0 0 0 rgba(16, 185, 129, 0)",
  },
  bounceIn: {
    opacity: [1, 1, 1],
    y: [0, -12, 0, -5, 0],
    scale: [1, 1.12, 0.96, 1.04, 1],
    boxShadow: [
      "0 0 0 rgba(16, 185, 129, 0)",
      "0 0 18px rgba(16, 185, 129, 0.35)",
      "0 0 0 rgba(16, 185, 129, 0)",
    ],
    transition: {
      duration: 0.72,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export const listStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

export const swipeLeft: Variants = {
  enter: {
    x: 100,
    opacity: 0,
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    zIndex: 0,
    x: -100,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export const swipeRight: Variants = {
  enter: {
    x: -100,
    opacity: 0,
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    zIndex: 0,
    x: 100,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};
