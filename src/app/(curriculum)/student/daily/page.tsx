"use client";

/**
 * Student Daily Plan Page
 * Shows today's assignments and progress
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DailyPlanView } from "@/components/curriculum/student/daily-plan-view";
import { StreakDisplay } from "@/components/curriculum/student/streak-display";
import { SmartKisu } from "@/components/mascot/kisu-avatar";
import type { AbekaAssignment } from "@/components/curriculum/types";

// Loading fallback
function DailyPlanSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4">
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200"></div>
        <div className="h-32 animate-pulse rounded-xl bg-slate-200"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200"></div>
        ))}
      </div>
    </div>
  );
}

// Main page content
function DailyPlanPageContent() {
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId") || "demo-child";
  const childName = searchParams.get("name") || "Little";
  const childAvatar = searchParams.get("avatar") || undefined;

  const [selectedAssignment, setSelectedAssignment] = useState<AbekaAssignment | null>(null);

  const handleAssignmentClick = useCallback((assignment: AbekaAssignment) => {
    setSelectedAssignment(assignment);
    // Could open a modal or navigate to lesson player
    console.log("Selected assignment:", assignment);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <a href="/curriculum/student/map">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Button>
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={childAvatar} />
              <AvatarFallback className="bg-sky-100 text-sky-600">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="font-bold truncate">Good morning, {childName}!</h1>
              <p className="text-sm text-slate-500">
                {format(new Date(), "EEEE, MMMM d", { locale: enUS })}
              </p>
            </div>
          </div>
          <StreakDisplay childId={childId} variant="compact" />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-32">
        <DailyPlanView
          childId={childId}
          childName={childName}
          onAssignmentClick={handleAssignmentClick}
        />
      </main>

      {/* Floating Kisu */}
      <SmartKisu childId={childId} />
    </div>
  );
}

// Page export with suspense boundary
export default function DailyPlanPage() {
  return (
    <Suspense fallback={<DailyPlanSkeleton />}>
      <DailyPlanPageContent />
    </Suspense>
  );
}
