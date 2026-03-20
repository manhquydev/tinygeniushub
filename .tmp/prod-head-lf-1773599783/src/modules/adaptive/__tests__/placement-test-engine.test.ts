/**
 * Unit tests for CAT placement test engine.
 */

import { describe, expect, it } from "vitest";
import {
  createInitialCATState,
  reconstructCATState,
  recordAnswer,
  selectNextItem,
  updateDifficulty,
  type PlacementTestItemBase,
} from "../placement-test-engine";

function makeItem(overrides: Partial<PlacementTestItemBase> & { id: string }): PlacementTestItemBase {
  return {
    skillId: "skill-1",
    difficulty: "MEDIUM",
    activityType: "MULTIPLE_CHOICE",
    activitySpec: {},
    audioUrl: null,
    ...overrides,
  };
}

describe("createInitialCATState", () => {
  it("starts at MEDIUM difficulty with empty state", () => {
    const state = createInitialCATState();
    expect(state.currentDifficulty).toBe("MEDIUM");
    expect(state.answeredItemIds).toHaveLength(0);
    expect(state.consecutiveCorrect).toBe(0);
    expect(state.consecutiveWrong).toBe(0);
  });
});

describe("updateDifficulty", () => {
  it("increases to HARD after 2 consecutive correct from MEDIUM", () => {
    const state = createInitialCATState();
    updateDifficulty(state, true);
    expect(state.currentDifficulty).toBe("MEDIUM"); // 1 correct, not enough
    updateDifficulty(state, true);
    expect(state.currentDifficulty).toBe("HARD");
  });

  it("increases from EASY to MEDIUM after 2 consecutive correct", () => {
    const state = createInitialCATState();
    state.currentDifficulty = "EASY";
    updateDifficulty(state, true);
    updateDifficulty(state, true);
    expect(state.currentDifficulty).toBe("MEDIUM");
  });

  it("does not exceed HARD", () => {
    const state = createInitialCATState();
    state.currentDifficulty = "HARD";
    updateDifficulty(state, true);
    updateDifficulty(state, true);
    expect(state.currentDifficulty).toBe("HARD");
  });

  it("decreases to EASY after 2 consecutive wrong from MEDIUM", () => {
    const state = createInitialCATState();
    updateDifficulty(state, false);
    expect(state.currentDifficulty).toBe("MEDIUM");
    updateDifficulty(state, false);
    expect(state.currentDifficulty).toBe("EASY");
  });

  it("decreases from HARD to MEDIUM after 2 consecutive wrong", () => {
    const state = createInitialCATState();
    state.currentDifficulty = "HARD";
    updateDifficulty(state, false);
    updateDifficulty(state, false);
    expect(state.currentDifficulty).toBe("MEDIUM");
  });

  it("resets consecutive counters on direction change", () => {
    const state = createInitialCATState();
    updateDifficulty(state, true);
    expect(state.consecutiveCorrect).toBe(1);
    updateDifficulty(state, false);
    expect(state.consecutiveCorrect).toBe(0);
    expect(state.consecutiveWrong).toBe(1);
  });
});

describe("selectNextItem", () => {
  it("returns null when all items answered", () => {
    const state = createInitialCATState();
    state.answeredItemIds = ["item-1"];
    const items = [makeItem({ id: "item-1" })];

    expect(selectNextItem(state, items)).toBeNull();
  });

  it("prefers items matching current difficulty", () => {
    const state = createInitialCATState(); // MEDIUM
    const items = [
      makeItem({ id: "item-easy", difficulty: "EASY" }),
      makeItem({ id: "item-medium", difficulty: "MEDIUM" }),
      makeItem({ id: "item-hard", difficulty: "HARD" }),
    ];

    const next = selectNextItem(state, items);
    expect(next?.id).toBe("item-medium");
  });

  it("falls back to any unanswered item when no difficulty match", () => {
    const state = createInitialCATState(); // MEDIUM
    const items = [
      makeItem({ id: "item-easy", difficulty: "EASY" }),
      makeItem({ id: "item-hard", difficulty: "HARD" }),
    ];

    const next = selectNextItem(state, items);
    expect(next).not.toBeNull();
  });

  it("prioritizes untested skills", () => {
    const state = createInitialCATState();
    state.skillResults.set("skill-tested", { correct: 1, total: 1 });

    const items = [
      makeItem({ id: "item-tested", skillId: "skill-tested", difficulty: "MEDIUM" }),
      makeItem({ id: "item-untested", skillId: "skill-new", difficulty: "MEDIUM" }),
    ];

    const next = selectNextItem(state, items);
    expect(next?.id).toBe("item-untested");
  });
});

describe("recordAnswer", () => {
  it("adds itemId to answered list and updates skill results", () => {
    const state = createInitialCATState();
    recordAnswer(state, "item-1", "skill-1", true);

    expect(state.answeredItemIds).toContain("item-1");
    expect(state.skillResults.get("skill-1")).toEqual({ correct: 1, total: 1 });
  });

  it("accumulates multiple answers for same skill", () => {
    const state = createInitialCATState();
    recordAnswer(state, "item-1", "skill-1", true);
    recordAnswer(state, "item-2", "skill-1", false);

    expect(state.skillResults.get("skill-1")).toEqual({ correct: 1, total: 2 });
  });
});

describe("reconstructCATState", () => {
  it("rebuilds state from response history", () => {
    const responses = [
      { itemId: "i1", isCorrect: true, item: makeItem({ id: "i1" }) },
      { itemId: "i2", isCorrect: true, item: makeItem({ id: "i2" }) },
      { itemId: "i3", isCorrect: false, item: makeItem({ id: "i3" }) },
    ];

    const state = reconstructCATState(responses);

    expect(state.answeredItemIds).toEqual(["i1", "i2", "i3"]);
    // After 2 correct: MEDIUM -> HARD, then 1 wrong: consecutiveWrong=1, still HARD
    expect(state.currentDifficulty).toBe("HARD");
    expect(state.consecutiveWrong).toBe(1);
  });
});
