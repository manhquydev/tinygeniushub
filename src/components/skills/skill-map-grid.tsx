/**
 * SkillMapGrid - displays a list of skills with progress bars and locked state.
 * Mobile-first grid layout.
 */

import Link from "next/link";
import type { MasteryLevel, SkillDomain } from "@prisma/client";
import { MasteryBadge } from "./mastery-badge";

interface SkillEntry {
  id: string;
  nameVi: string;
  iconEmoji: string | null;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  isLocked: boolean;
  totalAttempts: number;
}

interface SkillMapGridProps {
  childId: string;
  domain: SkillDomain;
  overallProgress: number;
  masteredCount: number;
  totalSkills: number;
  skills: SkillEntry[];
}

const DOMAIN_LABELS: Record<SkillDomain, string> = {
  MATH: "Toán Tư Duy",
  ENGLISH_PHONICS: "Tiếng Anh Phonics",
};

export function SkillMapGrid({ childId, domain, overallProgress, masteredCount, totalSkills, skills }: SkillMapGridProps) {
  const pct = Math.round(overallProgress * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Domain header */}
      <div className="bg-gradient-to-r from-slate-50 to-white px-4 py-3 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 text-base">{DOMAIN_LABELS[domain]}</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {masteredCount}/{totalSkills} kỹ năng thành thạo · {pct}% tổng tiến độ
        </p>
      </div>

      {skills.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-slate-400 text-sm">Chưa có kỹ năng nào. Bắt đầu làm bài kiểm tra để xem bản đồ kỹ năng!</p>
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {skills.map((skill) => (
          <li key={skill.id}>
            {skill.isLocked ? (
              <LockedSkillRow skill={skill} />
            ) : (
              <Link href={`/parent/dashboard/${childId}/skills/${skill.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <UnlockedSkillRow skill={skill} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnlockedSkillRow({ skill }: { skill: SkillEntry }) {
  const pct = Math.round(skill.masteryScore * 100);
  return (
    <div className="flex items-center gap-3 w-full min-w-0">
      <span className="text-xl flex-shrink-0">{skill.iconEmoji ?? "📚"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-slate-800 truncate">{skill.nameVi}</span>
          <MasteryBadge level={skill.masteryLevel} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: progressColor(skill.masteryLevel) }}
            />
          </div>
          <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
        </div>
      </div>
      <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function LockedSkillRow({ skill }: { skill: SkillEntry }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
      <span className="text-xl flex-shrink-0">{skill.iconEmoji ?? "📚"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-slate-500 truncate">{skill.nameVi}</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">🔒 Chưa mở</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

function progressColor(level: MasteryLevel): string {
  const map: Record<MasteryLevel, string> = {
    NOT_STARTED: "#e2e8f0",
    NOVICE:      "#f97316",
    DEVELOPING:  "#eab308",
    PROFICIENT:  "#22c55e",
    MASTERED:    "#a855f7",
  };
  return map[level];
}
