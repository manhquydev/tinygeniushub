import { AbsoluteFill, Sequence, useCurrentFrame, spring, interpolate } from "remotion";
import { MascotScene } from "../compositions/MascotScene";
import { ContentCard } from "./ContentCard";
import { SceneBackground } from "./SceneBackground";
import { TopBar } from "./TopBar";
import { BottomPrompt } from "./BottomPrompt";
import { ConfettiBurst } from "./ConfettiBurst";
import { StarBurst } from "./StarBurst";
import type { LessonVideoData, VideoSection } from "./lesson-video-data";

// Mascot size by section type — larger during emotional moments.
const MASCOT_SIZES: Record<VideoSection["type"], number> = {
  intro: 480,
  teach: 420,
  activity: 420,
  celebrate: 520,
  outro: 480,
};

interface SectionViewProps {
  section: VideoSection;
  sectionIndex: number;
  allSections: VideoSection[];
  lessonTitle: string;
  mascotVariant: LessonVideoData["mascotVariant"];
}

// Renders a single section with full child-friendly layout.
function SectionView({ section, sectionIndex, allSections, lessonTitle, mascotVariant }: SectionViewProps) {
  const frame = useCurrentFrame();
  const isIntro = section.type === "intro";
  const isOutro = section.type === "outro";
  const isCelebrate = section.type === "celebrate";
  const mascotSize = MASCOT_SIZES[section.type];

  // Mascot entrance bob
  const mascotY = spring({
    frame,
    fps: 30,
    config: { damping: 8, stiffness: 80 },
    from: 80,
    to: 0,
  });

  if (isIntro) {
    return <IntroLayout section={section} sectionIndex={sectionIndex} allSections={allSections} lessonTitle={lessonTitle} mascotY={mascotY} mascotSize={mascotSize} frame={frame} mascotVariant={mascotVariant} />;
  }

  if (isOutro) {
    return <OutroLayout section={section} sectionIndex={sectionIndex} allSections={allSections} lessonTitle={lessonTitle} mascotY={mascotY} mascotSize={mascotSize} frame={frame} mascotVariant={mascotVariant} />;
  }

  return (
    <AbsoluteFill>
      <SceneBackground sectionType={section.type} />
      <TopBar lessonTitle={lessonTitle} sections={allSections} currentSectionIndex={sectionIndex} />

      {/* Main content row: mascot (30%) + content (60%) + 10% padding */}
      <div
        style={{
          position: "absolute",
          top: 80,
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0 80px",
          gap: 40,
        }}
      >
        {/* Mascot zone — 30% */}
        <div
          style={{
            flex: "0 0 30%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            height: "100%",
            transform: `translateY(${mascotY}px)`,
          }}
        >
          <MascotScene
            sequence={section.mascotSequence}
            variant={mascotVariant}
            size={mascotSize}
          />
        </div>

        {/* Content zone — 60% */}
        <div
          style={{
            flex: "1 1 60%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <ContentCard section={section} />
        </div>
      </div>

      {section.sublabel && <BottomPrompt text={section.sublabel} />}

      {/* Celebration overlays */}
      {isCelebrate && <ConfettiBurst count={30} />}
      {isCelebrate && <StarBurst x={1200} y={400} count={9} />}
    </AbsoluteFill>
  );
}

interface LayoutProps {
  section: VideoSection;
  sectionIndex: number;
  allSections: VideoSection[];
  lessonTitle: string;
  mascotY: number;
  mascotSize: number;
  frame: number;
  mascotVariant: LessonVideoData["mascotVariant"];
}

// Intro layout: centered title with bounce-in, mascot centered below.
function IntroLayout({ section, sectionIndex, allSections, lessonTitle, mascotY, mascotSize, frame, mascotVariant }: LayoutProps) {
  const titleScale = spring({
    frame,
    fps: 30,
    config: { damping: 10, stiffness: 100 },
    from: 0,
    to: 1,
  });

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <SceneBackground sectionType={section.type} />
      <TopBar lessonTitle={lessonTitle} sections={allSections} currentSectionIndex={sectionIndex} />

      <div
        style={{
          position: "absolute",
          top: 80,
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          padding: "0 120px",
        }}
      >
        {/* Title centered with bounce-in */}
        <div
          style={{
            textAlign: "center",
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#1e3a8a",
              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {section.label}
          </div>
          {section.sublabel && (
            <div
              style={{
                fontSize: 44,
                color: "#4b5563",
                fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
              }}
            >
              {section.sublabel}
            </div>
          )}
        </div>

        {/* Mascot centered below title */}
        <div style={{ transform: `translateY(${mascotY}px)` }}>
          <MascotScene
            sequence={section.mascotSequence}
            variant={mascotVariant}
            size={mascotSize}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// Outro layout: centered farewell message with heart decoration, mascot waving.
function OutroLayout({ section, sectionIndex, allSections, lessonTitle, mascotY, mascotSize, frame, mascotVariant }: LayoutProps) {
  const scale = spring({
    frame,
    fps: 30,
    config: { damping: 10, stiffness: 100 },
    from: 0,
    to: 1,
  });

  const heartBob = Math.sin((frame / 40) * Math.PI * 2) * 6;

  return (
    <AbsoluteFill>
      <SceneBackground sectionType={section.type} />
      <TopBar lessonTitle={lessonTitle} sections={allSections} currentSectionIndex={sectionIndex} />

      <div
        style={{
          position: "absolute",
          top: 80,
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          padding: "0 80px",
        }}
      >
        {/* Mascot waving */}
        <div style={{ transform: `translateY(${mascotY}px)` }}>
          <MascotScene
            sequence={section.mascotSequence}
            variant={mascotVariant}
            size={mascotSize}
          />
        </div>

        {/* Farewell text with heart */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            transform: `scale(${scale})`,
          }}
        >
          <div
            style={{
              fontSize: 100,
              transform: `translateY(${heartBob}px)`,
            }}
          >
            💖
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#1e3a8a",
              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
              textAlign: "center",
              letterSpacing: "0.02em",
            }}
          >
            {section.label}
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#64748b",
              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
              textAlign: "center",
            }}
          >
            Study with Tu Tu
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// Full lesson video template — assembles all sections as Remotion Sequences.
export function LessonVideoTemplate({ lesson }: { lesson: LessonVideoData }) {
  const sectionFrames = lesson.sections.map((s) =>
    Math.round((s.durationMs / 1000) * 30)
  );

  let frameOffset = 0;
  const sectionOffsets = sectionFrames.map((f) => {
    const offset = frameOffset;
    frameOffset += f;
    return offset;
  });

  return (
    <AbsoluteFill>
      {lesson.sections.map((section, i) => (
        <Sequence
          key={section.type + i}
          from={sectionOffsets[i]}
          durationInFrames={sectionFrames[i]}
        >
          <SectionView
            section={section}
            sectionIndex={i}
            allSections={lesson.sections}
            lessonTitle={lesson.title}
            mascotVariant={lesson.mascotVariant}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
