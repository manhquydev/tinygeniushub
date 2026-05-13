/**
 * use-garden-dialogue — Context-aware mascot dialogue hook.
 *
 * Returns { dialogue, mascotState } based on:
 *  - context  : which screen the mascot is on
 *  - streak   : current daily learning streak
 *  - lessonsDone : lessons completed today
 *  - lessonsTotal: total lessons today
 *
 * PURE LOGIC — no side effects. Deterministically selects a
 * dialogue line from the pool based on current app state.
 */

import type { MascotState } from "@/components/mascot/types";

export type GardenContext =
  | "world-map"
  | "zone-math"
  | "zone-phonics"
  | "zone-art"
  | "zone-music"
  | "zone-story"
  | "lesson-start"
  | "lesson-correct"
  | "lesson-wrong"
  | "lesson-complete";

interface UsGardenDialogueInput {
  context: GardenContext;
  streak?: number;
  lessonsDone?: number;
  lessonsTotal?: number;
}

interface UseGardenDialogueOutput {
  dialogue: string;
  mascotState: MascotState;
}

// Dialogue pools per context (selected by streak/progress index)
const DIALOGUES: Record<GardenContext, { text: string; state: MascotState }[]> = {
  "world-map": [
    { text: "Ch\u00e0o bu\u1ed5i s\u00e1ng! B\u1eaft \u0111\u1ea7u h\u00e0nh tr\u00ecnh n\u00e0o! \u2600\ufe0f", state: "happy" },
    { text: "Ch\u1ecdn b\u00e0i h\u1ecdc m\u00e0 b\u1ea1n y\u00eau th\u00edch nh\u00e9! \ud83c\udf38", state: "playful" },
    { text: "H\u00f4m nay h\u1ecdc g\u00ec v\u00e0o n\u00e0o! \ud83d\udc49", state: "happy" },
    { text: "I'm so good! \\ud83c\\udf1f", state: "proud" },
  ],
  "zone-math": [
    { text: "To\u00e1n h\u1ecdc r\u1ea5t th\u00fa v\u1ecb! C\u00f9ng kh\u00e1m ph\u00e1 nh\u00e9! \u2b50", state: "happy" },
    { text: "S\u1ed1 1, 2, 3\u2026 C\u0169ng \u0111\u1ebfm n\u00e0o! \ud83d\udcab", state: "playful" },
  ],
  "zone-phonics": [
    { text: "A B C\u2026 C\u00f9ng \u0111\u1ecdc to nh\u00e9! \ud83d\udcd6", state: "happy" },
    { text: "Ti\u1ebfng Anh r\u1ea5t vui! C\u00f9ng b\u1eaft \u0111\u1ea7u! \ud83c\udf1f", state: "playful" },
  ],
  "zone-art": [
    { text: "V\u1ebd tranh c\u00f9ng Cu Con nh\u00e9! \ud83c\udfa8", state: "playful" },
    { text: "S\u1ef1 s\u00e1ng t\u1ea1o kh\u00f4ng c\u00f3 gi\u1edbi h\u1ea1n! \u2728", state: "happy" },
  ],
  "zone-music": [
    { text: "Nh\u1ea1c vui qu\u00e1 \u0111i! C\u00f9ng nghe n\u00e0o! \ud83c\udfb5", state: "happy" },
    { text: "La la la! C\u00f9ng h\u00e1t n\u00e0o! \ud83c\udfbc", state: "celebrating" },
  ],
  "zone-story": [
    { text: "C\u00e2u chuy\u1ec7n k\u1ef3 di\u1ec7u \u0111ang ch\u1edd b\u1ea1n! \ud83d\udc49\ud83d\udcda", state: "happy" },
    { text: "H\u00e3y c\u00f9ng kh\u00e1m ph\u00e1 th\u1ebf gi\u1edbi ph\u00e9p m\u00e0u! \u2728", state: "playful" },
  ],
  "lesson-start": [
    { text: "T\u1eadp trung n\u00e0o! B\u1ea1n c\u00f3 th\u1ec3 l\u00e0m \u0111\u01b0\u1ee3c! \ud83d\udcaa", state: "happy" },
    { text: "C\u00f9ng b\u1eaft \u0111\u1ea7u th\u00f4i! \ud83d\ude80", state: "playful" },
  ],
  "lesson-correct": [
    { text: "\u0110\u00fang r\u1ed3i! Gi\u1ecfi qu\u00e1! \ud83c\udf1f", state: "celebrating" },
    { text: "Xu\u1ea5t s\u1eafc! Ti\u1ebfp t\u1ee5c n\u00e0o! \ud83c\udfc6", state: "proud" },
    { text: "Tuy\u1ec7t v\u1eddi! \ud83c\udf89", state: "love" },
  ],
  "lesson-wrong": [
    { text: "Hm, th\u1eed l\u1ea1i nh\u00e9! \ud83e\udd14", state: "thinking" },
    { text: "G\u1ea7n r\u1ed3i! C\u1ed1 l\u00ean n\u00e0o! \ud83d\udcaa", state: "happy" },
  ],
  "lesson-complete": [
    { text: "Ho\u00e0n th\u00e0nh! B\u1ea1n th\u1eadt tuy\u1ec7t! \ud83c\udf89", state: "celebrating" },
    { text: "5 sao! Ch\u01b0\u01a1ng ti\u1ebfp theo s\u1eafp c\u00f3! \u2b50\u2b50\u2b50\u2b50\u2b50", state: "proud" },
  ],
};

function getStreakBonus(streak: number, context: GardenContext): string | null {
  if (context !== "world-map") return null;
  if (streak >= 30) return `${streak} ng\u00e0y li\u00ean t\u1ee5c! B\u1ea1n l\u00e0 huy\u1ec1n tho\u1ea1i! \ud83d\udc51\ud83d\udd25`;
  if (streak >= 10) return `${streak} ng\u00e0y h\u1ecdc li\u00ean t\u1ee5c! Tuy\u1ec7t v\u1eddi! \u2b50\ud83d\udd25`;
  if (streak >= 5)  return `${streak} ng\u00e0y li\u00ean t\u1ee5c! Ki\u00ean t\u00ecnh qu\u00e1! \ud83d\udd25`;
  return null;
}

export function useGardenDialogue({
  context,
  streak = 0,
  lessonsDone = 0,
  lessonsTotal = 5,
}: UsGardenDialogueInput): UseGardenDialogueOutput {
  const pool = DIALOGUES[context] ?? DIALOGUES["world-map"];

  // Priority: streak milestone > all complete > regular rotation
  const streakBonus = getStreakBonus(streak, context);
  if (streakBonus) {
    return { dialogue: streakBonus, mascotState: "celebrating" };
  }

  if (context === "world-map" && lessonsTotal > 0 && lessonsDone >= lessonsTotal) {
    return {
      dialogue: `Xu\u1ea5t s\u1eafc! H\u00f4m nay ho\u00e0n th\u00e0nh ${lessonsTotal} b\u00e0i! \ud83c\udfc6`,
      mascotState: "celebrating",
    };
  }

  // Simple index-based selection (stable across renders)
  const idx = lessonsDone % pool.length;
  const selected = pool[idx];
  if (!selected) {
    return { dialogue: "Xin ch\u00e0o! \ud83d\udc4b", mascotState: "happy" };
  }
  return { dialogue: selected.text, mascotState: selected.state };
}
