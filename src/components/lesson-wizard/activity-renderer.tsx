"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { bounceIn, wobble } from "@/components/animation/kid-motion-variants";
import type { KidMascotGazeDirection } from "@/components/animation/kid-mascot";
import type { ActivitySpec, ActivityType } from "@/modules/content/activity-types";
import { DragDropActivity } from "@/components/lesson-wizard/drag-drop-activity";
import { SortOrderActivity } from "@/components/lesson-wizard/sort-order-activity";

// Dynamic import for Konva (canvas — no SSR)
const DrawingActivity = dynamic(
  () => import("@/components/lesson-wizard/drawing-activity").then((m) => m.DrawingActivity),
  { ssr: false },
);

type ActivityRow = {
  id: string;
  type: ActivityType;
  prompt: string;
  spec: ActivitySpec;
  passCriteria: number;
};

interface ActivityRendererProps {
  activity: ActivityRow;
  disabled: boolean;
  onAnswer: (isCorrect: boolean) => void;
  mascotGazeDirection: KidMascotGazeDirection;
  onHoverOption: (dir: KidMascotGazeDirection) => void;
  onHoverOptionEnd: () => void;
}

type McqChoice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type WordMatchPair = {
  id: string;
  left: string;
  right: string;
};

type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function shuffleArray<T>(input: T[]) {
  const next = [...input];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex] as T, next[index] as T];
  }
  return next;
}

function asMcqChoices(spec: ActivitySpec): McqChoice[] {
  if (spec.type !== "MULTIPLE_CHOICE") {
    return [];
  }

  return spec.options.map((option, index) => ({
    id: `choice-${index + 1}`,
    text: option,
    isCorrect: index === spec.correctIndex,
  }));
}

function asTrueFalseAnswer(spec: ActivitySpec) {
  if (spec.type !== "TRUE_FALSE") {
    return null;
  }

  return spec.isTrue;
}

function asWordMatchPairs(spec: ActivitySpec): WordMatchPair[] {
  if (spec.type !== "MATCH_PAIRS") {
    return [];
  }

  return spec.pairs.map((pair, index) => ({
    id: `pair-${index + 1}`,
    left: pair.left,
    right: pair.right,
  }));
}

function asFillBlankSpec(spec: ActivitySpec) {
  if (spec.type !== "FILL_BLANK") {
    return null;
  }

  return {
    sentence: spec.sentence,
    answer: spec.answer,
    hint: spec.hint ?? "",
  };
}

function buildWordMatchSegments(input: {
  matchedPairs: Record<string, string>;
  rightItems: WordMatchPair[];
  board: HTMLDivElement | null;
  leftRefs: Record<string, HTMLButtonElement | null>;
  rightRefs: Record<string, HTMLButtonElement | null>;
}): Segment[] {
  if (!input.board) {
    return [];
  }

  const boardRect = input.board.getBoundingClientRect();

  return Object.entries(input.matchedPairs)
    .map(([leftId, rightText]) => {
      const leftElement = input.leftRefs[leftId];
      const rightItem = input.rightItems.find((item) => item.right === rightText);
      const rightElement = rightItem ? input.rightRefs[rightItem.id] : null;
      if (!leftElement || !rightElement) {
        return null;
      }

      const leftRect = leftElement.getBoundingClientRect();
      const rightRect = rightElement.getBoundingClientRect();
      return {
        x1: leftRect.right - boardRect.left,
        y1: leftRect.top - boardRect.top + leftRect.height / 2,
        x2: rightRect.left - boardRect.left,
        y2: rightRect.top - boardRect.top + rightRect.height / 2,
      };
    })
    .filter((segment): segment is Segment => segment !== null);
}

export function ActivityRenderer({
  activity,
  disabled,
  onAnswer,
  mascotGazeDirection,
  onHoverOption,
  onHoverOptionEnd,
}: ActivityRendererProps) {
  const t = useTranslations("kid.lesson.renderer");
  const mcqChoices = useMemo(() => asMcqChoices(activity.spec), [activity.spec]);
  const tfAnswer = useMemo(() => asTrueFalseAnswer(activity.spec), [activity.spec]);
  const wordPairs = useMemo(() => asWordMatchPairs(activity.spec), [activity.spec]);
  const fillSpec = useMemo(() => asFillBlankSpec(activity.spec), [activity.spec]);
  const rightByLeftId = useMemo(
    () =>
      wordPairs.reduce<Record<string, string>>((acc, pair) => {
        acc[pair.id] = pair.right;
        return acc;
      }, {}),
    [wordPairs],
  );

  const [mcqFeedback, setMcqFeedback] = useState<{ choiceId: string; correct: boolean; pulse: number } | null>(null);
  const [tfFeedback, setTfFeedback] = useState<boolean | null>(null);
  const [leftItems] = useState<WordMatchPair[]>(() => shuffleArray(wordPairs));
  const [rightItems] = useState<WordMatchPair[]>(() => shuffleArray(wordPairs));
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [wordWrongPulse, setWordWrongPulse] = useState(0);
  const [fillValue, setFillValue] = useState("");
  const [fillWrongPulse, setFillWrongPulse] = useState(0);
  const [fillHintVisible, setFillHintVisible] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);

  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onResize = () => {
      setSegments(
        buildWordMatchSegments({
          matchedPairs,
          rightItems,
          board: boardRef.current,
          leftRefs: leftRefs.current,
          rightRefs: rightRefs.current,
        }),
      );
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [matchedPairs, rightItems]);

  function handleMcqAnswer(choice: McqChoice) {
    if (disabled) {
      return;
    }

    const isCorrect = choice.isCorrect;
    setMcqFeedback((current) => ({
      choiceId: choice.id,
      correct: isCorrect,
      pulse: (current?.pulse ?? 0) + 1,
    }));
    onAnswer(isCorrect);
  }

  function handleTrueFalse(value: boolean) {
    if (disabled || tfAnswer === null) {
      return;
    }

    const isCorrect = tfAnswer === value;
    setTfFeedback(isCorrect);
    onAnswer(isCorrect);
  }

  function handleWordMatchRightClick(pair: WordMatchPair) {
    if (disabled || !selectedLeftId) {
      return;
    }

    const expectedRight = rightByLeftId[selectedLeftId];
    const isCorrect = expectedRight === pair.right;

    if (!isCorrect) {
      setWordWrongPulse((current) => current + 1);
      setSelectedLeftId(null);
      onAnswer(false);
      return;
    }

    const nextMatchedPairs = {
      ...matchedPairs,
      [selectedLeftId]: pair.right,
    };

    setMatchedPairs(nextMatchedPairs);
    setSelectedLeftId(null);
    setSegments(
      buildWordMatchSegments({
        matchedPairs: nextMatchedPairs,
        rightItems,
        board: boardRef.current,
        leftRefs: leftRefs.current,
        rightRefs: rightRefs.current,
      }),
    );

    if (Object.keys(nextMatchedPairs).length === wordPairs.length) {
      onAnswer(true);
    }
  }

  function handleFillBlankSubmit() {
    if (disabled || !fillSpec) {
      return;
    }

    const normalizedInput = fillValue.trim().toLowerCase();
    const normalizedAnswer = fillSpec.answer.trim().toLowerCase();
    const isCorrect = normalizedInput.length > 0 && normalizedInput === normalizedAnswer;

    if (!isCorrect) {
      setFillWrongPulse((current) => current + 1);
      setFillHintVisible(true);
      onAnswer(false);
      return;
    }

    onAnswer(true);
  }

  if (activity.type === "MULTIPLE_CHOICE") {
    return (
      <div className="grid gap-3" data-mascot-gaze={mascotGazeDirection}>
        <p className="lesson-wizard-quiz-copy">{activity.prompt}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {mcqChoices.map((choice, index) => {
            const direction: KidMascotGazeDirection = index % 2 === 0 ? "left" : "right";
            const isSelected = mcqFeedback?.choiceId === choice.id;
            const isCorrectFeedback = isSelected && mcqFeedback?.correct;
            const isWrongFeedback = isSelected && !mcqFeedback?.correct;

            return (
              <m.button
                key={`${choice.id}-${isWrongFeedback ? mcqFeedback?.pulse ?? 0 : 0}`}
                type="button"
                className={`lesson-wizard-option ${isCorrectFeedback ? "lesson-wizard-option-success" : ""} ${isWrongFeedback ? "lesson-wizard-option-error" : ""}`}
                onClick={() => handleMcqAnswer(choice)}
                onHoverStart={disabled ? undefined : () => onHoverOption(direction)}
                onHoverEnd={disabled ? undefined : onHoverOptionEnd}
                onFocus={disabled ? undefined : () => onHoverOption(direction)}
                onBlur={disabled ? undefined : onHoverOptionEnd}
                disabled={disabled}
                variants={isWrongFeedback ? wobble : bounceIn}
                initial={isWrongFeedback ? "idle" : "rest"}
                animate={isWrongFeedback ? "wobble" : isCorrectFeedback ? "bounceIn" : "rest"}
              >
                <strong>{choice.text}</strong>
              </m.button>
            );
          })}
        </div>
      </div>
    );
  }

  if (activity.type === "TRUE_FALSE") {
    return (
      <div className="grid gap-3" data-mascot-gaze={mascotGazeDirection}>
        <p className="lesson-wizard-quiz-copy">{activity.prompt}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={`lesson-wizard-option border-emerald-300 ${tfFeedback === true ? "lesson-wizard-option-success" : ""}`}
            onClick={() => handleTrueFalse(true)}
            onMouseEnter={() => onHoverOption("left")}
            onMouseLeave={onHoverOptionEnd}
            disabled={disabled}
          >
            <strong>{t("trueLabel")}</strong>
          </button>

          <button
            type="button"
            className={`lesson-wizard-option border-rose-300 ${tfFeedback === false ? "lesson-wizard-option-error" : ""}`}
            onClick={() => handleTrueFalse(false)}
            onMouseEnter={() => onHoverOption("right")}
            onMouseLeave={onHoverOptionEnd}
            disabled={disabled}
          >
            <strong>{t("falseLabel")}</strong>
          </button>
        </div>
      </div>
    );
  }

  if (activity.type === "MATCH_PAIRS") {
    return (
      <div className="grid gap-3" data-mascot-gaze={mascotGazeDirection}>
        <p className="lesson-wizard-quiz-copy">{activity.prompt}</p>
        <div ref={boardRef} className="relative grid gap-3 md:grid-cols-2">
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {segments.map((segment, index) => (
              <line
                key={`${segment.x1}-${segment.y1}-${segment.x2}-${segment.y2}-${index}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="#22c55e"
                strokeWidth={2}
              />
            ))}
          </svg>

          <m.div key={`left-${wordWrongPulse}`} variants={wobble} initial="idle" animate={wordWrongPulse > 0 ? "wobble" : "idle"} className="grid gap-2">
            {leftItems.map((pair) => (
              <button
                key={pair.id}
                ref={(element) => {
                  leftRefs.current[pair.id] = element;
                }}
                type="button"
                className={`lesson-wizard-option ${selectedLeftId === pair.id ? "lesson-wizard-option-success" : ""}`}
                onClick={() => setSelectedLeftId(pair.id)}
                onMouseEnter={() => onHoverOption("left")}
                onMouseLeave={onHoverOptionEnd}
                disabled={disabled}
              >
                <strong>{pair.left}</strong>
              </button>
            ))}
          </m.div>

          <m.div key={`right-${wordWrongPulse}`} variants={wobble} initial="idle" animate={wordWrongPulse > 0 ? "wobble" : "idle"} className="grid gap-2">
            {rightItems.map((pair) => (
              <button
                key={pair.id}
                ref={(element) => {
                  rightRefs.current[pair.id] = element;
                }}
                type="button"
                className="lesson-wizard-option"
                onClick={() => handleWordMatchRightClick(pair)}
                onMouseEnter={() => onHoverOption("right")}
                onMouseLeave={onHoverOptionEnd}
                disabled={disabled}
              >
                <strong>{pair.right}</strong>
              </button>
            ))}
          </m.div>
        </div>
      </div>
    );
  }

  if (activity.type === "FILL_BLANK") {
    const sentence = fillSpec?.sentence ?? "";
    const [beforeBlank, afterBlank] = sentence.includes("___") ? sentence.split("___") : [sentence, ""];

    return (
      <div className="grid gap-3" data-mascot-gaze={mascotGazeDirection}>
        <p className="lesson-wizard-quiz-copy">{activity.prompt}</p>
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {beforeBlank}
          <span className="mx-1 inline-flex min-w-14 items-center justify-center rounded border border-slate-300 bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
            ___
          </span>
          {afterBlank}
        </p>

        <m.div key={`fill-${fillWrongPulse}`} variants={wobble} initial="idle" animate={fillWrongPulse > 0 ? "wobble" : "idle"} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={fillValue}
            onChange={(event) => setFillValue(event.target.value.slice(0, 20))}
            onFocus={() => onHoverOption("left")}
            onBlur={onHoverOptionEnd}
            maxLength={20}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400"
            placeholder={t("fillPlaceholder")}
            disabled={disabled}
          />

          <button
            type="button"
            className="lesson-wizard-secondary-button min-h-10 px-4 text-sm"
            onClick={handleFillBlankSubmit}
            disabled={disabled}
          >
            {t("check")}
          </button>
        </m.div>

        {fillHintVisible && fillSpec?.hint ? <p className="text-xs text-amber-300">{t("hint", { hint: fillSpec.hint })}</p> : null}
      </div>
    );
  }

  if (activity.type === "SORT_ORDER") {
    return (
      <SortOrderActivity
        spec={activity.spec as import("@/modules/content/activity-types").SortOrderSpec}
        prompt={activity.prompt}
        disabled={disabled}
        onAnswer={onAnswer}
        onHoverOption={onHoverOption}
        onHoverOptionEnd={onHoverOptionEnd}
      />
    );
  }

  if (activity.type === "DRAG_DROP") {
    return (
      <DragDropActivity
        spec={activity.spec as import("@/modules/content/activity-types").DragDropSpec}
        prompt={activity.prompt}
        disabled={disabled}
        onAnswer={onAnswer}
        onHoverOption={onHoverOption}
        onHoverOptionEnd={onHoverOptionEnd}
      />
    );
  }

  if (activity.type === "DRAWING") {
    return (
      <DrawingActivity
        spec={activity.spec as import("@/modules/content/activity-types").DrawingSpec}
        prompt={activity.prompt}
        disabled={disabled}
        onAnswer={onAnswer}
        onHoverOption={onHoverOption}
        onHoverOptionEnd={onHoverOptionEnd}
      />
    );
  }

  return <p className="lesson-wizard-quiz-copy">{t("unsupported")}</p>;
}

// Re-export sub-components for direct use if needed
export { DragDropActivity, SortOrderActivity };
