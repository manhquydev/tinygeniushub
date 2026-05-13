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
    { text: "Good morning! Let's start today's journey! \u2600\ufe0f", state: "happy" },
    { text: "Choose the lesson you like best! \ud83c\udf38", state: "playful" },
    { text: "What should we learn today? \ud83d\udc49", state: "happy" },
    { text: "You're doing great! \\ud83c\\udf1f", state: "proud" },
  ],
  "zone-math": [
    { text: "Math can be fun! Let's explore together! \u2b50", state: "happy" },
    { text: "One, two, three... let's count! \ud83d\udcab", state: "playful" },
  ],
  "zone-phonics": [
    { text: "A B C... let's read out loud! \ud83d\udcd6", state: "happy" },
    { text: "English is fun! Let's begin! \ud83c\udf1f", state: "playful" },
  ],
  "zone-art": [
    { text: "Let's draw together! \ud83c\udfa8", state: "playful" },
    { text: "Creativity has no limits! \u2728", state: "happy" },
  ],
  "zone-music": [
    { text: "Music is so joyful! Let's listen! \ud83c\udfb5", state: "happy" },
    { text: "La la la! Let's sing together! \ud83c\udfbc", state: "celebrating" },
  ],
  "zone-story": [
    { text: "A magical story is waiting for you! \ud83d\udc49\ud83d\udcda", state: "happy" },
    { text: "Let's explore a world of imagination! \u2728", state: "playful" },
  ],
  "lesson-start": [
    { text: "Focus now. You can do it! \ud83d\udcaa", state: "happy" },
    { text: "Let's get started! \ud83d\ude80", state: "playful" },
  ],
  "lesson-correct": [
    { text: "That's right! Great job! \ud83c\udf1f", state: "celebrating" },
    { text: "Excellent! Keep going! \ud83c\udfc6", state: "proud" },
    { text: "Wonderful! \ud83c\udf89", state: "love" },
  ],
  "lesson-wrong": [
    { text: "Almost. Try again! \ud83e\udd14", state: "thinking" },
    { text: "You're close. Keep going! \ud83d\udcaa", state: "happy" },
  ],
  "lesson-complete": [
    { text: "Completed! You were amazing! \ud83c\udf89", state: "celebrating" },
    { text: "Five stars! The next chapter is waiting! \u2b50\u2b50\u2b50\u2b50\u2b50", state: "proud" },
  ],
};

function getStreakBonus(streak: number, context: GardenContext): string | null {
  if (context !== "world-map") return null;
  if (streak >= 30) return `${streak} days in a row! Legendary work! \ud83d\udc51\ud83d\udd25`;
  if (streak >= 10) return `${streak} learning days in a row! Wonderful! \u2b50\ud83d\udd25`;
  if (streak >= 5)  return `${streak} days in a row! Strong consistency! \ud83d\udd25`;
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
      dialogue: `Excellent! You completed ${lessonsTotal} lessons today! \ud83c\udfc6`,
      mascotState: "celebrating",
    };
  }

  // Simple index-based selection (stable across renders)
  const idx = lessonsDone % pool.length;
  const selected = pool[idx];
  if (!selected) {
    return { dialogue: "Hello! \ud83d\udc4b", mascotState: "happy" };
  }
  return { dialogue: selected.text, mascotState: selected.state };
}
