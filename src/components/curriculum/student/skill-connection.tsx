"use client";

/**
 * SkillConnection Component
 * SVG connection lines between skill nodes
 */

import { motion } from "framer-motion";
import type { SkillTreeConnection, SkillTreeNode } from "../shared/api";

interface SkillConnectionProps {
  connection: SkillTreeConnection;
  fromNode: SkillTreeNode;
  toNode: SkillTreeNode;
}

export function SkillConnection({
  connection,
  fromNode,
  toNode,
}: SkillConnectionProps) {
  const strokeColor =
    connection.status === "completed"
      ? "#22c55e"
      : connection.status === "available"
        ? "#0ea5e9"
        : "#cbd5e1";

  return (
    <motion.line
      x1={fromNode.positionX}
      y1={fromNode.positionY}
      x2={toNode.positionX}
      y2={toNode.positionY}
      stroke={strokeColor}
      strokeWidth={connection.status === "completed" ? 4 : 2}
      strokeDasharray={connection.status === "locked" ? "8,4" : "0"}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  );
}
