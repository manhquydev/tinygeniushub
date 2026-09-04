import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  loadHouseholdLearnAccessMock,
  listEntitledTrackMissionsMock,
  listEntitledCourseMissionsMock,
} = vi.hoisted(() => ({
  prismaMock: {
    childProfile: { findFirst: vi.fn() },
    activity: { findMany: vi.fn() },
  },
  loadHouseholdLearnAccessMock: vi.fn(),
  listEntitledTrackMissionsMock: vi.fn(),
  listEntitledCourseMissionsMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/modules/entitlement/assert-can-learn", () => ({
  loadHouseholdLearnAccess: loadHouseholdLearnAccessMock,
}));
vi.mock("@/modules/content/mission-query", () => ({
  listEntitledTrackMissions: listEntitledTrackMissionsMock,
  listEntitledCourseMissions: listEntitledCourseMissionsMock,
  unionMissions: (primary: Array<{ id: string }>, extra: Array<{ id: string }>) => {
    const byId = new Map<string, { id: string }>();
    for (const card of primary) {
      byId.set(card.id, card);
    }
    for (const card of extra) {
      if (!byId.has(card.id)) {
        byId.set(card.id, card);
      }
    }
    return [...byId.values()];
  },
}));
import { getRealKidGardenMission, getTodayMission } from "@/modules/content/service";

const trackCard = { id: "track-lesson", title: "English 1", trackCode: "ENGLISH" };
const courseCard = { id: "course-lesson", title: "Fox 1", trackCode: "littlefox", journeyTitle: "Fox" };

describe("content service access cutover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.childProfile.findFirst.mockResolvedValue({ id: "child-1" });
    listEntitledTrackMissionsMock.mockResolvedValue([]);
    listEntitledCourseMissionsMock.mockResolvedValue([]);
  });

  it("returns track missions for pass holders with no enrollment", async () => {
    loadHouseholdLearnAccessMock.mockResolvedValue({
      trackCodes: ["ENGLISH", "MATH"],
      courseIds: [],
      isTrialHousehold: false,
      hasPaidPlatformPass: true,
    });
    listEntitledTrackMissionsMock.mockResolvedValue([trackCard]);

    await expect(getRealKidGardenMission({ parentId: "parent-1", childId: "child-1" })).resolves.toEqual([
      trackCard,
    ]);
    await expect(getTodayMission({ parentId: "parent-1", childId: "child-1" })).resolves.toEqual([trackCard]);
    expect(listEntitledTrackMissionsMock).toHaveBeenCalledWith({
      childId: "child-1",
      trackCodes: ["ENGLISH", "MATH"],
      trialOnly: false,
    });
  });

  it("unions entitled course windows with track missions", async () => {
    loadHouseholdLearnAccessMock.mockResolvedValue({
      trackCodes: ["ENGLISH"],
      courseIds: ["course-1"],
      isTrialHousehold: false,
      hasPaidPlatformPass: true,
    });
    listEntitledTrackMissionsMock.mockResolvedValue([trackCard]);
    listEntitledCourseMissionsMock.mockResolvedValue([courseCard]);

    await expect(getTodayMission({ parentId: "parent-1", childId: "child-1" })).resolves.toEqual([
      courseCard,
      trackCard,
    ]);
  });
});
