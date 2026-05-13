"use client";

import { useState } from "react";
import { Stage, Layer, Rect, Circle, Ellipse } from "react-konva";
import type { DrawingSpec, DrawingShape } from "@/modules/content/activity-types";
import type { KidMascotGazeDirection } from "@/components/animation/kid-mascot";

interface DrawingActivityProps {
  spec: DrawingSpec;
  prompt: string;
  disabled: boolean;
  onAnswer: (isCorrect: boolean) => void;
  onHoverOption: (dir: KidMascotGazeDirection) => void;
  onHoverOptionEnd: () => void;
}

const SWATCH_SIZE = 44; // min touch target

function KonvaShape({
  shape,
  fill,
  onClick,
}: {
  shape: DrawingShape;
  fill: string;
  onClick: () => void;
}) {
  const commonProps = {
    fill,
    stroke: "#334155",
    strokeWidth: 2,
    onClick,
    onTap: onClick,
    style: { cursor: "pointer" },
  };

  if (shape.kind === "rect") {
    return (
      <Rect
        x={shape.props.x ?? 0}
        y={shape.props.y ?? 0}
        width={shape.props.width ?? 80}
        height={shape.props.height ?? 80}
        cornerRadius={shape.props.cornerRadius ?? 4}
        {...commonProps}
      />
    );
  }

  if (shape.kind === "circle") {
    return (
      <Circle
        x={shape.props.x ?? 0}
        y={shape.props.y ?? 0}
        radius={shape.props.radius ?? 40}
        {...commonProps}
      />
    );
  }

  if (shape.kind === "ellipse") {
    return (
      <Ellipse
        x={shape.props.x ?? 0}
        y={shape.props.y ?? 0}
        radiusX={shape.props.radiusX ?? 60}
        radiusY={shape.props.radiusY ?? 40}
        {...commonProps}
      />
    );
  }

  return null;
}

export function DrawingActivity({
  spec,
  prompt,
  disabled,
  onAnswer,
  onHoverOption,
  onHoverOptionEnd,
}: DrawingActivityProps) {
  const [selectedColor, setSelectedColor] = useState(spec.colorPalette[0] ?? "#ef4444");
  const [fills, setFills] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.shapes.map((s) => [s.id, s.initialFill])),
  );

  const isGuidedMode = spec.shapes.some((s) => s.targetFill);

  function handleShapeClick(shapeId: string) {
    if (disabled) return;
    setFills((current) => ({ ...current, [shapeId]: selectedColor }));
  }

  function handleDone() {
    if (disabled) return;

    if (!isGuidedMode) {
      onAnswer(true);
      return;
    }

    const correct = spec.shapes.every(
      (s) => !s.targetFill || fills[s.id] === s.targetFill,
    );
    onAnswer(correct);
  }

  // Scale canvas to fit container (max 400px wide)
  const canvasWidth = Math.min(spec.canvasWidth, 400);
  const scale = canvasWidth / spec.canvasWidth;
  const canvasHeight = spec.canvasHeight * scale;

  return (
    <div
      className="grid gap-3"
      onMouseEnter={() => onHoverOption("center")}
      onMouseLeave={onHoverOptionEnd}
    >
      <p className="lesson-wizard-quiz-copy">{prompt}</p>
      {spec.instruction && (
        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>{spec.instruction}</p>
      )}

      {/* Color palette */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {spec.colorPalette.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setSelectedColor(color)}
            style={{
              width: SWATCH_SIZE,
              height: SWATCH_SIZE,
              borderRadius: "50%",
              background: color,
              border: selectedColor === color ? "3px solid #1e293b" : "3px solid transparent",
              outline: selectedColor === color ? "2px solid white" : "none",
              cursor: "pointer",
              boxShadow: selectedColor === color ? "0 0 0 2px #1e293b" : undefined,
            }}
            aria-label={`Color${color}`}
          />
        ))}
      </div>

      {/* Canvas */}
      <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #e2e8f0" }}>
        <Stage width={canvasWidth} height={canvasHeight} scaleX={scale} scaleY={scale}>
          <Layer>
            {spec.shapes.map((shape) => (
              <KonvaShape
                key={shape.id}
                shape={shape}
                fill={fills[shape.id] ?? shape.initialFill}
                onClick={() => handleShapeClick(shape.id)}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      <button
        type="button"
        className="lesson-wizard-secondary-button"
        style={{ justifySelf: "start", padding: "0.5rem 1.5rem" }}
        onClick={handleDone}
        disabled={disabled}
      >
        Xong ✓
      </button>
    </div>
  );
}
