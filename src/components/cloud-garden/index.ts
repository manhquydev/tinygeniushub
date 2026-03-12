/**
 * index.ts — Public barrel exports for cloud-garden component library.
 *
 * Import individual components from here:
 *   import { CloudWorldMap, LessonCard, ActivityHUD } from "@/components/cloud-garden";
 */

// === Shared Primitives ===
export { CloudShape } from "./shared/CloudShape";
export type { CloudVariant } from "./shared/CloudShape";

export { CloudButton } from "./shared/CloudButton";
export type { CloudButtonState, CloudButtonSize, CloudButtonSubject } from "./shared/CloudButton";

export { CloudProgressBar } from "./shared/CloudProgressBar";

export { SpeechBubble } from "./shared/SpeechBubble";

export { StarBurstCanvas } from "./shared/StarBurstCanvas";

// === World Map ===
export { SkyBackground } from "./world-map/SkyBackground";
export { StarField } from "./world-map/StarField";
export { ShootingStar } from "./world-map/ShootingStar";
export { GroundCloudLayer } from "./world-map/GroundCloudLayer";
export { MagicTree } from "./world-map/MagicTree";
export { CloudZone } from "./world-map/CloudZone";
export type { GardenZone } from "./world-map/CloudZone";
export { CloudWorldMap } from "./world-map/CloudWorldMap";

// === Mascot Guide ===
export { GardenMascotGuide } from "./mascot-guide/GardenMascotGuide";
export { useGardenDialogue } from "./mascot-guide/use-garden-dialogue";
export type { GardenContext } from "./mascot-guide/use-garden-dialogue";

// === Lesson Zone ===
export { LessonCard } from "./lesson-zone/LessonCard";
export type { LessonCardState, LessonSubject } from "./lesson-zone/LessonCard";
export { LessonBranch } from "./lesson-zone/LessonBranch";
export type { LessonItem } from "./lesson-zone/LessonBranch";

// === Activity ===
export { ActivityHUD } from "./activity/ActivityHUD";
export { ContentStage } from "./activity/ContentStage";
export { CloudAnswerButton } from "./activity/CloudAnswerButton";
export { LessonCompleteScreen } from "./activity/LessonCompleteScreen";
