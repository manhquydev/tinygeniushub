import type { MascotActionProp, MascotMotionLevel, MascotState, MascotVariant } from "@/components/mascot/types";

export type MascotNarrativeSurface = "auth-entry" | "parent-dashboard";
export type MascotNarrativeTone = "sky" | "indigo" | "rose" | "mint";

export interface MascotNarrativeContext {
  surface: MascotNarrativeSurface;
  hourOfDay?: number;
  hasRecentCompletion?: boolean;
  childrenCount?: number;
  reportsCount?: number;
  paidReferrals?: number;
  rewardedReferrals?: number;
  subscriptionStatus?: string | null;
}

export interface MascotNarrativeScene {
  id: string;
  title: string;
  description: string;
  badge: string;
  variant: MascotVariant;
  state: MascotState;
  actionProp: MascotActionProp;
  size: number;
  tone: MascotNarrativeTone;
  motionLevel?: MascotMotionLevel;
  parentState?: MascotState;
  childState?: MascotState;
  parentActionProp?: MascotActionProp;
  childActionProp?: MascotActionProp;
}

function resolveAuthDayPhase(hourOfDay: number): Pick<MascotNarrativeScene, "state" | "actionProp" | "title" | "description" | "badge"> {
  if (hourOfDay < 6) {
    return {
      state: "sleepy",
      actionProp: "space",
      title: "Guarding the Dream",
      description: "Late night moments: the mascot keeps a quiet beat so parents still feel secure.",
      badge: "Night Ritual",
    };
  }
  if (hourOfDay < 11) {
    return {
      state: "happy",
      actionProp: "music",
      title: "Morning Energy",
      description: "A light melody opens the new day, helping your baby's first learning session full of excitement.",
      badge: "Morning Spark",
    };
  }
  if (hourOfDay < 18) {
    return {
      state: "proud",
      actionProp: "magic",
      title: "Daily Progress Rhythm",
      description: "A confident demeanor emphasizes a spirit of initiative and continuous development.",
      badge: "Day Momentum",
    };
  }
  return {
    state: "love",
    actionProp: "heart",
    title: "Family Moments",
    description: "Evening is a time of connection: warm emotions help your child complete the school day.",
    badge: "Evening Bond",
  };
}

function buildAuthNarrative(context: MascotNarrativeContext): MascotNarrativeScene[] {
  const hourOfDay = context.hourOfDay ?? new Date().getHours();
  const phase = resolveAuthDayPhase(hourOfDay);

  return [
    {
      id: "auth-phase",
      variant: "small",
      size: 188,
      tone: "sky",
      motionLevel: "soft",
      ...phase,
    },
    {
      id: "auth-family-trust",
      title: "Pair of Companion Owls",
      description: "The duo layout conveys the message: child and parent always go at the same learning pace.",
      badge: "Family Duo",
      variant: "duo",
      state: "happy",
      actionProp: "none",
      parentState: "proud",
      childState: "playful",
      parentActionProp: "magic",
      childActionProp: "music",
      size: 214,
      tone: "mint",
      motionLevel: "soft",
    },
    {
      id: "auth-focus",
      title: "Session Preparation",
      description: "Focused nuance creates a clear sense of flow before parents log on.",
      badge: "Focus Gate",
      variant: "big",
      state: "thinking",
      actionProp: "reading",
      size: 210,
      tone: "indigo",
      motionLevel: "soft",
    },
    {
      id: "auth-care",
      title: "Nurturing Emotions",
      description: "Soft emotional notes help keep the auth page from being dry and stiff, increasing intimacy and memorableness.",
      badge: "Care Layer",
      variant: "duo",
      state: "love",
      actionProp: "heart",
      parentState: "love",
      childState: "happy",
      parentActionProp: "heart",
      childActionProp: "heart",
      size: 214,
      tone: "rose",
      motionLevel: "soft",
    },
  ];
}

function buildDashboardNarrative(context: MascotNarrativeContext): MascotNarrativeScene[] {
  const childrenCount = context.childrenCount ?? 0;
  const reportsCount = context.reportsCount ?? 0;
  const paidReferrals = context.paidReferrals ?? 0;
  const rewardedReferrals = context.rewardedReferrals ?? 0;
  const hasRecentCompletion = context.hasRecentCompletion ?? false;
  const hasReferralImpact = paidReferrals > 0 || rewardedReferrals > 0;
  const isTrialing = (context.subscriptionStatus ?? "").toUpperCase() === "TRIALING";

  const progressScene: MascotNarrativeScene = hasRecentCompletion
    ? {
        id: "dashboard-progress-celebrate",
        title: "Celebrate New Achievements",
        description: "A recently completed lesson will trigger a celebratory duo to reinforce motivation for the whole family.",
        badge: "Progress Pulse",
        variant: "duo",
        state: "celebrating",
        actionProp: "space",
        parentState: "proud",
        childState: "celebrating",
        parentActionProp: "magic",
        childActionProp: "space",
        size: 214,
        tone: "sky",
        motionLevel: "soft",
      }
    : {
        id: "dashboard-progress-steady",
        title: "Steady Progress",
        description: "When there is no new milestone, the mascot changes to a steady rhythm to create a feeling of sustainability and no urgency.",
        badge: "Steady Growth",
        variant: "duo",
        state: "happy",
        actionProp: "none",
        parentState: "proud",
        childState: "happy",
        parentActionProp: "magic",
        childActionProp: "music",
        size: 214,
        tone: "mint",
        motionLevel: "soft",
      };

  const familyScene: MascotNarrativeScene =
    childrenCount === 0
      ? {
          id: "dashboard-family-empty",
          title: "Suggestions for Creating Baby Profile",
          description: "When there is no baby profile, the mascot uses directional tones to avoid the feeling of emptiness.",
          badge: "Onboarding Cue",
          variant: "big",
          state: "thinking",
          actionProp: "reading",
          size: 210,
          tone: "indigo",
          motionLevel: "soft",
        }
      : childrenCount === 1
        ? {
            id: "dashboard-family-single",
            title: "1-1 Mentoring Rhythm",
            description: "One baby - one rhythm of deep companionship: expressiveness focused on direct connection.",
            badge: "1:1 Journey",
            variant: "duo",
            state: "love",
            actionProp: "heart",
            parentState: "love",
            childState: "playful",
            parentActionProp: "heart",
            childActionProp: "music",
            size: 214,
            tone: "rose",
            motionLevel: "soft",
          }
        : {
            id: "dashboard-family-multi",
            title: "Coordination of Multiple Children",
            description: "Families with many files need a flexible coordination rhythm: the mascot shows a spirit of organization and playfulness.",
            badge: "Multi-Kid Flow",
            variant: "big",
            state: "proud",
            actionProp: "magic",
            size: 210,
            tone: "indigo",
            motionLevel: "soft",
          };

  const reportScene: MascotNarrativeScene =
    reportsCount > 0
      ? {
          id: "dashboard-report-ready",
          title: "Report Formed",
          description: "Once the reported data is available, the mascot maintains a confident stance to emphasize evidence-based progress.",
          badge: "Insight Ready",
          variant: "small",
          state: "proud",
          actionProp: "reading",
          size: 188,
          tone: "mint",
          motionLevel: "soft",
        }
      : {
          id: "dashboard-report-waiting",
          title: "Accumulating Data",
          description: "The first stage has not yet been reported: the mascot is in a thinking state to transmit an active waiting signal.",
          badge: "Insight Building",
          variant: "small",
          state: "thinking",
          actionProp: "reading",
          size: 188,
          tone: "sky",
          motionLevel: "soft",
        };

  const referralScene: MascotNarrativeScene = hasReferralImpact
    ? {
        id: "dashboard-referral-active",
        title: "Spillover Effect",
        description: "When the referral is successful, the mascot changes to a warm tone to honor the parent's contribution.",
        badge: "Community Impact",
        variant: "duo",
        state: "love",
        actionProp: "heart",
        parentState: "love",
        childState: "happy",
        parentActionProp: "heart",
        childActionProp: "heart",
        size: 214,
        tone: "rose",
        motionLevel: "soft",
      }
    : {
        id: "dashboard-referral-seed",
        title: isTrialing ? "Nurturing the Seeds of Sharing" : "Nurturing Networks",
        description: isTrialing
          ? "During the trial phase, the mascot keeps its tones light to encourage natural sharing."
          : "Once the service package has been stabilized, mascot clicks on the rhythm of sustainable community development.",
        badge: isTrialing ? "Trial Seed" : "Growth Network",
        variant: "small",
        state: "playful",
        actionProp: "music",
        size: 188,
        tone: "sky",
        motionLevel: "soft",
      };

  return [progressScene, familyScene, reportScene, referralScene];
}

export function buildMascotNarrativeMap(context: MascotNarrativeContext): MascotNarrativeScene[] {
  if (context.surface === "auth-entry") {
    return buildAuthNarrative(context);
  }
  return buildDashboardNarrative(context);
}
