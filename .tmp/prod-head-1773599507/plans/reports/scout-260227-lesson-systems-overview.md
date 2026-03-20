# Scout Report: Lesson/Learning Systems Overview

Date: 2026-02-27

## 1. Lesson Wizard (src/components/lesson-wizard/)

Type: Original/legacy lesson player (PRODUCTION)
Flow: 0:Intro -> 1:Video -> 2:Quiz -> 3:Upload -> 4:Done

Key behaviors:
- Video tracked via /api/lessons/{id}/watch/session + heartbeat + watch
- Activities fetched from DB (up to 3 shuffled)
- Completion POST: checklist=[watch_done,activity_done,offline_done]
- Uses KidMascot (older animation), has ParentGateDialog
- Entry: CourseLessonsPlayer at /courses/[slug]/lessons

Files:
  src/components/lesson-wizard/lesson-wizard-flow.tsx (919 lines, needs modularization)
  src/components/lesson-wizard/activity-renderer.tsx
  src/components/lesson-wizard/sort-order-activity.tsx
  src/components/lesson-wizard/drag-drop-activity.tsx
  src/components/lesson-wizard/drawing-activity.tsx
  src/components/lesson-wizard/use-lesson-launch-transition.ts

---

## 2. Interactive Lesson (src/components/interactive-lesson/)

Type: Newer fully-interactive mascot-driven system (DEMO/PREVIEW only)
Flow: hook -> concept -> demonstrate -> activity -> celebrate
      wrong answer -> reinforce (up to 3x retries) -> celebrate

Key behaviors:
- 7 hardcoded TS lesson files (am-a, am-e, dien-chu-cvc, van-at, nghe-am-b, so-1-5, hinh-tron-vuong)
- TTS audio from public/audio/lessons/{id}/step-{1-6}-{type}.mp3
- Web Speech API fallback for keyword cards
- Uses owl mascot family (BigOwl, SmallOwl, BabyOwl, DadOwl, SisterOwl)
- Completion POST: checklist=[interactive_done], skipped in previewMode=true
- Preview page: /interactive-lesson-preview

Files:
  src/components/interactive-lesson/interactive-lesson-flow.tsx
  src/components/interactive-lesson/use-interactive-lesson-state.ts
  src/components/interactive-lesson/lesson-step-{hook,concept,demonstrate,activity,reinforce,celebrate}.tsx
  src/components/interactive-lesson/data/demo-lesson-{id}.ts (7 files)
  src/components/interactive-lesson/audio-player.tsx
  src/components/interactive-lesson/interactive-keyword-cards.tsx

---

## 3. Hybrid Lesson (src/components/hybrid-lesson/)

Type: Newest system -- pre-rendered video + interactive combined (PREVIEW only)

Segment types:
  VideoSegment       -> plays MP4 (from Remotion output)
  InteractiveSegment -> reuses InteractiveLessonStep React components

Flow:
  video segment(s) -> transition overlay -> interactive segments -> celebrate
  wrong answer -> needsReinforce -> replay conceptVideo button

Key behaviors:
- HybridLessonData.segments[] = ordered VideoSegment | InteractiveSegment
- Directly imports+reuses lesson-step-activity, reinforce, celebrate
- Video preloading built-in (use-video-preloader.ts)
- Completion POST: checklist=[hybrid_done]
- Preview at /hybrid-preview, NOT wired to DB or courses

Files:
  src/components/hybrid-lesson/hybrid-lesson-flow.tsx
  src/components/hybrid-lesson/hybrid-lesson-types.ts
  src/components/hybrid-lesson/use-hybrid-lesson-state.ts
  src/components/hybrid-lesson/video-segment-player.tsx
  src/components/hybrid-lesson/hybrid-transition-overlay.tsx
  src/components/hybrid-lesson/hybrid-replay-button.tsx
  src/components/hybrid-lesson/use-video-preloader.ts
  src/components/hybrid-lesson/sample-hybrid-lesson-data.ts

---

## 4. Remotion Video System (remotion/)

Type: Offline pre-rendering pipeline (not served at runtime)
Purpose: Render lesson MP4s -> VideoSegment.src in HybridLessonFlow

Phase types (mirrors interactive steps):
  hook | concept | demonstrate | your-turn | reinforce | celebrate | recap

Pipeline:
  Edit lesson-video-data-v2.ts -> run Remotion render -> MP4 -> HybridLessonData

Files:
  remotion/course-demo/lesson-video-data-v2.ts
  remotion/course-demo/lesson-phase-types.ts
  remotion/course-demo/LessonVideoTemplateV2.tsx
  remotion/compositions/MascotScene.tsx
  remotion/Root.tsx

---

## Database Models (Prisma)

Lesson:
  id, slug, title, objective, estimatedMinutes
  videoSource (iframe URL), bunnyVideoId, videoStatus
  offlineCardMarkdown, parentScriptMarkdown, trialEnabled, isPreview
  -> Unit -> Level (curriculum hierarchy)
  -> activities[] -> Activity (type, prompt, spec JSON, passCriteria)
  -> completions[] -> LessonCompletion (quizScore, minutesLearned, checklist)
  -> lessonProgresses[] -> LessonProgress (timeSpent)
  -> evidences[] -> Evidence (photo upload)
  -> courseItems[] -> CourseLesson (M:N to Course, orderNo)
  -> lessonSkills[] -> LessonSkill -> Skill

Course -> CourseLesson -> Lesson
Course -> CourseEnrollment -> Parent

IMPORTANT: Interactive/Hybrid lesson content is NOT in DB. Only LessonWizard reads DB.

---

## Learning Flow (User Perspective)

PATH A -- PRODUCTION (course-based):
  /courses -> enroll -> /courses/[slug]/lessons
  -> CourseLessonsPlayer -> click lesson -> LessonWizardFlow (fullscreen overlay):
       0: Intro card (title, objective, time estimate)
       1: Watch video (iframe embed, heartbeat progress tracking)
       2: Quiz (up to 3 DB activities, shuffled; fallback generic quiz)
       3: Upload evidence photo (optional)
       4: Done (celebration)
  -> LessonCompletion saved to DB

PATH B -- DEMO (interactive lesson preview):
  /interactive-lesson-preview
  -> select from 7 demo lessons -> InteractiveLessonFlow (fullscreen):
       hook -> concept -> demonstrate -> activity -> celebrate
  -> no DB save in preview mode

PATH C -- PREVIEW (hybrid lesson):
  /hybrid-preview -> HybridLessonFlow (sample data):
       MP4 video -> transition overlay -> interactive activity -> celebrate
  -> not connected to courses or DB

---

## System Connections

  Remotion (offline) --[renders MP4]--> HybridLessonFlow.VideoSegment
  HybridLessonFlow --[reuses]--> interactive-lesson step components
  LessonWizardFlow --[reads/writes]--> DB (Lesson, Activity, LessonCompletion)
  LessonWizardFlow --[launched by]--> CourseLessonsPlayer at /courses/[slug]/lessons

  Shared by all:
    src/components/mascot/      owl family mascot components
    ParentGateDialog             child-proof exit gate
    src/lib/audio-utils.ts       synth sound effects
    /api/lessons/{id}/complete   completion endpoint

---

## Key Observations

1. Three parallel lesson players. Only LessonWizard is in production.
2. Interactive+Hybrid have no DB backing -- lesson content is hardcoded TS.
3. HybridLesson is superset of Interactive (reuses all step components).
4. LessonWizardFlow.tsx is 919 lines -- exceeds 200-line modularization guideline.
5. bunnyVideoId + videoStatus in DB schema suggests Bunny.net CDN pipeline (status unknown).

---

## Unresolved Questions

- Will HybridLessonFlow replace LessonWizardFlow in production, or coexist?
- What determines which lesson player renders for a given Lesson record?
- Will the 7 demo interactive lessons migrate to DB, or remain static TS?
- Is Bunny.net video upload/processing pipeline built and active?