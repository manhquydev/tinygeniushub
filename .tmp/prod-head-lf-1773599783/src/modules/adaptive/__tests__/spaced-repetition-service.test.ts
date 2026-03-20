/**
 * Unit tests for SM-2 spaced repetition algorithm.
 */

import { describe, expect, it } from "vitest";
import { computeNextReview } from "../spaced-repetition-service";

describe("computeNextReview (SM-2)", () => {
  it("resets interval to 1 day on incorrect answer", () => {
    const result = computeNextReview({
      isCorrect: false,
      currentInterval: 10,
      easeFactor: 2.5,
      repetitions: 5,
    });

    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.easeFactor).toBe(2.3);
  });

  it("decreases ease factor by 0.2 on incorrect, minimum 1.3", () => {
    const result = computeNextReview({
      isCorrect: false,
      currentInterval: 5,
      easeFactor: 1.4,
      repetitions: 3,
    });

    expect(result.easeFactor).toBe(1.3);
  });

  it("first correct answer gives interval 1", () => {
    const result = computeNextReview({
      isCorrect: true,
      currentInterval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    });

    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBe(2.6);
  });

  it("second correct answer gives interval 3", () => {
    const result = computeNextReview({
      isCorrect: true,
      currentInterval: 1,
      easeFactor: 2.6,
      repetitions: 1,
    });

    expect(result.intervalDays).toBe(3);
    expect(result.repetitions).toBe(2);
  });

  it("third correct answer multiplies interval by ease factor", () => {
    const result = computeNextReview({
      isCorrect: true,
      currentInterval: 3,
      easeFactor: 2.5,
      repetitions: 2,
    });

    // round(3 * 2.5) = 8
    expect(result.intervalDays).toBe(8);
    expect(result.repetitions).toBe(3);
  });

  it("caps interval at 60 days", () => {
    const result = computeNextReview({
      isCorrect: true,
      currentInterval: 50,
      easeFactor: 2.5,
      repetitions: 10,
    });

    expect(result.intervalDays).toBe(60);
  });

  it("caps ease factor at 3.0", () => {
    const result = computeNextReview({
      isCorrect: true,
      currentInterval: 10,
      easeFactor: 2.95,
      repetitions: 5,
    });

    expect(result.easeFactor).toBe(3.0);
  });

  it("increases ease factor by 0.1 on correct", () => {
    const result = computeNextReview({
      isCorrect: true,
      currentInterval: 10,
      easeFactor: 2.0,
      repetitions: 5,
    });

    expect(result.easeFactor).toBe(2.1);
  });
});
