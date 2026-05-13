"use client";

import type { MascotState } from "@/components/mascot/types";

export type EyeVariant = "open" | "smile" | "sleep" | "sad" | "star" | "wink"
  | "wide" | "angry" | "nervous" | "drowsy";
export type BeakVariant = "rest" | "talking" | "cheer" | "frown"
  | "open-wide" | "grimace";

export interface MascotExpression {
  eye: EyeVariant;
  beak: BeakVariant;
}

export interface ExtendedEyePaths {
  left: string;
  right: string;
  leftBrow?: string;
  rightBrow?: string;
  sweatDrop?: string;
  lidLeft?: string;
  lidRight?: string;
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
  surprised: { eye: "wide", beak: "open-wide" },
  excited: { eye: "wink", beak: "cheer" },
  nervous: { eye: "nervous", beak: "rest" },
  angry: { eye: "angry", beak: "grimace" },
  bored: { eye: "drowsy", beak: "rest" },
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

export const BIG_EXTENDED_EYE_PATHS: Record<string, ExtendedEyePaths> = {
  wide: {
    left: "M 147 110 C 147 98 183 98 183 110 C 183 122 147 122 147 110 Z",
    right: "M 217 110 C 217 98 253 98 253 110 C 253 122 217 122 217 110 Z",
  },
  angry: {
    left: "M 149 108 C 155 104 175 106 181 112",
    leftBrow: "M 148 100 L 182 106",
    right: "M 219 108 C 225 104 245 106 251 112",
    rightBrow: "M 252 100 L 218 106",
  },
  nervous: {
    left: "M 150 112 C 157 106 173 106 180 112",
    right: "M 220 112 C 227 106 243 106 250 112",
    sweatDrop: "M 180 96 Q 183 102 180 108 Q 177 102 180 96 Z",
  },
  drowsy: {
    left: "M 149 114 C 155 110 175 110 181 114",
    lidLeft: "M 147 112 L 183 112",
    right: "M 219 114 C 225 110 245 110 251 114",
    lidRight: "M 217 112 L 253 112",
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

export const SMALL_EXTENDED_EYE_PATHS: Record<string, ExtendedEyePaths> = {
  wide: {
    left: "M 178 158 C 178 150 194 150 194 158 C 194 166 178 166 178 158 Z",
    right: "M 206 158 C 206 150 222 150 222 158 C 222 166 206 166 206 158 Z",
  },
  angry: {
    left: "M 179 159 C 183 155 189 156 193 161",
    leftBrow: "M 178 153 L 194 157",
    right: "M 207 159 C 211 155 217 156 221 161",
    rightBrow: "M 222 153 L 206 157",
  },
  nervous: {
    left: "M 179 160 C 183 156 189 156 193 160",
    right: "M 207 160 C 211 156 217 156 221 160",
    sweatDrop: "M 194 150 Q 196 154 194 158 Q 192 154 194 150 Z",
  },
  drowsy: {
    left: "M 178.5 162 C 182 159 190 159 193.5 162",
    lidLeft: "M 177 160 L 195 160",
    right: "M 206.5 162 C 210 159 218 159 221.5 162",
    lidRight: "M 205 160 L 223 160",
  },
};

export const BIG_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 194 125 Q 200 120 206 125 C 204 138 196 138 194 125 Z",
  talking: "M 194 125 Q 200 120 206 125 C 205 141 195 141 194 125 Z",
  cheer: "M 193.5 124 Q 200 117 206.5 124 C 205 143 195 143 193.5 124 Z",
  frown: "M 194 127 Q 200 131 206 127 C 204 136 196 136 194 127 Z",
  "open-wide": "M 192 125 Q 200 118 208 125 C 207 146 193 146 192 125 Z",
  grimace: "M 193 128 L 196 126 L 200 128 L 204 126 L 207 128 C 205 134 195 134 193 128 Z",
};

export const SMALL_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 196.8 168 L 203.2 168 L 200 172.4 Z",
  talking: "M 196.8 168.6 L 203.2 168.6 L 200 176 Z",
  cheer: "M 196.2 168.2 L 203.8 168.2 L 200 177.2 Z",
  frown: "M 196.8 169.8 L 203.2 169.8 L 200 172.2 Z",
  "open-wide": "M 196 168 L 204 168 L 200 178 Z",
  grimace: "M 196.5 170 L 198.5 168.5 L 200 170 L 201.5 168.5 L 203.5 170 L 200 173 Z",
};

// --- Dad Owl — 1.15x BigOwl, eyes at (163,105) and (237,105) ---

export const DAD_EYE_PATHS = {
  smile: {
    left: "M 144 108 C 153 95 175 95 184 108",
    right: "M 216 108 C 225 95 247 95 256 108",
  },
  sleep: {
    left: "M 146 107 C 156 112 172 112 182 107",
    right: "M 218 107 C 228 112 244 112 254 107",
  },
  sad: {
    left: "M 146 107 C 156 96 172 96 182 107",
    right: "M 218 107 C 228 96 244 96 254 107",
  },
};

export const DAD_EXTENDED_EYE_PATHS: Record<string, ExtendedEyePaths> = {
  wide: {
    left: "M 144 105 C 144 92 184 92 184 105 C 184 118 144 118 144 105 Z",
    right: "M 216 105 C 216 92 256 92 256 105 C 256 118 216 118 216 105 Z",
  },
  angry: {
    left: "M 146 103 C 153 98 173 100 182 107",
    leftBrow: "M 145 94 L 183 101",
    right: "M 218 103 C 225 98 245 100 254 107",
    rightBrow: "M 255 94 L 217 101",
  },
  nervous: {
    left: "M 147 107 C 155 100 173 100 181 107",
    right: "M 219 107 C 227 100 245 100 253 107",
    sweatDrop: "M 182 90 Q 185 97 182 104 Q 179 97 182 90 Z",
  },
  drowsy: {
    left: "M 146 109 C 153 105 173 105 182 109",
    lidLeft: "M 144 107 L 184 107",
    right: "M 218 109 C 225 105 245 105 254 109",
    lidRight: "M 216 107 L 256 107",
  },
};

export const DAD_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 193 121 Q 200 115 207 121 C 205 135 195 135 193 121 Z",
  talking: "M 193 121 Q 200 115 207 121 C 206 139 194 139 193 121 Z",
  cheer: "M 192.5 120 Q 200 112 207.5 120 C 206 141 194 141 192.5 120 Z",
  frown: "M 193 123 Q 200 128 207 123 C 205 133 195 133 193 123 Z",
  "open-wide": "M 191 121 Q 200 113 209 121 C 207 143 193 143 191 121 Z",
  grimace: "M 192 124 L 195 122 L 200 124 L 205 122 L 208 124 C 206 131 194 131 192 124 Z",
};

// --- Sister Owl — 0.75x BigOwl, eyes at (184,152) and (216,152) ---

export const SISTER_EYE_PATHS = {
  smile: {
    left: "M 175 155 C 180 147 188 147 193 155",
    right: "M 207 155 C 212 147 220 147 225 155",
  },
  sleep: {
    left: "M 175.5 154 C 179 156 188 156 191.5 154",
    right: "M 208.5 154 C 212 156 220 156 224.5 154",
  },
  sad: {
    left: "M 175.5 154 C 180 148 188 148 191.5 154",
    right: "M 208.5 154 C 212 148 220 148 224.5 154",
  },
};

export const SISTER_EXTENDED_EYE_PATHS: Record<string, ExtendedEyePaths> = {
  wide: {
    left: "M 175 152 C 175 145 193 145 193 152 C 193 159 175 159 175 152 Z",
    right: "M 207 152 C 207 145 225 145 225 152 C 225 159 207 159 207 152 Z",
  },
  angry: {
    left: "M 176 154 C 180 150 188 151 192 155",
    leftBrow: "M 175 147 L 192 151",
    right: "M 208 154 C 212 150 220 151 224 155",
    rightBrow: "M 225 147 L 208 151",
  },
  nervous: {
    left: "M 176 154 C 180 150 188 150 192 154",
    right: "M 208 154 C 212 150 220 150 224 154",
    sweatDrop: "M 192 143 Q 194 147 192 151 Q 190 147 192 143 Z",
  },
  drowsy: {
    left: "M 175.5 156 C 179 153 189 153 192.5 156",
    lidLeft: "M 174 154 L 194 154",
    right: "M 207.5 156 C 211 153 221 153 224.5 156",
    lidRight: "M 206 154 L 226 154",
  },
};

export const SISTER_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 196.5 162 L 203.5 162 L 200 167 Z",
  talking: "M 196.5 162.5 L 203.5 162.5 L 200 170 Z",
  cheer: "M 196 162 L 204 162 L 200 171 Z",
  frown: "M 196.5 163.5 L 203.5 163.5 L 200 166.5 Z",
  "open-wide": "M 196 162 L 204 162 L 200 172 Z",
  grimace: "M 196.5 164 L 198.5 162.5 L 200 164 L 201.5 162.5 L 203.5 164 L 200 167 Z",
};

// --- Baby Owl — 0.45x BigOwl, chibi, eyes at (190,183) and (210,183) ---

export const BABY_EYE_PATHS = {
  smile: {
    left: "M 183 186 C 187 180 193 180 197 186",
    right: "M 203 186 C 207 180 213 180 217 186",
  },
  sleep: {
    left: "M 183.5 185 C 186 187 194 187 196.5 185",
    right: "M 203.5 185 C 206 187 214 187 216.5 185",
  },
  sad: {
    left: "M 183.5 185 C 187 181 193 181 196.5 185",
    right: "M 203.5 185 C 207 181 213 181 216.5 185",
  },
};

export const BABY_EXTENDED_EYE_PATHS: Record<string, ExtendedEyePaths> = {
  wide: {
    left: "M 183 183 C 183 177 197 177 197 183 C 197 189 183 189 183 183 Z",
    right: "M 203 183 C 203 177 217 177 217 183 C 217 189 203 189 203 183 Z",
  },
  angry: {
    left: "M 184 185 C 187 182 193 183 196 186",
    leftBrow: "M 183 179 L 197 182",
    right: "M 204 185 C 207 182 213 183 216 186",
    rightBrow: "M 217 179 L 203 182",
  },
  nervous: {
    left: "M 184 185 C 187 182 193 182 196 185",
    right: "M 204 185 C 207 182 213 182 216 185",
    sweatDrop: "M 197 176 Q 198 179 197 182 Q 196 179 197 176 Z",
  },
  drowsy: {
    left: "M 183.5 187 C 186 185 194 185 196.5 187",
    lidLeft: "M 182 185 L 198 185",
    right: "M 203.5 187 C 206 185 214 185 216.5 187",
    lidRight: "M 202 185 L 218 185",
  },
};

export const BABY_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 197.5 191 L 202.5 191 L 200 194 Z",
  talking: "M 197.5 191.5 L 202.5 191.5 L 200 196 Z",
  cheer: "M 197 191 L 203 191 L 200 196.5 Z",
  frown: "M 197.5 192 L 202.5 192 L 200 194 Z",
  "open-wide": "M 197 191 L 203 191 L 200 197 Z",
  grimace: "M 197.5 193 L 199 191.5 L 200 193 L 201 191.5 L 202.5 193 L 200 195 Z",
};
