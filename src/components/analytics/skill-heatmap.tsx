"use client";

/**
 * SkillHeatmap - Teacher view for class skill mastery grid.
 * Color-coded: green (>70%), yellow (40-70%), red (<40%), gray (no data).
 */

import type { MasteryLevel } from "@prisma/client";

interface SkillInfo {
  id: string;
  code: string;
  nameVi: string;
}

interface StudentRow {
  childId: string;
  nickname: string;
  skillMasteries: Array<{ skillId: string; masteryLevel: MasteryLevel; score: number }>;
}

interface Props {
  skills: SkillInfo[];
  students: StudentRow[];
  classAverages: Array<{ skillId: string; avgScore: number }>;
}

function getColor(score: number, hasData: boolean): string {
  if (!hasData) return "bg-gray-100 text-gray-400";
  if (score >= 0.7) return "bg-green-100 text-green-800";
  if (score >= 0.4) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-700";
}

function scoreLabel(score: number, hasData: boolean): string {
  if (!hasData) return "–";
  return `${Math.round(score * 100)}%`;
}

export function SkillHeatmap({ skills, students, classAverages }: Props) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Not enough data — students haven't practiced any skills in class.
      </div>
    );
  }

  const avgMap = new Map(classAverages.map((a) => [a.skillId, a.avgScore]));

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-max">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-gray-600 bg-gray-50 sticky left-0 z-10 border border-gray-200 min-w-[120px]">
              Pupil
            </th>
            {skills.map((sk) => (
              <th
                key={sk.id}
                className="p-2 text-center font-medium text-gray-600 bg-gray-50 border border-gray-200 min-w-[80px] max-w-[80px]"
                title={sk.nameVi}
              >
                <span className="block truncate">{sk.nameVi}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const masteryBySkill = new Map(student.skillMasteries.map((m) => [m.skillId, m]));
            return (
              <tr key={student.childId} className="hover:bg-gray-50">
                <td className="p-2 font-medium text-gray-700 sticky left-0 bg-white border border-gray-200">
                  {student.nickname}
                </td>
                {skills.map((sk) => {
                  const m = masteryBySkill.get(sk.id);
                  const hasData = m !== undefined && m.score > 0;
                  const score = m?.score ?? 0;
                  return (
                    <td
                      key={sk.id}
                      className={`p-2 text-center border border-gray-200 ${getColor(score, hasData)}`}
                      title={`${student.nickname} — ${sk.nameVi}: ${scoreLabel(score, hasData)}`}
                    >
                      {scoreLabel(score, hasData)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* Class average row */}
          <tr className="bg-gray-50 font-semibold">
            <td className="p-2 text-gray-600 sticky left-0 bg-gray-50 border border-gray-200">
              Class TB
            </td>
            {skills.map((sk) => {
              const avg = avgMap.get(sk.id) ?? 0;
              const hasData = avg > 0;
              return (
                <td
                  key={sk.id}
                  className={`p-2 text-center border border-gray-200 ${getColor(avg, hasData)}`}
                >
                  {scoreLabel(avg, hasData)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" />Proficient (&gt;70%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block" />Currently studying (40-70%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" />Need support (&lt;40%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" />No data yet</span>
      </div>
    </div>
  );
}
