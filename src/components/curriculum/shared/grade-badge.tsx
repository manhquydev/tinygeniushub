"use client";

import React from "react";
import { abekaColors } from "../design-tokens";
import type { AbekaGradeCode } from "../types";

interface GradeBadgeProps {
  grade: AbekaGradeCode;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}

const gradeNames: Record<AbekaGradeCode, string> = {
  K4: "K4",
  K5: "K5",
  G1: "Grade 1",
  G2: "Grade 2",
  G3: "Grade 3",
  G4: "Grade 4",
  G5: "Grade 5",
  G6: "Grade 6",
  G7: "Grade 7",
  G8: "Grade 8",
  G9: "Grade 9",
  G10: "Grade 10",
  G11: "Grade 11",
  G12: "Grade 12",
};

export function GradeBadge({ 
  grade, 
  showName = true,
  size = "md" 
}: GradeBadgeProps) {
  const color = abekaColors.grades[grade];
  const bgColor = `${color}20`;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: bgColor,
        color: color,
      }}
    >
      {showName ? gradeNames[grade] : grade}
    </span>
  );
}

export function getGradeName(grade: AbekaGradeCode): string {
  return gradeNames[grade];
}

export function getGradeColor(grade: AbekaGradeCode): string {
  return abekaColors.grades[grade];
}

interface GradeListProps {
  grades: Array<{ id: string; code: AbekaGradeCode; name: string }>;
  selectedGrade: string | null;
  onSelect: (gradeId: string) => void;
}

export function GradeList({ grades, selectedGrade, onSelect }: GradeListProps) {
  return (
    <div className="space-y-1">
      {grades.map((grade) => (
        <button
          key={grade.id}
          onClick={() => onSelect(grade.id)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
            selectedGrade === grade.id
              ? "bg-amber-100 text-amber-900"
              : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          <span className="font-medium">{grade.name}</span>
          <GradeBadge grade={grade.code} size="sm" showName={false} />
        </button>
      ))}
    </div>
  );
}
