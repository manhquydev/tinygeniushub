"use client";

import React, { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Clock, Video } from "lucide-react";
import { SubjectIcon, getSubjectColor } from "./subject-icon";
import { abekaColors } from "../design-tokens";
import type { AbekaLesson } from "../types";

interface LessonCardProps {
  lesson: AbekaLesson;
  onSelect?: () => void;
  onAddToPlan?: () => void;
  showAddButton?: boolean;
}

export function LessonCard({ 
  lesson, 
  onSelect, 
  onAddToPlan,
  showAddButton = true 
}: LessonCardProps) {
  const totalDuration = lesson.packages.reduce(
    (sum, pkg) => sum + (pkg.durationMinutes || 0),
    0
  );
  const videoCount = lesson.packages.reduce(
    (sum, pkg) => sum + pkg.videos.length,
    0
  );

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2 text-xs">
              Lesson {lesson.lessonNumber}
            </Badge>
            <CardTitle className="text-lg leading-tight">
              {lesson.title || `Lesson${lesson.lessonNumber}`}
            </CardTitle>
          </div>
          {showAddButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlan?.();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Subject Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {lesson.packages.map((pkg) => (
            <div
              key={pkg.subjectCode}
              className="flex flex-col items-center rounded-lg p-2 transition-colors"
              style={{
                backgroundColor: `${getSubjectColor(pkg.subjectCode)}15`,
              }}
            >
              <SubjectIcon
                code={pkg.subjectCode}
                size={20}
              />
              <span className="mt-1 text-xs text-slate-500">
                {pkg.durationMinutes || "--"}&apos;
              </span>
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Video className="h-4 w-4" />
            <span>{videoCount} videos</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{totalDuration} minutes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LessonCardSkeletonProps {
  count?: number;
}

export function LessonCardSkeleton({ count = 6 }: LessonCardSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-12 bg-slate-200 rounded" />
              ))}
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface VideoThumbnailProps {
  url: string;
  duration?: number;
  onClick?: () => void;
  className?: string;
}

export function VideoThumbnail({ 
  url, 
  duration, 
  onClick,
  className 
}: VideoThumbnailProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-lg cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <img
        src={url}
        alt="Video thumbnail"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
          <Play className="h-5 w-5 text-slate-800 ml-0.5" fill="currentColor" />
        </div>
      </div>
      {duration && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
          {formatDuration(duration)}
        </div>
      )}
    </div>
  );
}

interface VideoRowProps {
  title: string;
  teacher?: string;
  duration: number;
  thumbnail: string;
  onPlay: () => void;
}

export function VideoRow({ 
  title, 
  teacher, 
  duration, 
  thumbnail, 
  onPlay 
}: VideoRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
      <div className="relative h-16 w-28 flex-shrink-0">
        <VideoThumbnail
          url={thumbnail}
          onClick={onPlay}
          className="h-full w-full"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        <p className="text-sm text-slate-500">
          {teacher && `${teacher} • `}
          {duration} minutes
        </p>
      </div>

      <Button variant="ghost" size="sm" onClick={onPlay}>
        <Play className="mr-1 h-4 w-4" />
        Xem
      </Button>
    </div>
  );
}
