import type { GestureConfig } from "./gesture-types";

// BigOwl: body centered at x=200, wings at x≈125/275, eyes at y≈110
const BIG_GESTURES: Record<string, GestureConfig> = {
  pointing: {
    rightWing: {
      d: "M 275,125 C 310,110 330,105 340,108",
      animate: { rotate: [0, -3, 0] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  waving: {
    rightWing: {
      d: "M 275,125 C 290,100 295,80 285,70",
      animate: { rotate: [-15, 15, -15] },
      transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity },
    },
  },
  nodding: {
    headTransform: {
      animate: { y: [0, 4, 0, 4, 0] },
      transition: { duration: 1.2, ease: "easeInOut", repeat: Infinity },
    },
  },
  "head-shake": {
    headTransform: {
      animate: { rotate: [-6, 6, -6, 6, 0], x: [-2, 2, -2, 2, 0] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
  clapping: {
    leftWing: {
      d: "M 125,125 C 140,130 160,135 180,140",
      animate: { rotate: [0, 20, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
    rightWing: {
      d: "M 275,125 C 260,130 240,135 220,140",
      animate: { rotate: [0, -20, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
  },
  "thinking-scratch": {
    rightWing: {
      d: "M 275,125 C 270,100 255,75 240,65",
      animate: { x: [-2, 2, -2] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
    headTransform: {
      animate: { rotate: [-3, 0, -3] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  "raise-hand": {
    rightWing: {
      d: "M 275,125 C 285,100 283,75 280,55",
      animate: { y: [-2, 2, -2] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
};

// SmallOwl: ~0.6x scale, center at (200, ~158), wings at ~(175/225)
const SMALL_GESTURES: Record<string, GestureConfig> = {
  pointing: {
    rightWing: {
      d: "M 225,158 C 250,147 265,143 272,146",
      animate: { rotate: [0, -3, 0] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  waving: {
    rightWing: {
      d: "M 225,158 C 235,142 238,130 232,123",
      animate: { rotate: [-15, 15, -15] },
      transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity },
    },
  },
  nodding: {
    headTransform: {
      animate: { y: [0, 3, 0, 3, 0] },
      transition: { duration: 1.2, ease: "easeInOut", repeat: Infinity },
    },
  },
  "head-shake": {
    headTransform: {
      animate: { rotate: [-5, 5, -5, 5, 0], x: [-1.5, 1.5, -1.5, 1.5, 0] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
  clapping: {
    leftWing: {
      d: "M 175,158 C 184,162 194,165 205,168",
      animate: { rotate: [0, 18, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
    rightWing: {
      d: "M 225,158 C 216,162 206,165 195,168",
      animate: { rotate: [0, -18, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
  },
  "thinking-scratch": {
    rightWing: {
      d: "M 225,158 C 222,142 213,128 206,121",
      animate: { x: [-1.5, 1.5, -1.5] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
    headTransform: {
      animate: { rotate: [-3, 0, -3] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  "raise-hand": {
    rightWing: {
      d: "M 225,158 C 231,142 230,126 228,113",
      animate: { y: [-1.5, 1.5, -1.5] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
};

// DadOwl: ~1.15x scale, center at (200, ~105), wings at ~(120/280)
const DAD_GESTURES: Record<string, GestureConfig> = {
  pointing: {
    rightWing: {
      d: "M 280,115 C 318,98 340,93 352,96",
      animate: { rotate: [0, -3, 0] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  waving: {
    rightWing: {
      d: "M 280,115 C 297,88 303,65 292,54",
      animate: { rotate: [-15, 15, -15] },
      transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity },
    },
  },
  nodding: {
    headTransform: {
      animate: { y: [0, 5, 0, 5, 0] },
      transition: { duration: 1.2, ease: "easeInOut", repeat: Infinity },
    },
  },
  "head-shake": {
    headTransform: {
      animate: { rotate: [-7, 7, -7, 7, 0], x: [-2.5, 2.5, -2.5, 2.5, 0] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
  clapping: {
    leftWing: {
      d: "M 120,115 C 137,120 158,126 180,132",
      animate: { rotate: [0, 22, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
    rightWing: {
      d: "M 280,115 C 263,120 242,126 220,132",
      animate: { rotate: [0, -22, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
  },
  "thinking-scratch": {
    rightWing: {
      d: "M 280,115 C 274,87 257,61 240,50",
      animate: { x: [-2.5, 2.5, -2.5] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
    headTransform: {
      animate: { rotate: [-3, 0, -3] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  "raise-hand": {
    rightWing: {
      d: "M 280,115 C 291,88 289,60 286,38",
      animate: { y: [-2.5, 2.5, -2.5] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
};

// SisterOwl: ~0.75x scale, center at (200, ~152), wings at ~(164/236)
const SISTER_GESTURES: Record<string, GestureConfig> = {
  pointing: {
    rightWing: {
      d: "M 236,140 C 265,127 282,122 290,125",
      animate: { rotate: [0, -3, 0] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  waving: {
    rightWing: {
      d: "M 236,140 C 248,120 252,102 245,93",
      animate: { rotate: [-15, 15, -15] },
      transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity },
    },
  },
  nodding: {
    headTransform: {
      animate: { y: [0, 3.5, 0, 3.5, 0] },
      transition: { duration: 1.2, ease: "easeInOut", repeat: Infinity },
    },
  },
  "head-shake": {
    headTransform: {
      animate: { rotate: [-5.5, 5.5, -5.5, 5.5, 0], x: [-1.8, 1.8, -1.8, 1.8, 0] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
  clapping: {
    leftWing: {
      d: "M 164,140 C 175,145 188,149 203,152",
      animate: { rotate: [0, 19, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
    rightWing: {
      d: "M 236,140 C 225,145 212,149 197,152",
      animate: { rotate: [0, -19, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
  },
  "thinking-scratch": {
    rightWing: {
      d: "M 236,140 C 232,118 220,96 209,87",
      animate: { x: [-1.8, 1.8, -1.8] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
    headTransform: {
      animate: { rotate: [-3, 0, -3] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  "raise-hand": {
    rightWing: {
      d: "M 236,140 C 244,118 242,96 240,77",
      animate: { y: [-1.8, 1.8, -1.8] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
};

// BabyOwl: ~0.45x scale, center at (200, ~183), wings at ~(179/221)
const BABY_GESTURES: Record<string, GestureConfig> = {
  pointing: {
    rightWing: {
      d: "M 221,183 C 242,175 255,171 261,173",
      animate: { rotate: [0, -3, 0] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  waving: {
    rightWing: {
      d: "M 221,183 C 228,172 230,160 226,154",
      animate: { rotate: [-15, 15, -15] },
      transition: { duration: 0.6, ease: "easeInOut", repeat: Infinity },
    },
  },
  nodding: {
    headTransform: {
      animate: { y: [0, 2.5, 0, 2.5, 0] },
      transition: { duration: 1.2, ease: "easeInOut", repeat: Infinity },
    },
  },
  "head-shake": {
    headTransform: {
      animate: { rotate: [-4, 4, -4, 4, 0], x: [-1.2, 1.2, -1.2, 1.2, 0] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
  clapping: {
    leftWing: {
      d: "M 179,183 C 185,186 192,188 200,190",
      animate: { rotate: [0, 16, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
    rightWing: {
      d: "M 221,183 C 215,186 208,188 200,190",
      animate: { rotate: [0, -16, 0] },
      transition: { duration: 0.4, ease: "easeInOut", repeat: Infinity },
    },
  },
  "thinking-scratch": {
    rightWing: {
      d: "M 221,183 C 219,172 212,160 206,154",
      animate: { x: [-1.2, 1.2, -1.2] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
    headTransform: {
      animate: { rotate: [-3, 0, -3] },
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  "raise-hand": {
    rightWing: {
      d: "M 221,183 C 225,172 224,160 222,149",
      animate: { y: [-1.2, 1.2, -1.2] },
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity },
    },
  },
};

export const GESTURE_CONFIGS: Record<string, Record<string, GestureConfig>> = {
  big: BIG_GESTURES,
  small: SMALL_GESTURES,
  dad: DAD_GESTURES,
  sister: SISTER_GESTURES,
  baby: BABY_GESTURES,
};
