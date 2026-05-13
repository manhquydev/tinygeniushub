import type { InteractiveLessonStep } from "@/components/interactive-lesson/interactive-lesson-types";

/** A segment that plays a pre-rendered video */
export interface VideoSegment {
  type: "video";
  /** Phase label for progress display */
  phaseLabel: "hook" | "concept" | "demonstrate";
  /** URL to the video file (MP4) */
  src: string;
  /** Optional poster image for initial frame */
  poster?: string;
}

/** A segment that renders an interactive React component */
export interface InteractiveSegment {
  type: "interactive";
  /** Reuses existing InteractiveLessonStep config */
  step: InteractiveLessonStep;
}

export type HybridSegment = VideoSegment | InteractiveSegment;

export interface HybridLessonData {
  id: string;
  title: string;
  /** Ordered array of segments: typically 1+ video then interactive segments */
  segments: HybridSegment[];
  /** Audio cue URL for video->interactive transition ("It's your turn!") */
  transitionAudioUrl?: string;
  /** Concept video URL for "Review" replay button on activity screens */
  conceptVideoUrl?: string;
}
