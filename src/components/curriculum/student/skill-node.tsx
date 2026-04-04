"use client";

/**
 * SkillNode Component
 * Individual node in the skill tree
 */

import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { SubjectIcon } from "../shared/subject-icon";
import { cn } from "@/lib/utils";
import type { SkillTreeNode } from "../shared/api";

interface SkillNodeProps {
  node: SkillTreeNode;
  onSelect: () => void;
  isSelected: boolean;
  gradeColor: string;
}

export function SkillNode({
  node,
  onSelect,
  isSelected,
  gradeColor,
}: SkillNodeProps) {
  const getNodeStyles = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white ring-4 ring-green-200";
      case "available":
        return `bg-white text-slate-900 ring-4 cursor-pointer hover:scale-110`;
      case "in_progress":
        return "bg-amber-400 text-amber-900 ring-4 ring-amber-200";
      case "mastered":
        return "bg-gradient-to-br from-yellow-400 to-orange-500 text-white ring-4 ring-yellow-200";
      case "locked":
      default:
        return "bg-slate-300 text-slate-500 ring-2 ring-slate-200";
    }
  };

  const isLocked = node.status === "locked";
  const isCompleted = node.status === "completed" || node.status === "mastered";
  const isInProgress = node.status === "in_progress";

  return (
    <motion.button
      className={cn(
        "absolute flex h-16 w-16 flex-col items-center justify-center rounded-2xl shadow-lg transition-transform",
        getNodeStyles(node.status)
      )}
      style={{
        left: `${node.positionX}px`,
        top: `${node.positionY}px`,
        transform: "translate(-50%, -50%)",
        ...(node.status === "available" && { "--tw-ring-color": gradeColor } as React.CSSProperties),
      }}
      onClick={onSelect}
      whileHover={!isLocked ? { scale: 1.1 } : {}}
      whileTap={!isLocked ? { scale: 0.95 } : {}}
      animate={isSelected ? { scale: 1.15 } : {}}
      aria-label={`Lesson ${node.lessonNumber} ${node.subjectCode}`}
      disabled={isLocked}
    >
      {isLocked ? (
        <Lock className="h-5 w-5" />
      ) : (
        <SubjectIcon code={node.subjectCode as any} size={20} />
      )}
      <span className="mt-1 text-xs font-bold">{node.lessonNumber}</span>

      {/* Status Indicators */}
      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600"
        >
          <Check className="h-3 w-3 text-white" />
        </motion.div>
      )}

      {isInProgress && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
          </span>
        </div>
      )}
    </motion.button>
  );
}
