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
    expect(text).toContain("Đăng nhập hệ thống");
  });

  it("does not include skill section when no adaptive data", () => {
    const text = buildWeeklyReportEmailText(makeReport({ skillsSummary: { ENGLISH: { lessons: 3 } } }));

    expect(text).not.toContain("Tiến độ kỹ năng");
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
                { skillNameVi: "Cộng 1 chữ số", masteryBefore: 0.3, masteryAfter: 0.8 },
              ],
              needsAttention: [
                { skillNameVi: "Trừ 2 chữ số", mastery: 0.2, reason: "Chưa luyện tập tuần này" },
              ],
            },
          ],
          reviewStats: { scheduled: 5, completed: 3, accuracy: 0.8 },
        },
      },
    }));

    expect(text).toContain("Tiến độ kỹ năng");
    expect(text).toContain("Toán");
    expect(text).toContain("Tổng kỹ năng: 10");
    expect(text).toContain("Thành thạo: 3");
    expect(text).toContain("65%");
    expect(text).toContain("Cộng 1 chữ số");
    expect(text).toContain("30% → 80%");
    expect(text).toContain("Trừ 2 chữ số");
    expect(text).toContain("Chưa luyện tập");
    expect(text).toContain("3/5 bài");
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

    expect(text).toContain("Toán");
    expect(text).toContain("Tiếng Anh Phonics");
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
    expect(text).not.toContain("Tiến độ kỹ năng");
    expect(text).toContain("Đăng nhập hệ thống");
  });
});
