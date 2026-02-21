"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Play, CheckCircle, Video, Check, ArrowRight, X } from "lucide-react";
import confetti from "canvas-confetti";

// Free, safe base64 silent wav snippet (prevent NotSupportedError)
const YAY_SOUND = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const TING_SOUND = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="; // placeholder for Ting

const playSound = (base64Sound: string) => {
    if (typeof window === "undefined") return;
    try {
        const audio = new Audio();
        audio.src = base64Sound;
        audio.volume = 0.5;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => { });
        }
    } catch { }
};

const EvidenceUploadPanel = dynamic(
    () => import("@/components/evidence-upload-panel").then((module) => module.EvidenceUploadPanel),
    { loading: () => <p className="text-white">Đang tải...</p> },
);

interface LessonWizardFlowProps {
    childId: string;
    lessonId: string;
    title: string;
    objective: string;
    estimatedMinutes: number;
    videoSource?: string | null;
    onClose: () => void;
}

interface WatchSessionPayload {
    watchRequired: boolean;
    requiredWatchSeconds: number;
    heartbeatIntervalSeconds: number;
    sessionToken: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
}

export function LessonWizardFlow({
    childId,
    lessonId,
    title,
    objective,
    estimatedMinutes,
    videoSource,
    onClose,
}: LessonWizardFlowProps) {
    const prefersReducedMotion = useReducedMotion();
    const [step, setStep] = useState(0); // 0: Intro, 1: Video, 2: Quiz, 3: Upload, 4: Done
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Video Tracking State
    const [watchSessionLoading, setWatchSessionLoading] = useState(false);
    const [watchLoading, setWatchLoading] = useState(false);
    const [watchReady, setWatchReady] = useState(false);
    const [watchInfo, setWatchInfo] = useState<string | null>(null);
    const [requiredWatchSeconds, setRequiredWatchSeconds] = useState(estimatedMinutes * 60);
    const [watchedSeconds, setWatchedSeconds] = useState(0);
    const [watchSessionToken, setWatchSessionToken] = useState<string | null>(null);
    const [watchSessionStartedAtMs, setWatchSessionStartedAtMs] = useState<number | null>(null);
    const [watchSessionExpiresAtMs, setWatchSessionExpiresAtMs] = useState<number | null>(null);
    const [watchHeartbeatIntervalSeconds, setWatchHeartbeatIntervalSeconds] = useState(5);
    const [watchHeartbeatSequence, setWatchHeartbeatSequence] = useState(0);
    const heartbeatInFlightRef = useRef(false);
    const watchRequired = Boolean(videoSource);
    const watchProgressPercentage = watchRequired
        ? Math.min(100, Math.round((watchedSeconds / Math.max(1, requiredWatchSeconds)) * 100))
        : 100;

    // Quiz State
    const [quizAnswered, setQuizAnswered] = useState(false);

    // API tracking logic mirrors the old component
    const applyWatchResult = useCallback(
        (watchResult: { readyForCompletion?: boolean; requiredWatchSeconds?: number; watchedSeconds?: number }) => {
            const required = typeof watchResult.requiredWatchSeconds === "number" ? watchResult.requiredWatchSeconds : requiredWatchSeconds;
            const watched = typeof watchResult.watchedSeconds === "number" ? watchResult.watchedSeconds : watchedSeconds;
            setRequiredWatchSeconds(required);
            setWatchedSeconds(watched);
            if (watchResult.readyForCompletion) {
                setWatchReady(true);
            }
        },
        [requiredWatchSeconds, watchedSeconds],
    );

    async function startWatchSession() {
        if (!watchRequired) return;
        setWatchSessionLoading(true);
        setStatus(null);
        try {
            const response = await fetch(`/api/lessons/${lessonId}/watch/session`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ childId }),
            });
            const body = await response.json();
            if (!response.ok || !body.ok) return;

            const session = body.data?.session as WatchSessionPayload | undefined;
            if (!session?.watchRequired || !session.sessionToken || !session.issuedAt || !session.expiresAt) return;

            setWatchSessionToken(session.sessionToken);
            setWatchHeartbeatIntervalSeconds(session.heartbeatIntervalSeconds);
            setRequiredWatchSeconds(session.requiredWatchSeconds);
            setWatchedSeconds(0);
            setWatchReady(false);
            setWatchSessionStartedAtMs(new Date(session.issuedAt).getTime());
            setWatchSessionExpiresAtMs(new Date(session.expiresAt).getTime());
            setWatchHeartbeatSequence(0);
        } catch { } finally { setWatchSessionLoading(false); }
    }

    const sendWatchHeartbeat = useCallback(
        async (nextSequence: number) => {
            if (!watchRequired || !watchSessionToken || watchReady) return;
            if (watchSessionExpiresAtMs && Date.now() > watchSessionExpiresAtMs) return;
            if (heartbeatInFlightRef.current) return;
            heartbeatInFlightRef.current = true;
            try {
                const response = await fetch(`/api/lessons/${lessonId}/watch/heartbeat`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ childId, sessionToken: watchSessionToken, sequence: nextSequence }),
                });
                const body = await response.json();
                if (!response.ok || !body.ok) return;
                const watchResult = body.data?.watch;
                if (!watchResult) return;
                setWatchHeartbeatSequence(nextSequence);
                applyWatchResult(watchResult);
            } catch { } finally { heartbeatInFlightRef.current = false; }
        },
        [applyWatchResult, childId, lessonId, watchReady, watchRequired, watchSessionExpiresAtMs, watchSessionToken],
    );

    useEffect(() => {
        if (!watchRequired || !watchSessionToken || watchReady) return;
        const intervalMs = Math.max(1000, watchHeartbeatIntervalSeconds * 1000);
        const timer = window.setInterval(() => { void sendWatchHeartbeat(watchHeartbeatSequence + 1); }, intervalMs);
        return () => { window.clearInterval(timer); };
    }, [sendWatchHeartbeat, watchHeartbeatIntervalSeconds, watchHeartbeatSequence, watchReady, watchRequired, watchSessionToken]);

    async function markVideoWatched() {
        if (!watchRequired) return true;
        if (!watchSessionToken) return false;
        setWatchLoading(true);
        let success = false;
        try {
            const response = await fetch(`/api/lessons/${lessonId}/watch/record`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ childId, sessionToken: watchSessionToken }),
            });
            const body = await response.json();
            if (response.ok && body.ok) {
                setWatchReady(true);
                success = true;
            }
        } catch { } finally { setWatchLoading(false); }
        return success;
    }

    async function markCompleted() {
        setLoading(true);
        setStatus(null);
        try {
            const response = await fetch(`/api/lessons/${lessonId}/complete`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    childId,
                    quizScore: 100,
                    minutesLearned: estimatedMinutes,
                    checklist: ["watch_done", "activity_done", "offline_done"],
                    useExtendedRetention: true,
                }),
            });
            const body = await response.json();
            if (!response.ok || !body.ok) return;

            playSound(YAY_SOUND);
            const duration = 2500;
            const end = Date.now() + duration;
            const frame = () => {
                confetti({ particleCount: 15, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'] });
                confetti({ particleCount: 15, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'] });
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
            setStep(4); // Celebration
        } catch { } finally { setLoading(false); }
    }

    // Next Step Handlers
    const handleNextToVideo = () => {
        setStep(1);
        startWatchSession();
    };

    const handleNextToQuiz = async () => {
        if (watchRequired && !watchReady) {
            const recorded = await markVideoWatched();
            if (!recorded) return; // Wait
        }
        setStep(2);
    };

    const handleQuizAnswer = () => {
        playSound(TING_SOUND);
        setQuizAnswered(true);
        setTimeout(() => {
            setStep(3); // Move to upload after short delay
        }, 1000);
    };

    const handleFinish = () => {
        markCompleted();
    };

    return (
        <m.div
            className="fixed inset-0 z-[100] flex flex-col bg-brand-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Immersive Header */}
            <div className="flex items-center justify-between p-6 px-8 bg-white/50 backdrop-blur-md border-b-2 border-brand-100/50">
                <h2 className="text-2xl font-bold text-brand-700 font-display">{title}</h2>
                <button
                    onClick={onClose}
                    className="flex items-center justify-center p-3 text-brand-500 bg-white rounded-full shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                    <X size={28} strokeWidth={3} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <AnimatePresence mode="wait">

                    {/* STEP 0: INTRO */}
                    {step === 0 && (
                        <m.div
                            key="step0"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="max-w-xl w-full text-center flex flex-col items-center gap-6"
                        >
                            <div className="w-32 h-32 bg-brand-200 rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-4">
                                <Play size={48} className="text-brand-600 ml-2" />
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black text-brand-800 tracking-tight leading-tight">
                                Sẵn sàng học chưa nào?
                            </h1>
                            <p className="text-xl text-ink-600 mb-8 max-w-md mx-auto">{objective}</p>

                            <button
                                onClick={handleNextToVideo}
                                className="solid-button text-2xl px-12 py-5 rounded-full shadow-xl shadow-brand-500/20 hover:-translate-y-1 transition-transform"
                                style={{ backgroundColor: "var(--brand-500)", color: "white" }}
                            >
                                Bắt đầu ngay!
                            </button>
                        </m.div>
                    )}

                    {/* STEP 1: VIDEO */}
                    {step === 1 && (
                        <m.div
                            key="step1"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="max-w-4xl w-full flex flex-col gap-6"
                        >
                            <div className="w-full aspect-video bg-ink-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center relative">
                                {videoSource ? (
                                    <iframe src={videoSource} className="w-full h-full border-none" allowFullScreen />
                                ) : (
                                    <p className="text-xl text-white">Không có video cho bài này</p>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border-2 border-brand-100">
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between text-sm font-bold text-brand-600 mb-2">
                                        <span>Tiến độ xem</span>
                                        <span>{watchProgressPercentage}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-brand-100 rounded-full overflow-hidden">
                                        <m.div
                                            className="h-full bg-brand-500 rounded-full"
                                            initial={false}
                                            animate={{ width: `${watchProgressPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleNextToQuiz}
                                    disabled={watchRequired && !watchReady && watchProgressPercentage < 90}
                                    className="solid-button whitespace-nowrap px-8 py-4 rounded-full flex items-center gap-3 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: (watchRequired && !watchReady && watchProgressPercentage < 90) ? "var(--surface-300)" : "var(--brand-500)" }}
                                >
                                    Tiếp tục {watchLoading ? "..." : <ArrowRight />}
                                </button>
                            </div>
                        </m.div>
                    )}

                    {/* STEP 2: MINI QUIZ */}
                    {step === 2 && (
                        <m.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -40 }}
                            className="max-w-3xl w-full text-center"
                        >
                            <h2 className="text-4xl font-black text-ink-800 mb-12">Đố bé biết nhé!</h2>
                            <p className="text-xl text-ink-600 mb-8">Bé vừa học về chủ đề gì nào?</p>

                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    onClick={handleQuizAnswer}
                                    className={`p-10 rounded-3xl border-4 transition-all ${quizAnswered ? "border-green-500 bg-green-50 shadow-green-500/30 scale-105" : "border-surface-200 bg-white hover:border-brand-300 hover:shadow-xl"}`}
                                >
                                    <div className="w-32 h-32 mx-auto bg-brand-100 rounded-full mb-6 flex items-center justify-center">
                                        <CheckCircle size={64} className={quizAnswered ? "text-green-500" : "text-brand-400"} />
                                    </div>
                                    <span className="text-2xl font-bold text-ink-700">Chủ đề đúng</span>
                                </button>
                                <button
                                    className="p-10 rounded-3xl border-4 border-surface-200 bg-white hover:border-red-300 transition-all opacity-80"
                                >
                                    <div className="w-32 h-32 mx-auto bg-surface-100 rounded-full mb-6"></div>
                                    <span className="text-2xl font-bold text-ink-700">Chủ đề khác</span>
                                </button>
                            </div>
                        </m.div>
                    )}

                    {/* STEP 3: UPLOAD */}
                    {step === 3 && (
                        <m.div
                            key="step3"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="max-w-2xl w-full bg-white p-10 rounded-3xl shadow-xl shadow-brand-500/10 border-4 border-brand-100 flex flex-col gap-8"
                        >
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-brand-700 mb-2">Gửi kết quả cho Thầy Cô nha!</h2>
                                <p className="text-ink-500 text-lg">Nhờ Ba Mẹ chụp lại bài làm của con đính kèm vào đây nhé.</p>
                            </div>

                            <div className="bg-surface-50 p-6 rounded-2xl border-2 border-dashed border-surface-200">
                                <EvidenceUploadPanel childId={childId} lessonId={lessonId} />
                            </div>

                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className="solid-button w-full py-5 text-2xl rounded-full shadow-lg"
                                style={{ backgroundColor: "var(--brand-500)" }}
                            >
                                {loading ? "Đang gửi..." : "Hoàn thành nhiệm vụ!"}
                            </button>
                        </m.div>
                    )}

                    {/* STEP 4: CELEBRATION */}
                    {step === 4 && (
                        <m.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                            className="max-w-xl w-full text-center flex flex-col items-center gap-8"
                        >
                            <div className="w-48 h-48 bg-yellow-100 rounded-full flex items-center justify-center border-8 border-white shadow-2xl relative">
                                <span className="text-6xl absolute z-10">🌟</span>
                            </div>

                            <div>
                                <h1 className="text-5xl font-black text-brand-700 mb-4 tracking-tight drop-shadow-sm">
                                    Tuyệt Vời!
                                </h1>
                                <p className="text-2xl text-ink-600">Con đã hoàn thành xuất sắc nhiệm vụ hôm nay!</p>
                            </div>

                            <button
                                onClick={onClose}
                                className="solid-button text-xl px-10 py-4 mt-6 rounded-full shadow-xl flex items-center gap-3 bg-brand-600 hover:bg-brand-700"
                            >
                                <Check size={24} /> Quay lại bản đồ
                            </button>
                        </m.div>
                    )}

                </AnimatePresence>
            </div>
        </m.div>
    );
}
