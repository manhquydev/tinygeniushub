/**
 * Unit tests for weekly report email template with adaptive skill data.
 */

import { describe, expect, it } from "vitest";
import { buildWeeklyReportEmailText, type WeeklyReportEmailPayload } from "../email-delivery-service";

function makeReport(overrides?: Partial<WeeklyReportEmailPayload>): WeeklyReportEmailPayload {
  return {
    id: "report-123",
    child: {
      nickname: "Minh",
      parent: { email: "parent@test.com" },
    },
    ...overrides,
  };
}

describe("buildWeeklyReportEmailText", () => {
  it("includes basic report info without skill data", () => {
    const text = buildWeeklyReportEmailText(makeReport());

    expect(text).toContain("Minh");
    expect(text).toContain("report-123");
    expect(text).toContain("Log in to the system");
  });

  it("does not include skill section when no adaptive data", () => {
    const text = buildWeeklyReportEmailText(makeReport({ skillsSummary: { ENGLISH: { lessons: 3 } } }));

    expect(text).not.toContain("Skill progress");
  });

  it("includes skill progress when adaptive data present", () => {
    const text = buildWeeklyReportEmailText(makeReport({
      skillsSummary: {
        adaptive: {
          skillsProgress: [
            {
              domain: "MATH",
              totalSkills: 10,
              masteredCount: 3,
              proficientCount: 4,
              developingCount: 2,
              overallMastery: 0.65,
              topImprovements: [
                { skillNameVi: "Add 1 digit", masteryBefore: 0.3, masteryAfter: 0.8 },
              ],
              needsAttention: [
                { skillNameVi: "Subtract 2 digits", mastery: 0.2, reason: "Haven't practiced yet" },
              ],
            },
          ],
          reviewStats: { scheduled: 5, completed: 3, accuracy: 0.8 },
        },
      },
    }));

    expect(text).toContain("Skill progress");
    expect(text).toContain("Maths");
    expect(text).toContain("Total skills: 10");
    expect(text).toContain("Proficiency: 3");
    expect(text).toContain("65%");
    expect(text).toContain("Add 1 digit");
    expect(text).toContain("30% → 80%");
    expect(text).toContain("Subtract 2 digits");
    expect(text).toContain("Haven't practiced yet");
    expect(text).toContain("3/5 articles");
    expect(text).toContain("80%");
  });

  it("includes multiple domains", () => {
    const text = buildWeeklyReportEmailText(makeReport({
      skillsSummary: {
        adaptive: {
          skillsProgress: [
            {
              domain: "MATH",
              totalSkills: 5,
              masteredCount: 1,
              proficientCount: 2,
              developingCount: 1,
              overallMastery: 0.6,
              topImprovements: [],
              needsAttention: [],
            },
            {
              domain: "ENGLISH_PHONICS",
              totalSkills: 3,
              masteredCount: 0,
              proficientCount: 1,
              developingCount: 1,
              overallMastery: 0.4,
              topImprovements: [],
              needsAttention: [],
            },
          ],
          reviewStats: { scheduled: 0, completed: 0, accuracy: 0 },
        },
      },
    }));

    expect(text).toContain("Maths");
    expect(text).toContain("English Phonics");
  });

  it("handles empty skillsProgress array gracefully", () => {
    const text = buildWeeklyReportEmailText(makeReport({
      skillsSummary: {
        adaptive: {
          skillsProgress: [],
          reviewStats: { scheduled: 0, completed: 0, accuracy: 0 },
        },
      },
    }));

    // Should not crash and should not include skill section
    expect(text).not.toContain("Skill progress");
    expect(text).toContain("Log in to the system");
  });
});
