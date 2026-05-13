"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as m from "motion/react-m";
import { wobble, bounceIn } from "@/components/animation/kid-motion-variants";
import type { SortOrderSpec } from "@/modules/content/activity-types";
import type { KidMascotGazeDirection } from "@/components/animation/kid-mascot";

interface SortOrderActivityProps {
  spec: SortOrderSpec;
  prompt: string;
  disabled: boolean;
  onAnswer: (isCorrect: boolean) => void;
  onHoverOption: (dir: KidMascotGazeDirection) => void;
  onHoverOptionEnd: () => void;
}

function SortableItem({ id, label, index }: { id: string; label: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem 1rem",
        borderRadius: "0.75rem",
        border: "2px solid #e2e8f0",
        background: isDragging ? "#e0f2fe" : "white",
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
        fontWeight: 600,
        fontSize: "0.9rem",
      }}
      {...attributes}
      {...listeners}
    >
      <span style={{ color: "#94a3b8", fontSize: "0.75rem", minWidth: "1.5rem" }}>{index + 1}.</span>
      {label}
      <span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: "1rem" }}>⠿</span>
    </div>
  );
}

export function SortOrderActivity({
  spec,
  prompt,
  disabled,
  onAnswer,
  onHoverOption,
  onHoverOptionEnd,
}: SortOrderActivityProps) {
  const [orderedItems, setOrderedItems] = useState<string[]>(() => [...spec.items]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedItems((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function handleSubmit() {
    if (disabled || submitted) return;

    // correctOrder is indices into the original spec.items array
    const correctSequence = spec.correctOrder.map((i) => spec.items[i]);
    const correct = orderedItems.every((item, idx) => item === correctSequence[idx]);

    setSubmitted(true);
    setIsCorrect(correct);
    onAnswer(correct);
  }

  return (
    <div className="grid gap-3" onMouseEnter={() => onHoverOption("center")} onMouseLeave={onHoverOptionEnd}>
      <p className="lesson-wizard-quiz-copy">{prompt}</p>
      <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Drag to arrange in the correct order</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedItems} strategy={verticalListSortingStrategy}>
          <div className="grid gap-2">
            {orderedItems.map((item, index) => (
              <SortableItem key={item} id={item} label={item} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <m.button
        type="button"
        className="lesson-wizard-secondary-button"
        style={{ justifySelf: "start", padding: "0.5rem 1.5rem" }}
        onClick={handleSubmit}
        disabled={disabled || submitted}
        variants={isCorrect === false ? wobble : isCorrect === true ? bounceIn : undefined}
        initial={isCorrect !== null ? "idle" : undefined}
        animate={isCorrect === false ? "wobble" : isCorrect === true ? "bounceIn" : undefined}
      >
        Check
      </m.button>
    </div>
  );
}
