"use client";

/**
 * SkillTreeMap Component
 * Main skill tree visualization with zoom, pan, and touch gestures
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillNode } from "./skill-node";
import { SkillConnection } from "./skill-connection";
import { useSkillTree, SkillTreeNode, SkillTreeConnection } from "../shared/api";
import { abekaColors } from "../design-tokens";
import { cn } from "@/lib/utils";

interface SkillTreeMapProps {
  childId: string;
  gradeId: string;
  onNodeSelect?: (node: SkillTreeNode) => void;
  className?: string;
}

export function SkillTreeMap({
  childId,
  gradeId,
  onNodeSelect,
  className,
}: SkillTreeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: skillTree, isLoading, error } = useSkillTree(gradeId, childId);

  const gradeColor = abekaColors.grades[gradeId as keyof typeof abekaColors.grades] || abekaColors.amberDiep;

  // Pinch zoom for tablets
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialScale = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const newScale = Math.min(
          Math.max(initialScale * (distance / initialDistance), 0.5),
          2
        );
        setScale(newScale);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [scale]);

  const handleNodeSelect = useCallback(
    (node: SkillTreeNode) => {
      setSelectedNodeId(node.id);
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (isLoading) {
    return <SkillTreeSkeleton />;
  }

  if (error || !skillTree) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">Unable to load skill map</p>
          <p className="text-sm text-slate-400">Please try again later</p>
        </div>
      </div>
    );
  }

  const getNodeById = (id: string) =>
    skillTree.nodes.find((n: SkillTreeNode) => n.id === id);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-b from-sky-100 to-green-50",
        className
      )}
      data-testid="skill-tree"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="h-full w-full">
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="#94a3b8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Zoom Controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleReset}
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Reset view"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress Summary */}
      <div className="absolute left-4 top-4 z-10 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: gradeColor }}
          >
            <span className="text-sm font-bold">{gradeId}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Progress</p>
            <p className="text-lg font-bold" style={{ color: gradeColor }}>
              {skillTree.completedLessons}/{skillTree.totalLessons} lessons
            </p>
          </div>
        </div>
      </div>

      {/* Skill Tree Container */}
      <motion.div
        ref={containerRef}
        className={cn(
          "h-full w-full cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        drag
        dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          setPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
          }));
        }}
      >
        <motion.div
          className="relative h-full w-full"
          style={{
            scale,
            x: position.x,
            y: position.y,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <AnimatePresence>
              {skillTree.connections.map((conn: SkillTreeConnection) => {
                const fromNode = getNodeById(conn.from);
                const toNode = getNodeById(conn.to);
                if (!fromNode || !toNode) return null;
                return (
                  <SkillConnection
                    key={`${conn.from}-${conn.to}`}
                    connection={conn}
                    fromNode={fromNode}
                    toNode={toNode}
                  />
                );
              })}
            </AnimatePresence>
          </svg>

          {/* Nodes */}
          {skillTree.nodes.map((node: SkillTreeNode) => (
            <SkillNode
              key={node.id}
              node={node}
              onSelect={() => handleNodeSelect(node)}
              isSelected={selectedNodeId === node.id}
              gradeColor={gradeColor}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// Skeleton loading state
function SkillTreeSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
        <p className="text-slate-500">Loading skill map...</p>
      </div>
    </div>
  );
}
