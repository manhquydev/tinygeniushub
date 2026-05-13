"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Rocket, Sparkles, Star } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Mascot } from "@/components/mascot";
import { KID_AVATAR_OPTIONS, type KidAvatarId } from "@/components/mascot/kid-avatar-options";
import type { MascotVariant } from "@/components/mascot/types";

type SetupStep = 1 | 2 | 3;

type OnboardingCompleteResponse = {
  ok: boolean;
  data?: {
    child: {
      id: string;
      nickname: string;
      ageBand: string;
      avatarId: string | null;
    };
  };
  error?: {
    message?: string;
  };
};

interface ParentSetupFlowProps {
  parentDisplayName: string;
}

const AVATAR_MASCOT_BY_ID: Record<KidAvatarId, MascotVariant> = {
  basic: "small",
  "girl-bow": "sister",
  "nerdy-glasses": "big",
  "sporty-cap": "dad",
  "astro-helmet": "baby",
};

function resolveMascotVariant(avatarId: KidAvatarId): MascotVariant {
  return AVATAR_MASCOT_BY_ID[avatarId] ?? "small";
}

async function triggerConfettiBurst() {
  const confettiModule = await import("canvas-confetti");
  const confetti = confettiModule.default;

  confetti({
    particleCount: 130,
    spread: 96,
    origin: { y: 0.62 },
    startVelocity: 42,
    scalar: 0.9,
  });

  confetti({
    particleCount: 70,
    spread: 68,
    origin: { x: 0.18, y: 0.72 },
    startVelocity: 35,
  });

  confetti({
    particleCount: 70,
    spread: 68,
    origin: { x: 0.82, y: 0.72 },
    startVelocity: 35,
  });
}

export function ParentSetupFlow({ parentDisplayName }: ParentSetupFlowProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [step, setStep] = useState<SetupStep>(1);
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState<KidAvatarId>(KID_AVATAR_OPTIONS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("");

  const selectedAvatar = useMemo(
    () => KID_AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId) ?? KID_AVATAR_OPTIONS[0],
    [avatarId],
  );
  const nicknameTrimmed = nickname.trim();
  const canContinueStepOne = nicknameTrimmed.length >= 1;

  function goToStepTwo() {
    if (!canContinueStepOne) {
      setError("Please enter your baby's nickname.");
      return;
    }

    setError(null);
    setStep(2);
  }

  async function completeOnboarding() {
    if (!canContinueStepOne) {
      setError("Please enter your baby's nickname.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nickname: nicknameTrimmed,
          avatarId,
        }),
      });

      const body = (await response.json()) as OnboardingCompleteResponse;
      if (!response.ok || !body.ok || !body.data?.child) {
        setError(body.error?.message ?? "Setup could not be completed. Please try again.");
        return;
      }

      setChildName(body.data.child.nickname);
      await triggerConfettiBurst();
      setStep(3);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error.");
    } finally {
      setSubmitting(false);
    }
  }

  function continueToDashboard() {
    router.push("/parent/dashboard");
    router.refresh();
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(20,184,166,0.14)_0%,transparent_42%),radial-gradient(circle_at_86%_88%,rgba(14,165,233,0.14)_0%,transparent_38%)]"
      />

      <div className="relative z-[1] grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-[0_12px_30px_rgba(15,23,42,0.4)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Setup assistant</p>
          <div className="mt-3 flex justify-center rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3">
            <Mascot
              variant="duo"
              state="happy"
              parentState={step === 3 ? "celebrating" : "proud"}
              childState={step === 2 ? "playful" : "happy"}
              parentActionProp={step === 3 ? "magic" : "reading"}
              childActionProp={step === 3 ? "heart" : "none"}
              size={210}
              motionLevel="full"
              pauseWhenOffscreen
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            Hi {parentDisplayName}. Just 3 short steps and the control panel will be ready for your baby.
          </p>
          <div className="mt-4 grid gap-2">
            {[1, 2, 3].map((index) => {
              const active = step === index;
              const done = step > index;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    done
                      ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
                      : active
                        ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100"
                        : "border-slate-700/70 bg-slate-800/60 text-slate-300"
                  }`}
                >
                  {done ? <CheckCircle2 size={16} /> : <Star size={16} />}
                  <span className="font-semibold">
                    {index === 1 ? "Name your baby" : index === 2 ? "Choose an avatar" : "Complete setup"}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          {step === 1 ? (
            <div className="space-y-4">
              <header>
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  <Sparkles size={14} />
                  Step 1/3
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] text-slate-900">What's your baby's name?</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  This name will be displayed in dashboards and learning reports.
                </p>
              </header>

              <div className="space-y-2">
                <label htmlFor="setup-child-nickname" className="text-sm font-semibold text-slate-700">
                  Baby's nickname
                </label>
                <input
                  id="setup-child-nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="For example: Anna, Bong, Bin..."
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  autoFocus
                  maxLength={60}
                />
                <p className="text-xs text-slate-500">You can change this name in your Baby's Profile page at any time.</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={goToStepTwo}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <header>
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  <Rocket size={14} />
                  Step 2/3
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] text-slate-900">
                  Choose an avatar cho {nicknameTrimmed || "little"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Choose your child's favorite mascot to personalize their learning journey right from the start.
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {KID_AVATAR_OPTIONS.map((avatar) => {
                  const selected = avatar.id === avatarId;
                  const mascotVariant = resolveMascotVariant(avatar.id);
                  const mascotState = selected ? "playful" : "happy";

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setAvatarId(avatar.id)}
                      className={`rounded-2xl border bg-white p-3 text-left transition ${
                        selected
                          ? "border-teal-400 shadow-[0_10px_20px_rgba(13,148,136,0.18)] ring-2 ring-teal-300/70"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      aria-label={`Choose character${avatar.label}`}
                    >
                      <m.div
                        animate={
                          prefersReducedMotion
                            ? { y: 0, scale: 1 }
                            : { y: selected ? -6 : 0, scale: selected ? [1, 1.05, 1.02] : 1 }
                        }
                        transition={
                          prefersReducedMotion
                            ? undefined
                            : selected
                              ? { type: "spring", stiffness: 360, damping: 20 }
                              : { type: "spring", stiffness: 320, damping: 24 }
                        }
                        className="mx-auto flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-1"
                      >
                        <Mascot
                          variant={mascotVariant}
                          state={mascotState}
                          size={94}
                          motionLevel={prefersReducedMotion ? "minimal" : "full"}
                          showBaseGlow={false}
                          title={avatar.label}
                        />
                      </m.div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{avatar.label}</p>
                      <p className="text-xs text-slate-500">{avatar.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                Selected character: <span className="font-bold text-slate-900">{selectedAvatar.label}</span>
              </div>

              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
                >
                  <ChevronLeft size={16} />
                  Come back
                </button>
                <button
                  type="button"
                  onClick={completeOnboarding}
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Initializing..." : "Complete setup"}
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={30} />
              </div>
              <div className="space-y-1">
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Step 3/3 - Complete
                </p>
                <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Congratulations! Setup is complete</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Profile for <span className="font-bold text-slate-900">{childName || nicknameTrimmed}</span> is ready. The dashboard will show data and learning suggestions now.
                </p>
              </div>
              <button
                type="button"
                onClick={continueToDashboard}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5"
              >
                Go to the parent dashboard
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}

          {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
