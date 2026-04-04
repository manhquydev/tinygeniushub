"use client";

import React from "react";
import { abekaColors } from "../design-tokens";
import type { AbekaSubjectCode } from "../types";
import { 
  BookOpen, 
  Calculator, 
  BookMarked, 
  PenTool, 
  FlaskConical, 
  Landmark,
  Palette,
  GraduationCap,
  type LucideProps
} from "lucide-react";

// Support both old and new subject codes
const iconMap: Record<string, React.FC<LucideProps>> = {
  PHONICS: BookOpen,
  ARITHMETIC: Calculator,
  BIBLE: BookMarked,
  WRITING: PenTool,
  SCIENCE: FlaskConical,
  HISTORY: Landmark,
  ACTIVITIES: Palette,
  READING: GraduationCap,
  // Legacy aliases
  ENG: BookOpen,
  MTH: Calculator,
  BIB: BookMarked,
  GRM: PenTool,
  SCI: FlaskConical,
  HIS: Landmark,
  ART: Palette,
  PHY: BookOpen,
};

const subjectNames: Record<string, string> = {
  PHONICS: "Phonics",
  ARITHMETIC: "Arithmetic",
  BIBLE: "Bible",
  WRITING: "Writing",
  SCIENCE: "Science",
  HISTORY: "History",
  ACTIVITIES: "Activities",
  READING: "Reading",
  // Legacy aliases
  ENG: "English",
  MTH: "Math",
  BIB: "Bible",
  GRM: "Grammar",
  SCI: "Science",
  HIS: "History",
  ART: "Art",
  PHY: "Phonics",
};

const subjectNamesVi: Record<string, string> = {
  PHONICS: "Phonics",
  ARITHMETIC: "Toán",
  BIBLE: "Kinh Thánh",
  WRITING: "Viết",
  SCIENCE: "Khoa Học",
  HISTORY: "Lịch Sử",
  ACTIVITIES: "Hoạt Động",
  READING: "Đọc",
  // Legacy aliases
  ENG: "Tiếng Anh",
  MTH: "Toán",
  BIB: "Kinh Thánh",
  GRM: "Ngữ Pháp",
  SCI: "Khoa Học",
  HIS: "Lịch Sử",
  ART: "Mỹ Thuật",
  PHY: "Phonics",
};

interface SubjectIconProps {
  code: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function SubjectIcon({ code, className, size = 24, style }: SubjectIconProps) {
  const Icon = iconMap[code] || BookOpen;
  const color = getSubjectColor(code);

  return (
    <Icon 
      size={size} 
      className={className}
      style={{ color, ...style }}
      aria-label={`Subject: ${getSubjectNameVi(code)}`}
    />
  );
}

interface SubjectBadgeProps {
  code: string;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SubjectBadge({ 
  code, 
  showName = true,
  size = "md" 
}: SubjectBadgeProps) {
  const color = getSubjectColor(code);
  const bgColor = `${color}20`;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: bgColor,
        color: color,
      }}
    >
      <SubjectIcon code={code} size={size === "sm" ? 14 : size === "md" ? 18 : 22} />
      {showName && <span>{getSubjectNameVi(code)}</span>}
    </div>
  );
}

export function getSubjectName(code: string): string {
  return subjectNames[code] || code;
}

export function getSubjectNameVi(code: string): string {
  return subjectNamesVi[code] || code;
}

export function getSubjectColor(code: string): string {
  // Map legacy codes to new codes for color lookup
  const codeMap: Record<string, AbekaSubjectCode> = {
    ENG: "PHONICS",
    MTH: "ARITHMETIC",
    BIB: "BIBLE",
    GRM: "WRITING",
    SCI: "SCIENCE",
    HIS: "HISTORY",
    ART: "ACTIVITIES",
    PHY: "PHONICS",
  };
  
  const mappedCode = codeMap[code] || code;
  return abekaColors.subjects[mappedCode as AbekaSubjectCode] || abekaColors.subjects.PHONICS;
}
