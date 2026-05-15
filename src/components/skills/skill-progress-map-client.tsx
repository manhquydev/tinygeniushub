"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Brain, LockKeyhole, Sparkles, TrendingUp } from "lucide-react";
import { AdaptiveLearningToggle } from "@/components/skills/adaptive-learning-toggle";

type SkillDomain = "MATH" | "ENGLISH_PHONICS";
type MasteryLevel = "NOT_STARTED" | "NOVICE" | "DEVELOPING" | "PROFICIENT" | "MASTERED";

type SkillItem = {
  id: string;
  code: string;
  nameVi: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  isLocked: boolean;
  totalAttempts: number;
};

type DomainBlock = {
  domain: SkillDomain;
  title: string;
  subtitle: string;
  skills: SkillItem[];
};

type SkillProgressMapClientProps = {
  childId: string;
  childName: string;
  initialAdaptiveEnabled: boolean;
};

const MASTERY_META: Record<
  MasteryLevel,
  { label: string; badgeClass: string; barClass: string }
> = {
  NOT_STARTED: {
    label: "Haven't started yet",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-500",
    barClass: "from-slate-300 to-slate-400",
  },
  NOVICE: {
    label: "Just learned",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-600",
    barClass: "from-orange-400 to-amber-500",
  },
  DEVELOPING: {
    label: "Developing",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    barClass: "from-amber-400 to-yellow-500",
  },
  PROFICIENT: {
    label: "Proficient",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    barClass: "from-emerald-400 to-teal-500",
  },
  MASTERED: {
    label: "Excellent",
    badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-700",
    barClass: "from-cyan-400 to-sky-500",
  },
};

const DOMAIN_BLOCKS: DomainBlock[] = [
  {
    domain: "MATH",
    title: "Mental math",
    subtitle: "Number foundations and calculations for grades 1-3",
    skills: [
      {
        id: "mock-math-counting",
        code: "MATH_COUNTING",
        nameVi: "Count numbers",
        masteryScore: 0.85,
        masteryLevel: "PROFICIENT",
        isLocked: false,
        totalAttempts: 32,
      },
      {
        id: "mock-math-add",
        code: "MATH_ADDITION",
        nameVi: "Addition",
        masteryScore: 0.62,
        masteryLevel: "DEVELOPING",
        isLocked: false,
        totalAttempts: 26,
      },
      {
        id: "mock-math-sub",
        code: "MATH_SUBTRACTION",
        nameVi: "Subtraction",
        masteryScore: 0.41,
        masteryLevel: "DEVELOPING",
        isLocked: false,
        totalAttempts: 18,
      },
      {
        id: "mock-math-geo",
        code: "MATH_GEOMETRY",
        nameVi: "Geometry",
        masteryScore: 0,
        masteryLevel: "NOT_STARTED",
        isLocked: true,
        totalAttempts: 0,
      },
      {
        id: "mock-math-measure",
        code: "MATH_MEASUREMENT",
        nameVi: "Measurement",
        masteryScore: 0,
        masteryLevel: "NOT_STARTED",
        isLocked: true,
        totalAttempts: 0,
      },
    ],
  },
  {
    domain: "ENGLISH_PHONICS",
    title: "English Phonics",
    subtitle: "Phonemes, background vocabulary and basic pronunciation",
    skills: [
      {
        id: "mock-phonics-alpha",
        code: "PHONICS_ALPHABET",
        nameVi: "Alphabet",
        masteryScore: 0.95,
        masteryLevel: "MASTERED",
        isLocked: false,
        totalAttempts: 34,
      },
      {
        id: "mock-phonics-cvc",
        code: "PHONICS_CVC",
        nameVi: "CVC words",
        masteryScore: 0.68,
        masteryLevel: "DEVELOPING",
        isLocked: false,
        totalAttempts: 21,
      },
      {
        id: "mock-phonics-blends",
        code: "PHONICS_BLENDS",
        nameVi: "Blends",
        masteryScore: 0.22,
        masteryLevel: "NOVICE",
        isLocked: false,
        totalAttempts: 9,
      },
      {
        id: "mock-phonics-digraphs",
        code: "PHONICS_DIGRAPHS",
        nameVi: "Digraphs",
        masteryScore: 0,
        masteryLevel: "NOT_STARTED",
        isLocked: true,
        totalAttempts: 0,
      },
    ],
  },
];

const WEEKLY_TREND_DATA = [
  { week: "T1", math: 32, phonics: 39 },
  { week: "T2", math: 41, phonics: 48 },
  { week: "T3", math: 49, phonics: 57 },
  { week: "T4", math: 58, phonics: 66 },
  { week: "T5", math: 63, phonics: 72 },
];

const RADAR_DATA = [
  { skill: "Count numbers", score: 85 },
  { skill: "Add/Subtract", score: 62 },
  { skill: "Geometry", score: 28 },
  { skill: "Alphabet", score: 95 },
  { skill: "CVC", score: 68 },
  { skill: "Blends", score: 22 },
];

export function SkillProgressMapClient({
  childId,
  childName,
  initialAdaptiveEnabled,
}: SkillProgressMapClientProps) {
  return (
    <div className="page-stack">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-5 text-white shadow-[0_20px_48px_rgba(8,47,73,0.35)] sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.34)_0%,transparent_45%),radial-gradient(circle_at_88%_82%,rgba(14,165,233,0.34)_0%,transparent_42%)]"
        />
        <div className="relative z-10 grid gap-3">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
            <Sparkles className="h-3.5 w-3.5" />
            Skill Progress Map
          </p>
          <h1 className="text-2xl font-black tracking-[-0.02em] sm:text-3xl">
            {childName}'s skill map
          </h1>
          <p className="max-w-[65ch] text-sm text-cyan-50 sm:text-base">
            UI mock version to test the experience. When the backend is complete, the data will be replaced with the real API.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <TrendingUp className="h-4 w-4 text-cyan-600" />
            <h2 className="text-sm font-bold uppercase tracking-[0.08em]">5-week progress rhythm</h2>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="math" stroke="#0891b2" strokeWidth={2.8} dot={{ r: 3 }} name="Maths" />
                <Line type="monotone" dataKey="phonics" stroke="#0ea5e9" strokeWidth={2.8} dot={{ r: 3 }} name="Phonics" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-[0.08em]">Proficiency by cluster</h2>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#dbeafe" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#475569" }} />
                <Radar
                  name="Mastery"
                  dataKey="score"
                  stroke="#14b8a6"
                  fill="#2dd4bf"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <AdaptiveLearningToggle childId={childId} initialEnabled={initialAdaptiveEnabled} />

      <section className="grid gap-4 lg:grid-cols-2">
        {DOMAIN_BLOCKS.map((block) => {
          const unlocked = block.skills.filter((item) => !item.isLocked);
          const progress =
            unlocked.length === 0
              ? 0
              : Math.round(
                  (unlocked.reduce((sum, item) => sum + item.masteryScore, 0) / unlocked.length) * 100,
                );
          return (
            <article
              key={block.domain}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
            >
              <header className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{block.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{block.subtitle}</p>
                  </div>
                  <div className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {progress}%
                  </div>
                </div>
              </header>

              <ul className="divide-y divide-slate-100">
                {block.skills.map((skill) => (
                  <li key={skill.id} className="px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{skill.nameVi}</p>
                        <p className="text-xs text-slate-400">{skill.totalAttempts} practice attempts</p>
                      </div>

                      {skill.isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                          <LockKeyhole className="h-3 w-3" />
                          Locked
                        </span>
                      ) : (
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${MASTERY_META[skill.masteryLevel].badgeClass}`}
                        >
                          {MASTERY_META[skill.masteryLevel].label}
                        </span>
                      )}
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${MASTERY_META[skill.masteryLevel].barClass}`}
                        style={{ width: `${Math.round(skill.masteryScore * 100)}%` }}
                      />
                    </div>

                    {!skill.isLocked && (
                      <div className="mt-2">
                        <Link
                          href={`/parent/dashboard/${encodeURIComponent(childId)}/skills/${encodeURIComponent(skill.id)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 transition-colors hover:text-cyan-900"
                        >
                          <Brain className="h-3.5 w-3.5" />
                          View skill details
                        </Link>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </div>
  );
}

