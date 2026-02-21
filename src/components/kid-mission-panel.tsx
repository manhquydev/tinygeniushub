"use client";

import { useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { KidMotionProvider } from "@/components/animation/kid-motion-provider";
import { fadeInUp, listStagger, popIn } from "@/components/animation/kid-motion-variants";
import { LessonCompletionCard } from "@/components/lesson-completion-card";

// Free, safe base64 audio snippets for placeholder use
const POP_SOUND = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpERAAEEoAAgAA//M0xGEAAAANzGwwAAAAMjS0LUAABt2222222//////+w3///E8X//wVv////kR////9H////0v////S/////9L////+S/////L/////F/////C////8P////h////4P///+B////gP///4B///+AP///gB///gB//+AH//4Bf/+AX//gF//wF//wF//wF//wT//AT//AT//AT//AT//wT//wP//+A///4C///gH///AP///A////A///8B////B////h////4f///+P///+T////pf///+n////r////7v////v////v////v///+7////rf///+X////kf///+T////h////4P///+B///+AP///AP///AH///gH///wD//+A///wB///AH//4A///gH//wH//wH//gf//gf//gf//wf//A///A///A///wf//gD//+A///4B///wD///AP///Af///B////h////4f///+P///+X////p////6f///+v////v////v////v////v///+7////rf///+X////kf///+P////h////4P///+B///+AP///AH///gH///wD//+A///wH//4B///A///wB///AH//4H//wP//wj///gf//A///wA///A////A///8B////B////h///+A///+B///+A////A////A///8B////h////4f///+P///+T////p////6f///+v////v////v////v////v///+7////rf///+X////kf///+P////B////4P///+B///+AP///wD///AD//4B///A///wB///AH//4H//wP//h///wP//wf//gf//A///A///A///A///8B////B////h////4f///+P///+T////p////6f///+X////v////v////v////v///+7////rf///+X////kf///+P////B////4P///+B///+AP///AD//+A///wB///AH//4A///gH//wP//h///wP//wj//P////0D//+A///4B///wH///AP///gf///B////4f///+H///+P///+T////pf///+n////r////7v////v////v////v///+7////rf///+X////jf///+P////B////4P///+B///+AP///AP///AH///gD//+A///wB///AH//4A///gH//wP//wP//h///wP//wf//gf//A///A///A///A///8B////B////h////4f///+P///+V////p////6f///+v////u////u////u////u///+v////vf///+n////pf///+T////h////4P///+B///+AP///wD//+A///wB///AP//4A///gH//wP//wP//h///wP//wf//g///g///wf//A///A///A///8H///wh///+If///+P///+T////pf///+n////r////7v////v////v////v///+7////r////5f///+H////gf///+B///+A///+A///wD//+A///wB///AH//4A///h///wH//wP//wP//wj//wP//gf//g///gf//A///wA///A////wf///A///8B////4f///+H///+X////p////6f///+r////v////v////v////v///+7////rf///+X////kf///+P////B////4P///+L///4A///wD///AD//8B///A///wB///AH//4H//wP//wf//wj//wf//gf//g///A///gf///D///wh///+Af///AH///gD///4A///wD//";
// Free, safe base64 yay sound snippet 
const YAY_SOUND = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpERAAEEoAAgAA//M0xGEAAAANzGwwAAAAMjS0LUAABt2222222//////+w3///E8X//wVv////kR////9H////0v////S/////9L////+S/////L/////F/////C////8P////h////4P///+B////gP///4B///+AP///gB///gB//+AH//4Bf/+AX//gF//wF//wF//wF//wT//AT//AT//AT//AT//wT//wP//+A///4C///gH///AP///A////A///8B////B////h////4f///+P///+T////pf///+n////r////7v////v////v////v///+7////rf///+X////kf///+T////h////4P///+B///+AP///AP///AH///gH///wD//+A///wB///AH//4A///gH//wH//wH//gf//gf//gf//wf//A///A///A///wf//gD//+A///4B///wD///AP///Af///B////h////4f///+P///+X////p////6f///+v////v////v////v////v///+7////rf///+X////kf///+P////h////4P///+B///+AP///AH///gH///wD//+A///wH//4B///A///wB///AH//4H//wP//wj///gf//A///wA///A////A///8B////B////h///+A///+B///+A////A////A///8B////h////4f///+P///+T////p////6f///+v////v////v////v////v///+7////rf///+X////kf///+P////B////4P///+B///+AP///wD///AD//4B///A///wB///AH//4H//wP//h///wP//wf//gf//A///A///A///A///8B////B////h////4f///+P///+T////p////6f///+X////v////v////v////v///+7////rf///+X////kf///+P////B////4P///+B///+AP///AD//+A///wB///AH//4A///gH//wP//h///wP//wj//P////0D//+A///4B///wH///AP///gf///B////4f///+H///+P///+T////pf///+n////r////7v////v////v////v///+7////rf///+X////jf///+P////B////4P///+B///+AP///AP///AH///gD//+A///wB///AH//4A///gH//wP//wP//h///wP//wf//gf//A///A///A///A///8B////B////h////4f///+P///+V////p////6f///+v////u////u////u////u///+v////vf///+n////pf///+T////h////4P///+B///+AP///wD//+A///wB///AP//4A///gH//wP//wP//h///wP//wf//g///g///wf//A///A///A///8H///wh///+If///+P///+T////pf///+n////r////7v////v////v////v///+7////r////5f///+H////gf///+B///+A///+A///wD//+A///wB///AH//4A///h///wH//wP//wP//wj//wP//gf//g///gf//A///wA///A////wf///A///8B////4f///+H///+X////p////6f///+r////v////v////v////v///+7////rf///+X////kf///+P////B////4P///+L///4A///wD///AD//8B///A///wB///AH//4H//wP//wf//wj//wf//gf//g///A///gf///D///wh///+Af///AH///gD///4A///wD//";

interface MissionChild {
  id: string;
  nickname: string;
}

interface MissionLesson {
  id: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  videoSource?: string | null;
}

interface KidMissionPanelProps {
  childrenProfiles: MissionChild[];
  initialChildId: string;
  initialLessons: MissionLesson[];
}

export function KidMissionPanel({
  childrenProfiles,
  initialChildId,
  initialLessons,
}: KidMissionPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeChildId, setActiveChildId] = useState(initialChildId);
  const [lessons, setLessons] = useState(initialLessons);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchSeqRef = useRef(0);
  const audioContextRef = useRef<HTMLAudioElement | null>(null);
  const [mascotMessage, setMascotMessage] = useState("Nhấn vào tớ nhé! Cùng học bài nào!");

  const mascotMessages = [
    "Cậu học ngoan nhé!",
    "Tớ luôn ở đây hỗ trợ cậu!",
    "Cứ từ từ học, không vội!",
    "Cố lên cố lên nào!",
    "Wow, hôm nay cậu thật tuyệt!"
  ];

  const handleMascotClick = () => {
    playSound(YAY_SOUND);
    const randomMsg = mascotMessages[Math.floor(Math.random() * mascotMessages.length)];
    setMascotMessage(randomMsg);
  };

  const playSound = (base64Sound: string) => {
    if (typeof window === "undefined") return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new Audio(base64Sound);
      } else {
        audioContextRef.current.src = base64Sound;
      }
      audioContextRef.current.volume = 0.5; // Giảm âm lượng để không làm giật mình
      void audioContextRef.current.play();
    } catch {
      // Ignore audio playback errors (e.g., auto-play restrictions)
    }
  };

  async function handleSelectChild(childId: string) {
    playSound(POP_SOUND);
    if (childId === activeChildId) {
      return;
    }

    setActiveChildId(childId);
    setError(null);
    setLoadingLessons(true);
    const currentFetchSeq = ++fetchSeqRef.current;
    const url = new URL(window.location.href);
    url.searchParams.set("childId", childId);
    window.history.replaceState(null, "", url.toString());

    try {
      const response = await fetch(`/api/lessons/today?childId=${encodeURIComponent(childId)}`);
      const body = await response.json();

      if (currentFetchSeq !== fetchSeqRef.current) {
        return;
      }

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không tải được bài học hôm nay.");
        setLessons([]);
        return;
      }

      const nextLessons = Array.isArray(body.data?.lessons) ? (body.data.lessons as MissionLesson[]) : [];
      setLessons(nextLessons);
    } catch (loadError) {
      if (currentFetchSeq !== fetchSeqRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
      setLessons([]);
    } finally {
      if (currentFetchSeq === fetchSeqRef.current) {
        setLoadingLessons(false);
      }
    }
  }

  const activeChild = childrenProfiles.find((child) => child.id === activeChildId) ?? childrenProfiles[0];

  return (
    <KidMotionProvider>
      <div className="page-stack kid-shell">
        <m.section
          className="card kid-hero-card"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1>Bài học hôm nay — {activeChild.nickname}</h1>
          <p className="muted-text">
            Chọn đúng hồ sơ bé để hệ thống lấy bài học theo tiến độ.
          </p>
          <div className="child-switcher" style={{ gap: "1.5rem", marginTop: "1.5rem", padding: "1rem", background: "color-mix(in srgb, var(--surface-100) 50%, transparent)", borderRadius: "24px", justifyContent: "center", display: "flex", flexWrap: "wrap" }}>
            {childrenProfiles.map((child) => {
              const isActive = child.id === activeChildId;
              const firstLetter = child.nickname.charAt(0).toUpperCase();

              return (
                <div key={child.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <m.button
                    type="button"
                    onClick={() => handleSelectChild(child.id)}
                    className={`kid-avatar ${isActive ? "kid-avatar-active" : ""}`}
                    disabled={loadingLessons}
                    whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.05 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                    layout
                  >
                    {firstLetter}
                  </m.button>
                  <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? "var(--ink-900)" : "var(--ink-600)", fontSize: "1.1rem" }}>
                    {child.nickname}
                  </span>
                </div>
              );
            })}
          </div>
        </m.section>

        <m.section
          className="card"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
          aria-busy={loadingLessons}
        >
          <h2>Bài học hôm nay</h2>
          <AnimatePresence mode="wait" initial={false}>
            {loadingLessons ? (
              <m.div
                key="loading"
                className="muted-text"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem" }}
              >
                <div className="animate-float" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--surface-200)", borderTopColor: "var(--brand-500)", animation: "spin 1s linear infinite" }} />
                <p style={{ fontWeight: 600, color: "var(--brand-600)" }}>Đang chuẩn bị bài học...</p>
              </m.div>
            ) : null}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            {error ? (
              <m.div
                key={error}
                className="error-text"
                role="status"
                aria-live="assertive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ background: "#fef2f2", padding: "1rem", borderRadius: "12px", border: "1px solid #fecaca", marginBottom: "1rem" }}
              >
                {error}
              </m.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <m.div
              key={activeChild.id}
              className="journey-map-container"
              variants={listStagger}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {lessons.length > 0 && <div className="journey-path" />}
              {lessons.map((lesson, index) => {
                // Giả lập trạng thái để trực quan (Trong thực tế cần dựa trên dữ liệu thật)
                // Ví dụ: Bài 0 -> Xong, Bài 1 -> Đang học, Bài 2+ -> Khoá
                const isCompleted = index === 0 && lessons.length > 1;
                const isActiveProgression = index === (lessons.length > 1 ? 1 : 0);

                let nodeStatusClass = "";
                if (isCompleted) nodeStatusClass = "journey-node-completed";
                if (isActiveProgression) nodeStatusClass = "journey-node-active";

                return (
                  <m.div key={lesson.id} variants={popIn} layout className={`journey-node ${nodeStatusClass}`}>
                    <div className="journey-node-index">{index + 1}</div>
                    <div style={{ width: "100%", maxWidth: "340px", transform: isActiveProgression && !prefersReducedMotion ? "scale(1.02)" : "scale(1)", transition: "transform 0.3s" }} className={isActiveProgression ? "animate-pulse-glow" : ""}>
                      <LessonCompletionCard
                        childId={activeChild.id}
                        lessonId={lesson.id}
                        title={lesson.title}
                        objective={lesson.objective}
                        estimatedMinutes={lesson.estimatedMinutes}
                        videoSource={lesson.videoSource}
                      />
                    </div>
                  </m.div>
                );
              })}
              {!loadingLessons && lessons.length === 0 ? (
                <m.div className="list-item" variants={popIn}>
                  <span>Chưa có bài học phù hợp cho hồ sơ này.</span>
                </m.div>
              ) : null}
            </m.div>
          </AnimatePresence>
        </m.section>

        {/* Mascot Character Guide */}
        <AnimatePresence>
          {!loadingLessons && (
            <m.div
              className="mascot-container"
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            >
              <AnimatePresence mode="wait">
                <m.div
                  key={mascotMessage}
                  className="mascot-bubble"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {mascotMessage}
                </m.div>
              </AnimatePresence>
              <m.div
                className="mascot-avatar animate-wiggle"
                onClick={handleMascotClick}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                role="button"
                aria-label="Nhân vật hướng dẫn hỗ trợ trẻ em"
              >
                🦉
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </KidMotionProvider>
  );
}
