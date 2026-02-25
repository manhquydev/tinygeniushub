"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import * as m from "motion/react-m";
import { wobble } from "@/components/animation/kid-motion-variants";
import type { DragDropSpec } from "@/modules/content/activity-types";
import type { KidMascotGazeDirection } from "@/components/animation/kid-mascot";

interface DragDropActivityProps {
  spec: DragDropSpec;
  prompt: string;
  disabled: boolean;
  onAnswer: (isCorrect: boolean) => void;
  onHoverOption: (dir: KidMascotGazeDirection) => void;
  onHoverOptionEnd: () => void;
}

function DraggableCard({ id, label, isPlaced }: { id: string; label: string; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  if (isPlaced) {
    return (
      <div
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "0.75rem",
          border: "2px solid #22c55e",
          background: "#f0fdf4",
          fontSize: "0.9rem",
          fontWeight: 600,
          opacity: 0.5,
          cursor: "default",
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: "0.5rem 1rem",
        borderRadius: "0.75rem",
        border: "2px solid #cbd5e1",
        background: isDragging ? "#e0f2fe" : "white",
        fontSize: "0.9rem",
        fontWeight: 600,
        cursor: "grab",
        touchAction: "none",
        zIndex: isDragging ? 50 : undefined,
        boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      {label}
    </div>
  );
}

function DropZoneArea({
  id,
  label,
  placedLabel,
  isWrong,
}: {
  id: string;
  label: string;
  placedLabel?: string;
  isWrong: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <m.div
      ref={setNodeRef}
      key={`zone-${id}-${isWrong ? "w" : "ok"}`}
      variants={wobble}
      initial="idle"
      animate={isWrong ? "wobble" : "idle"}
      style={{
        minHeight: "70px",
        borderRadius: "0.75rem",
        border: `2px dashed ${isOver ? "#3b82f6" : placedLabel ? "#22c55e" : "#94a3b8"}`,
        background: isOver ? "#eff6ff" : placedLabel ? "#f0fdf4" : "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.25rem",
        padding: "0.5rem",
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{label}</span>
      {placedLabel && (
        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#16a34a" }}>{placedLabel}</span>
      )}
    </m.div>
  );
}

export function DragDropActivity({
  spec,
  prompt,
  disabled,
  onAnswer,
  onHoverOption,
  onHoverOptionEnd,
}: DragDropActivityProps) {
  // placements: itemId → zoneId
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [wrongPulse, setWrongPulse] = useState<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
  );

  const placedItemIds = new Set(Object.keys(placements));
  // zoneId → item label
  const zoneToLabel: Record<string, string> = {};
  for (const [itemId, zoneId] of Object.entries(placements)) {
    const item = spec.items.find((i) => i.id === itemId);
    if (item) zoneToLabel[zoneId] = item.label;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const itemId = String(active.id);
    const zoneId = String(over.id);

    const zone = spec.dropZones.find((z) => z.id === zoneId);
    if (!zone) return;

    const isCorrectZone = zone.acceptsItemId === itemId;

    if (!isCorrectZone) {
      setWrongPulse((current) => ({ ...current, [zoneId]: (current[zoneId] ?? 0) + 1 }));
      onAnswer(false);
      return;
    }

    const nextPlacements = { ...placements, [itemId]: zoneId };
    setPlacements(nextPlacements);

    if (Object.keys(nextPlacements).length === spec.dropZones.length) {
      onAnswer(true);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-3" onMouseEnter={() => onHoverOption("center")} onMouseLeave={onHoverOptionEnd}>
        <p className="lesson-wizard-quiz-copy">{prompt}</p>
        {spec.instruction && (
          <p style={{ fontSize: "0.82rem", color: "#64748b" }}>{spec.instruction}</p>
        )}

        {/* Draggable items */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {spec.items.map((item) => (
            <DraggableCard
              key={item.id}
              id={item.id}
              label={item.label}
              isPlaced={placedItemIds.has(item.id)}
            />
          ))}
        </div>

        {/* Drop zones */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem" }}>
          {spec.dropZones.map((zone) => (
            <DropZoneArea
              key={zone.id}
              id={zone.id}
              label={zone.label}
              placedLabel={zoneToLabel[zone.id]}
              isWrong={(wrongPulse[zone.id] ?? 0) > 0}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
