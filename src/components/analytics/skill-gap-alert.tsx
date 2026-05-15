"use client";

/**
 * SkillGapAlert - Teacher alert cards highlighting skills where
 * more than 30% of students are below proficient level.
 */

interface GapAlert {
  skillId: string;
  nameVi: string;
  belowProficientPercent: number; // 0-1
  affectedStudentCount: number;
  suggestedAction: string;
}

interface Props {
  gapAlerts: GapAlert[];
}

function severityStyle(percent: number): { border: string; badge: string; label: string } {
  if (percent >= 0.6) {
    return {
      border: "border-red-300 bg-red-50",
      badge: "bg-red-100 text-red-700",
      label: "Urgent",
    };
  }
  return {
    border: "border-yellow-300 bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    label: "Need attention",
  };
}

export function SkillGapAlert({ gapAlerts }: Props) {
  if (gapAlerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        Very good! There are no skills that require special attention in class.
      </div>
    );
  }

  const sorted = [...gapAlerts].sort(
    (a, b) => b.belowProficientPercent - a.belowProficientPercent,
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">
        Detect {gapAlerts.length} skills that need additional support
      </p>
      {sorted.map((alert) => {
        const style = severityStyle(alert.belowProficientPercent);
        return (
          <div
            key={alert.skillId}
            className={`rounded-lg border p-4 ${style.border}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="font-medium text-gray-800">{alert.nameVi}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {alert.affectedStudentCount} students ({Math.round(alert.belowProficientPercent * 100)}%)
                  have not yet reached proficiency level
                </p>
                <p className="text-sm text-gray-500 mt-1 italic">{alert.suggestedAction}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-gray-700">
                  {Math.round(alert.belowProficientPercent * 100)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
