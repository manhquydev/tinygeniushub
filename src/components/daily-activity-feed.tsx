"use client";

import { BookOpenCheck, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DailyGoalSetter } from "@/components/daily-goal-setter";
import { Mascot } from "@/components/mascot";

type ChildSummary = {
  id: string;
  nickname: string;
};

type ActivityItem = {
  id: string;
  minutesLearned: number;
  quizScore: number;
  completedAt: string;
  lesson: {
    id: string;
    title: string;
  };
};

type FeedState = {
  loading: boolean;
  error: string | null;
  activities: ActivityItem[];
  dailyGoalMinutes: number;
  totalMinutesToday: number;
};

type ActivityResponse = {
  ok: boolean;
  data?: {
    activities: ActivityItem[];
    dailyGoalMinutes: number;
    totalMinutesToday: number;
  };
  error?: {
    message?: string;
  };
};

interface DailyActivityFeedProps {
  childProfiles: ChildSummary[];
}

function getInitialState(children: ChildSummary[]): Record<string, FeedState> {
  return children.reduce<Record<string, FeedState>>((acc, child) => {
    acc[child.id] = {
      loading: true,
      error: null,
      activities: [],
      dailyGoalMinutes: 20,
      totalMinutesToday: 0,
    };

    return acc;
  }, {});
}

function formatTime(value: string, locale: string) {
  return new Date(value).toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimestamp(value: string, locale: string) {
  return new Date(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl border border-slate-200 bg-white/80 p-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function DailyActivityFeed({ childProfiles }: DailyActivityFeedProps) {
  const t = useTranslations("parent.dashboard.activity");
  const locale = useLocale();
  const [feedByChild, setFeedByChild] = useState<Record<string, FeedState>>(() => getInitialState(childProfiles));

  useEffect(() => {
    let active = true;

    if (childProfiles.length === 0) {
      setFeedByChild({});
      return () => {
        active = false;
      };
    }

    setFeedByChild(getInitialState(childProfiles));

    void Promise.all(
      childProfiles.map(async (child) => {
        try {
          const response = await fetch(`/api/children/${encodeURIComponent(child.id)}/activity-today`, {
            method: "GET",
            cache: "no-store",
          });
          const body = (await response.json()) as ActivityResponse;

          if (!response.ok || !body.ok) {
            throw new Error(body.error?.message ?? t("loadError"));
          }

          if (!active) {
            return;
          }

          setFeedByChild((current) => ({
            ...current,
            [child.id]: {
              loading: false,
              error: null,
              activities: body.data?.activities ?? [],
              dailyGoalMinutes: body.data?.dailyGoalMinutes ?? 20,
              totalMinutesToday: body.data?.totalMinutesToday ?? 0,
            },
          }));
        } catch (error) {
          if (!active) {
            return;
          }

          setFeedByChild((current) => ({
            ...current,
            [child.id]: {
              loading: false,
              error: error instanceof Error ? error.message : t("unknownError"),
              activities: [],
              dailyGoalMinutes: 20,
              totalMinutesToday: 0,
            },
          }));
        }
      }),
    );

    return () => {
      active = false;
    };
  }, [childProfiles, t]);

  const orderedChildren = useMemo(
    () => [...childProfiles].sort((a, b) => a.nickname.localeCompare(b.nickname, locale)),
    [childProfiles, locale],
  );

  if (orderedChildren.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">{t("heading")}</h2>
        <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          {t("emptyProfiles")}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">{t("heading")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("description")}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {t("timezone")}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {orderedChildren.map((child) => {
          const state = feedByChild[child.id] ?? {
            loading: true,
            error: null,
            activities: [],
            dailyGoalMinutes: 20,
            totalMinutesToday: 0,
          };

          return (
            <article key={child.id} className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-black tracking-[-0.01em] text-slate-900">{child.nickname}</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">{t("today")}</span>
              </div>

              <div className="mt-3">
                {state.loading ? <LoadingSkeleton /> : null}
                {!state.loading && state.error ? <p className="text-sm font-medium text-red-700">{state.error}</p> : null}

                {!state.loading && !state.error ? (
                  <div className="mb-3">
                    <DailyGoalSetter
                      childId={child.id}
                      totalMinutesToday={state.totalMinutesToday}
                      dailyGoalMinutes={state.dailyGoalMinutes}
                      onDailyGoalChange={(minutes) => {
                        setFeedByChild((current) => ({
                          ...current,
                          [child.id]: {
                            ...(current[child.id] ?? state),
                            dailyGoalMinutes: minutes,
                          },
                        }));
                      }}
                    />
                  </div>
                ) : null}

                {!state.loading && !state.error && state.activities.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
                    <div className="mx-auto mb-2 w-fit">
                      <Mascot variant="small" state="sleepy" size={120} actionProp="none" motionLevel="minimal" pauseWhenOffscreen />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{t("noLessons")}</p>
                    <p className="mt-1 text-xs text-slate-500">{t("restHint")}</p>
                  </div>
                ) : null}

                {!state.loading && !state.error && state.activities.length > 0 ? (
                  <ol className="space-y-3">
                    {state.activities.map((activity) => (
                      <li key={activity.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <BookOpenCheck size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900">{activity.lesson.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <Clock3 size={13} />
                                {formatTime(activity.completedAt, locale)}
                              </span>
                              <span>• {t("minutesLearned", { n: activity.minutesLearned })}</span>
                              <span>• {t("quiz", { score: activity.quizScore })}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {t("completedAt", { time: formatTimestamp(activity.completedAt, locale) })}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

