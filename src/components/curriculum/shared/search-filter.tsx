"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AbekaSubjectCode, AbekaGradeCode, LessonFilters } from "../types";
import { getSubjectNameVi, getSubjectColor } from "./subject-icon";
import { getGradeName } from "./grade-badge";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Find lessons...",
  className,
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 h-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface FilterChipsProps {
  filters: LessonFilters;
  onRemoveFilter: (type: keyof LessonFilters, value: string) => void;
  onClearAll: () => void;
}

export function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) {
  const hasFilters =
    filters.grades.length > 0 ||
    filters.subjects.length > 0 ||
    filters.status !== "all" ||
    filters.searchQuery;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {filters.grades.map((grade) => (
        <Badge
          key={grade}
          variant="secondary"
          className="cursor-pointer hover:bg-slate-200"
          onClick={() => onRemoveFilter("grades", grade)}
        >
          {getGradeName(grade)}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      ))}

      {filters.subjects.map((subject) => (
        <Badge
          key={subject}
          variant="secondary"
          className="cursor-pointer hover:bg-slate-200"
          style={{
            backgroundColor: `${getSubjectColor(subject)}20`,
            color: getSubjectColor(subject),
          }}
          onClick={() => onRemoveFilter("subjects", subject)}
        >
          {getSubjectNameVi(subject)}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      ))}

      {filters.status !== "all" && (
        <Badge
          variant="secondary"
          className="cursor-pointer hover:bg-slate-200"
          onClick={() => onRemoveFilter("status", "all")}
        >
          {filters.status === "completed"
            ? "Complete"
            : filters.status === "not_started"
            ? "Haven't started yet"
            : "Studying"}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      )}

      {filters.searchQuery && (
        <Badge
          variant="secondary"
          className="cursor-pointer hover:bg-slate-200"
          onClick={() => onRemoveFilter("searchQuery", "")}
        >
          &ldquo;{filters.searchQuery}&rdquo;
          <X className="ml-1 h-3 w-3" />
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-slate-500 hover:text-slate-700"
        onClick={onClearAll}
      >
        Delete all
      </Button>
    </div>
  );
}

interface FilterPanelProps {
  filters: LessonFilters;
  onChange: (filters: LessonFilters) => void;
  availableSubjects: AbekaSubjectCode[];
  availableGrades: AbekaGradeCode[];
}

export function FilterPanel({
  filters,
  onChange,
  availableSubjects,
  availableGrades,
}: FilterPanelProps) {
  const toggleGrade = (grade: AbekaGradeCode) => {
    const newGrades = filters.grades.includes(grade)
      ? filters.grades.filter((g) => g !== grade)
      : [...filters.grades, grade];
    onChange({ ...filters, grades: newGrades });
  };

  const toggleSubject = (subject: AbekaSubjectCode) => {
    const newSubjects = filters.subjects.includes(subject)
      ? filters.subjects.filter((s) => s !== subject)
      : [...filters.subjects, subject];
    onChange({ ...filters, subjects: newSubjects });
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
      <div>
        <h4 className="text-sm font-semibold mb-2 text-slate-700">Class</h4>
        <div className="flex flex-wrap gap-2">
          {availableGrades.map((grade) => (
            <Button
              key={grade}
              variant={filters.grades.includes(grade) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleGrade(grade)}
              className="text-xs"
            >
              {getGradeName(grade)}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2 text-slate-700">Subject</h4>
        <div className="flex flex-wrap gap-2">
          {availableSubjects.map((subject) => (
            <Button
              key={subject}
              variant={
                filters.subjects.includes(subject) ? "default" : "outline"
              }
              size="sm"
              onClick={() => toggleSubject(subject)}
              className="text-xs"
              style={
                filters.subjects.includes(subject)
                  ? {
                      backgroundColor: getSubjectColor(subject),
                      borderColor: getSubjectColor(subject),
                    }
                  : undefined
              }
            >
              {getSubjectNameVi(subject)}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2 text-slate-700">Status</h4>
        <select
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as LessonFilters["status"],
            })
          }
          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
        >
          <option value="all">All</option>
          <option value="not_started">Haven't started yet</option>
          <option value="in_progress">Studying</option>
          <option value="completed">Complete</option>
        </select>
      </div>
    </div>
  );
}
