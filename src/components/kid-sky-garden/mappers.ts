import type { SkyGardenLesson, SkyGardenNode } from "@/components/kid-sky-garden/types";

type LessonLike = {
  id?: string;
  title?: string;
  objective?: string;
  estimatedMinutes?: number;
  trackCode?: "ENGLISH" | "MATH" | "HABIT" | string;
  unitTitle?: string;
  videoSource?: string | null;
  bunnyVideoId?: string | null;
  videoStatus?: string;
  isCompleted?: boolean;
  tierIndex?: number;
  journeyTitle?: string;
  journeyAccent?: string;
};

const JOURNEY_META: Record<
  "ENGLISH" | "MATH" | "HABIT",
  {
    title: string;
    accent: string;
  }
> = {
  ENGLISH: {
    title: "Khóa Tiếng Anh",
    accent: "#2563eb",
  },
  MATH: {
    title: "Khóa Toán",
    accent: "#f97316",
  },
  HABIT: {
    title: "Khóa Thói quen",
    accent: "#16a34a",
  },
};

const DEFAULT_COURSE_ACCENT = "#2563eb"; // Fallback for dynamic courses

export function mapLessonLikeToSkyGardenLesson(lesson: LessonLike, index: number): SkyGardenLesson {
  const rawTrackCode = lesson.trackCode ?? "ENGLISH";
  const trackCode = (rawTrackCode === "ENGLISH" || rawTrackCode === "MATH" || rawTrackCode === "HABIT") 
    ? rawTrackCode 
    : "ENGLISH";
  const journey = JOURNEY_META[trackCode];

  return {
    id: typeof lesson.id === "string" ? lesson.id : `lesson-${index + 1}`,
    title: typeof lesson.title === "string" && lesson.title.length > 0 ? lesson.title : `Bài học ${index + 1}`,
    objective:
      typeof lesson.objective === "string" && lesson.objective.length > 0
        ? lesson.objective
        : "Cùng hoàn thành thử thách ở tầng mây này nhé!",
    estimatedMinutes: typeof lesson.estimatedMinutes === "number" ? lesson.estimatedMinutes : 15,
    trackCode,
    unitTitle: typeof lesson.unitTitle === "string" && lesson.unitTitle.length > 0 ? lesson.unitTitle : "Mở đầu",
    journeyTitle: lesson.journeyTitle ?? journey?.title ?? "Khóa học",
    journeyAccent: lesson.journeyAccent ?? journey?.accent ?? DEFAULT_COURSE_ACCENT,
    videoSource: lesson.videoSource ?? null,
    bunnyVideoId: lesson.bunnyVideoId ?? null,
    videoStatus: lesson.videoStatus,
    isCompleted: Boolean(lesson.isCompleted),
    tierIndex: lesson.tierIndex,
  };
}

export function buildSkyGardenNodes(lessons: SkyGardenLesson[]): SkyGardenNode[] {
  if (lessons.length === 0) {
    return [];
  }

  const firstIncompleteIndex = lessons.findIndex((lesson) => !lesson.isCompleted);
  const activeIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : lessons.length - 1;

  return lessons.map((lesson, index) => {
    let state: SkyGardenNode["state"] = "locked";

    if (lesson.isCompleted) {
      state = "completed";
    } else if (index === activeIndex) {
      state = "active";
    } else if (index < activeIndex) {
      state = "completed";
    }

    return {
      ...lesson,
      tierIndex: lesson.tierIndex ?? index + 1,
      side: index % 2 === 0 ? "left" : "right",
      state,
    };
  });
}
