"use client";

import React, { Suspense, useState, useCallback } from "react";
import { LessonCard, LessonCardSkeleton } from "../shared/lesson-card";
import { SearchBar, FilterChips, FilterPanel } from "../shared/search-filter";
import { GradeList } from "../shared/grade-badge";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Grid3X3, List, ChevronLeft, ChevronRight } from "lucide-react";
import type { 
  AbekaLesson, 
  AbekaGrade, 
  LessonFilters, 
  BrowserViewMode,
  AbekaSubjectCode,
  AbekaGradeCode 
} from "../types";

interface LessonBrowserProps {
  lessons: AbekaLesson[];
  grades: AbekaGrade[];
  isLoading?: boolean;
  onSelectLesson: (lesson: AbekaLesson) => void;
  onAddToPlan: (lesson: AbekaLesson) => void;
}

const AVAILABLE_SUBJECTS: AbekaSubjectCode[] = [
  "PHONICS",
  "ARITHMETIC", 
  "BIBLE",
  "WRITING",
  "SCIENCE",
  "HISTORY",
  "ACTIVITIES",
  "READING"
];

export function LessonBrowser({
  lessons,
  grades,
  isLoading = false,
  onSelectLesson,
  onAddToPlan,
}: LessonBrowserProps) {
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<LessonFilters>({
    grades: [],
    subjects: [],
    searchQuery: "",
    status: "all",
  });
  const [viewMode, setViewMode] = useState<BrowserViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const handleRemoveFilter = useCallback(
    (type: keyof LessonFilters, value: string) => {
      if (type === "grades" || type === "subjects") {
        setFilters((prev) => ({
          ...prev,
          [type]: (prev[type] as string[]).filter((v) => v !== value),
        }));
      } else if (type === "searchQuery") {
        setFilters((prev) => ({ ...prev, searchQuery: "" }));
      } else if (type === "status") {
        setFilters((prev) => ({ ...prev, status: "all" }));
      }
    },
    []
  );

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      grades: [],
      subjects: [],
      searchQuery: "",
      status: "all",
    });
    setSelectedGradeId(null);
  }, []);

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    // Filter by grade
    if (selectedGradeId && lesson.gradeId !== selectedGradeId) return false;
    if (filters.grades.length > 0 && !filters.grades.includes(lesson.gradeCode))
      return false;

    // Filter by subject
    if (filters.subjects.length > 0) {
      const lessonSubjects = lesson.packages.map((p) => p.subjectCode);
      if (!filters.subjects.some((s) => lessonSubjects.includes(s))) return false;
    }

    // Filter by search
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = lesson.title?.toLowerCase().includes(query);
      const matchesLessonNumber = lesson.lessonNumber.toString().includes(query);
      if (!matchesTitle && !matchesLessonNumber) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const paginatedLessons = filteredLessons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const availableGradeCodes = grades.map((g) => g.code);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Grade Selector */}
      <aside className="w-64 border-r bg-white p-4 overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">🎓 Select Class</h2>
        <GradeList
          grades={grades}
          selectedGrade={selectedGradeId}
          onSelect={setSelectedGradeId}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                📚 Browse the Syllabus
              </h1>
              <p className="text-slate-500">
                Explore {filteredLessons.length} Abeka lessons
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-slate-100" : ""}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
              </Button>

              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchBar
              value={filters.searchQuery}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, searchQuery: value }))
              }
              placeholder="Find lessons..."
              className="flex-1"
            />
          </div>

          {/* Filter Chips */}
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableSubjects={AVAILABLE_SUBJECTS}
              availableGrades={availableGradeCodes}
            />
          )}

          {/* Lesson Grid/List */}
          {isLoading ? (
            <LessonCardSkeleton count={6} />
          ) : paginatedLessons.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-3"
              }
            >
              {paginatedLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onSelect={() => onSelectLesson(lesson)}
                  onAddToPlan={() => onAddToPlan(lesson)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <p className="text-slate-500">
                No lessons found matching the filter.
              </p>
              <Button
                variant="link"
                onClick={handleClearAllFilters}
                className="mt-2"
              >
                Clear filter
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
