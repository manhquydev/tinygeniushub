import { describe, expect, it } from "vitest";
import { buildMascotNarrativeMap } from "@/components/mascot/narrative-map";

describe("buildMascotNarrativeMap", () => {
  it("creates auth scenes based on day phase", () => {
    const morning = buildMascotNarrativeMap({
      surface: "auth-entry",
      hourOfDay: 9,
    });

    expect(morning).toHaveLength(4);
    expect(morning[0]).toMatchObject({
      id: "auth-phase",
      state: "happy",
      actionProp: "music",
      badge: "Morning Spark",
    });

    const lateNight = buildMascotNarrativeMap({
      surface: "auth-entry",
      hourOfDay: 2,
    });

    expect(lateNight[0]).toMatchObject({
      state: "sleepy",
      actionProp: "space",
      badge: "Night Ritual",
    });
  });

  it("builds dashboard scenes from live data context", () => {
    const scenes = buildMascotNarrativeMap({
      surface: "parent-dashboard",
      hasRecentCompletion: true,
      childrenCount: 2,
      reportsCount: 3,
      paidReferrals: 1,
      rewardedReferrals: 0,
      subscriptionStatus: "ACTIVE",
    });

    expect(scenes).toHaveLength(4);
    expect(scenes[0]).toMatchObject({
      id: "dashboard-progress-celebrate",
      variant: "duo",
      parentState: "proud",
      childState: "celebrating",
    });
    expect(scenes[2]).toMatchObject({
      id: "dashboard-report-ready",
      state: "proud",
      actionProp: "reading",
    });
    expect(scenes[3]).toMatchObject({
      id: "dashboard-referral-active",
      state: "love",
      actionProp: "heart",
    });
  });

  it("falls back to onboarding-friendly scenes when data is sparse", () => {
    const scenes = buildMascotNarrativeMap({
      surface: "parent-dashboard",
      hasRecentCompletion: false,
      childrenCount: 0,
      reportsCount: 0,
      paidReferrals: 0,
      rewardedReferrals: 0,
      subscriptionStatus: "TRIALING",
    });

    expect(scenes[0]).toMatchObject({
      id: "dashboard-progress-steady",
      state: "happy",
    });
    expect(scenes[1]).toMatchObject({
      id: "dashboard-family-empty",
      state: "thinking",
      actionProp: "reading",
    });
    expect(scenes[2]).toMatchObject({
      id: "dashboard-report-waiting",
      state: "thinking",
    });
    expect(scenes[3]).toMatchObject({
      id: "dashboard-referral-seed",
      badge: "Trial Seed",
      state: "playful",
      actionProp: "music",
    });
  });
});
