"use client";

/**
 * Student Skill Tree Map Page
 * RPG-style skill tree learning visualization
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, BookOpen, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SkillTreeMap } from "@/components/curriculum/student/skill-tree-map";
import { SmartKisu } from "@/components/mascot/kisu-avatar";
import { SubjectIcon, getSubjectNameVi } from "@/components/curriculum/shared/subject-icon";
import { abekaColors } from "@/components/curriculum/design-tokens";
import type { SkillTreeNode } from "@/components/curriculum/shared/api";
import { cn } from "@/lib/utils";

// Loading fallback
function SkillTreeSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
        <p className="text-slate-500">Đang tải bản đồ kỹ năng...</p>
      </div>
    </div>
  );
}

// Main page content
function SkillTreePageContent() {
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId") || "demo-child";
  const gradeId = searchParams.get("grade") || "K4";
  
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNodeSelect = useCallback((node: SkillTreeNode) => {
    setSelectedNode(node);
    setDialogOpen(true);
  }, []);

  const gradeColor = abekaColors.grades[gradeId as keyof typeof abekaColors.grades] || abekaColors.amberDiep;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-20 bg-white/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold"
              style={{ backgroundColor: gradeColor }}
            >
              {gradeId}
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Bản Đồ Kỹ Năng</h1>
              <p className="text-sm text-slate-500">Chạm vào các node để học</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="/curriculum/student/daily">📅 Hôm nay</a>
          </Button>
        </div>
      </header>

      {/* Skill Tree */}
      <div className="h-full pt-16">
        <SkillTreeMap
          childId={childId}
          gradeId={gradeId}
          onNodeSelect={handleNodeSelect}
        />
      </div>

      {/* Node Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedNode && (
            <NodeDetailModal
              node={selectedNode}
              gradeColor={gradeColor}
              onClose={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Smart Kisu */}
      <SmartKisu childId={childId} />
    </div>
  );
}

// Node detail modal content
interface NodeDetailModalProps {
  node: SkillTreeNode;
  gradeColor: string;
  onClose: () => void;
}

function NodeDetailModal({ node, gradeColor, onClose }: NodeDetailModalProps) {
  const isLocked = node.status === "locked";
  const isCompleted = node.status === "completed" || node.status === "mastered";
  const isInProgress = node.status === "in_progress";
  const isAvailable = node.status === "available";

  return (
    <>
      <DialogHeader
        className="rounded-t-lg p-6 text-white"
        style={{ backgroundColor: gradeColor }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/20 p-3">
            <SubjectIcon 
              code={node.subjectCode as any} 
              size={32}
              style={{ color: "white" }}
            />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-white">
              Bài {node.lessonNumber}
            </DialogTitle>
            <p className="text-white/80">
              {getSubjectNameVi(node.subjectCode as any)}
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="p-6">
        {isLocked ? (
          <div className="text-center py-8">
            <Lock className="mx-auto h-16 w-16 text-slate-300" />
            <p className="mt-4 text-lg text-slate-600">
              Hoàn thành bài trước để mở khóa!
            </p>
            {node.prerequisites && node.prerequisites.length > 0 && (
              <div className="mt-4 flex justify-center gap-2">
                {node.prerequisites.map((prereq) => (
                  <Badge key={prereq} variant="secondary">
                    Bài {prereq}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress info */}
            <div className="flex items-center gap-4 rounded-xl border p-4">
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: `${gradeColor}20` }}
              >
                <SubjectIcon
                  code={node.subjectCode as any}
                  size={28}
                  style={{ color: gradeColor }}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">{getSubjectNameVi(node.subjectCode as any)}</p>
                <p className="text-sm text-slate-500">
                  {isCompleted ? "Đã hoàn thành" : isInProgress ? "Đang học" : "Sẵn sàng học"}
                </p>
              </div>
              <Button
                size="lg"
                className="rounded-full px-6"
                style={{ backgroundColor: isCompleted ? undefined : gradeColor }}
                disabled={isCompleted}
              >
                {isCompleted ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Đã xong
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Học ngay
                  </>
                )}
              </Button>
            </div>

            {/* Additional info */}
            {node.progress !== undefined && node.progress > 0 && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Tiến độ</p>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${node.progress}%`,
                      backgroundColor: gradeColor 
                    }}
                  />
                </div>
                <p className="mt-1 text-right text-sm text-slate-500">
                  {node.progress}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Page export with suspense boundary
export default function SkillTreePage() {
  return (
    <Suspense fallback={<SkillTreeSkeleton />}>
      <SkillTreePageContent />
    </Suspense>
  );
}
