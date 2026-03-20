export const ENTRY_PRESETS = {
  "fly-in": {
    initial: { y: -200, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  "bounce-in": {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },
  "slide-in": {
    initial: { x: -150, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const;

export const EXIT_PRESETS = {
  "wave-out": {
    animate: { x: 150, opacity: 0 },
    transition: { duration: 0.6, ease: "easeIn" },
  },
  "fade-out": {
    animate: { opacity: 0 },
    transition: { duration: 0.5 },
  },
  "fly-out": {
    animate: { y: -200, opacity: 0 },
    transition: { duration: 0.5, ease: "easeIn" },
  },
  "slide-out": {
    animate: { x: 200, opacity: 0 },
    transition: { duration: 0.4, ease: "easeIn" },
  },
} as const;
