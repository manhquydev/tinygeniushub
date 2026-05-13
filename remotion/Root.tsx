import { Composition } from "remotion";
import type { ComponentType } from "react";
import { LessonTemplate } from "./compositions/LessonTemplate";
import { LessonVideoTemplate } from "./course-demo/LessonVideoTemplate";
import { LessonVideoTemplateV2 } from "./course-demo/LessonVideoTemplateV2";
import { lessonVideoData } from "./course-demo/lesson-video-data";
import { lessonVideoDataV2 } from "./course-demo/lesson-video-data-v2";
import type { MascotVariant, MascotSequenceStep } from "../src/components/mascot/types";
import type { LessonVideoData } from "./course-demo/lesson-video-data";
import type { LessonVideoDataV2 } from "./course-demo/lesson-phase-types";

interface LessonTemplateProps {
  title: string;
  variant: MascotVariant;
  sequence: MascotSequenceStep[];
}

// Root composition registry for all Remotion video compositions.
export function RemotionRoot() {
  return (
    <>
      {/* Original demo composition */}
      <Composition
        id="LessonDemo"
        component={LessonTemplate as unknown as ComponentType<Record<string, unknown>>}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Lesson number 1",
          variant: "big" as MascotVariant,
          sequence: [
            { state: "happy" as const, gesture: "waving" as const, duration: 3000 },
            { state: "thinking" as const, gesture: "pointing" as const, actionProp: "flashcard" as const, duration: 5000 },
            { state: "celebrating" as const, gesture: "clapping" as const, duration: 3000 },
          ] as MascotSequenceStep[],
        } as LessonTemplateProps}
      />

      {/* Course demo: 7 English Phonics lessons */}
      {lessonVideoData.map((lesson) => {
        const lessonNum = lesson.id.replace("lesson-", "");
        const paddedNum = lessonNum.padStart(2, "0");
        const durationInFrames = lesson.durationSeconds * 30;

        return (
          <Composition
            key={lesson.id}
            id={`Lesson${paddedNum}`}
            component={
              LessonVideoTemplate as unknown as ComponentType<Record<string, unknown>>
            }
            durationInFrames={durationInFrames}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ lesson } as { lesson: LessonVideoData }}
          />
        );
      })}

      {/* V2: 7-phase arc lessons */}
      {lessonVideoDataV2.map((lesson) => {
        const num = lesson.id.replace("lesson-", "").padStart(2, "0");
        const totalFrames = lesson.phases.reduce((sum, p) => sum + p.durationFrames, 0);
        return (
          <Composition
            key={`v2-${lesson.id}`}
            id={`LessonV2-${num}`}
            component={LessonVideoTemplateV2 as unknown as ComponentType<Record<string, unknown>>}
            durationInFrames={totalFrames}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{ lesson } as { lesson: LessonVideoDataV2 }}
          />
        );
      })}
    </>
  );
}
