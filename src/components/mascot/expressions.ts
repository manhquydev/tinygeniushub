"use client";

import type { MascotState } from "@/components/mascot/types";

export type EyeVariant = "open" | "smile" | "sleep" | "sad" | "star" | "wink";
export type BeakVariant = "rest" | "talking" | "cheer" | "frown";

export interface MascotExpression {
  eye: EyeVariant;
  beak: BeakVariant;
}

export const STATE_EXPRESSIONS: Record<MascotState, MascotExpression> = {
  idle: { eye: "open", beak: "rest" },
  happy: { eye: "smile", beak: "cheer" },
  thinking: { eye: "open", beak: "talking" },
  celebrating: { eye: "star", beak: "cheer" },
  sad: { eye: "sad", beak: "frown" },
  sleepy: { eye: "sleep", beak: "rest" },
  playful: { eye: "wink", beak: "talking" },
  proud: { eye: "open", beak: "cheer" },
  love: { eye: "smile", beak: "cheer" },
  surprised: { eye: "star", beak: "cheer" },
  excited: { eye: "wink", beak: "cheer" },
  nervous: { eye: "open", beak: "rest" },
  angry: { eye: "sad", beak: "frown" },
  bored: { eye: "sleep", beak: "rest" },
};

export const BIG_EYE_PATHS = {
  smile: {
    left: "M 147 113 C 155 101 175 101 183 113",
    right: "M 217 113 C 225 101 245 101 253 113",
  },
  sleep: {
    left: "M 149 112 C 158 116 172 116 181 112",
    right: "M 219 112 C 228 116 242 116 251 112",
  },
  sad: {
    left: "M 149 112 C 158 102 172 102 181 112",
    right: "M 219 112 C 228 102 242 102 251 112",
  },
};

export const SMALL_EYE_PATHS = {
  smile: {
    left: "M 178 161 C 183 153 189 153 194 161",
    right: "M 206 161 C 211 153 217 153 222 161",
  },
  sleep: {
    left: "M 178.5 160 C 182 162 190 162 193.5 160",
    right: "M 206.5 160 C 210 162 218 162 221.5 160",
  },
  sad: {
    left: "M 178.5 160 C 183 154 189 154 193.5 160",
    right: "M 206.5 160 C 211 154 217 154 221.5 160",
  },
};

export const BIG_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 194 125 Q 200 120 206 125 C 204 138 196 138 194 125 Z",
  talking: "M 194 125 Q 200 120 206 125 C 205 141 195 141 194 125 Z",
  cheer: "M 193.5 124 Q 200 117 206.5 124 C 205 143 195 143 193.5 124 Z",
  frown: "M 194 127 Q 200 131 206 127 C 204 136 196 136 194 127 Z",
};

export const SMALL_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 196.8 168 L 203.2 168 L 200 172.4 Z",
  talking: "M 196.8 168.6 L 203.2 168.6 L 200 176 Z",
  cheer: "M 196.2 168.2 L 203.8 168.2 L 200 177.2 Z",
  frown: "M 196.8 169.8 L 203.2 169.8 L 200 172.2 Z",
};
