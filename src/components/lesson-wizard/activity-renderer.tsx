"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as m from "motion/react-m";
import { bounceIn, wobble } from "@/components/animation/kid-motion-variants";
import type { KidMascotGazeDirection } from "@/components/animation/kid-mascot";

type ActivityRow = {
  id: string;
  type: string;
  prompt: string;
  spec: unknown;
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

function shuffleArray<T>(input: T[]) {
  const next = [...input];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex] as T, next[index] as T];
  }
  return next;
}

function asMcqChoices(spec: unknown): McqChoice[] {
  if (!spec || typeof spec !== "object" || !("choices" in spec)) {
    return [];
  }

  const choices = (spec as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) {
    return [];
  }

  return choices
    .map((choice) => {
      if (!choice || typeof choice !== "object") {
        return null;
      }
      const value = choice as { id?: unknown; text?: unknown; isCorrect?: unknown };
      if (typeof value.id !== "string" || typeof value.text !== "string" || typeof value.isCorrect !== "boolean") {
        return null;
      }
      return {
        id: value.id,
        text: value.text,
        isCorrect: value.isCorrect,
      };
    })
    .filter((value): value is McqChoice => value !== null);
}

function asTrueFalseAnswer(spec: unknown) {
  if (!spec || typeof spec !== "object" || !("answer" in spec)) {
    return null;
  }
  const answer = (spec as { answer?: unknown }).answer;
  return typeof answer === "boolean" ? answer : null;
}

function asWordMatchPairs(spec: unknown): WordMatchPair[] {
  if (!spec || typeof spec !== "object" || !("pairs" in spec)) {
    return [];
  }

  const pairs = (spec as { pairs?: unknown }).pairs;
  if (!Array.isArray(pairs)) {
    return [];
  }

  return pairs
    .map((pair) => {
      if (!pair || typeof pair !== "object") {
        return null;
      }
      const value = pair as { id?: unknown; left?: unknown; right?: unknown };
      if (typeof value.id !== "string" || typeof value.left !== "string" || typeof value.right !== "string") {
        return null;
      }
      return {
        id: value.id,
        left: value.left,
        right: value.right,
      };
    })
    .filter((value): value is WordMatchPair => value !== null);
}

function asFillBlankSpec(spec: unknown) {
  if (!spec || typeof spec !== "object") {
    return null;
  }
  const value = spec as { sentence?: unknown; answer?: unknown; hint?: unknown };
  if (typeof value.sentence !== "string" || typeof value.answer !== "string") {
    return null;
  }
  return {
    sentence: value.sentence,
    answer: value.answer,
    hint: typeof value.hint === "string" ? value.hint : "",
  };
}

export function ActivityRenderer({
  activity,
  disabled,
  onAnswer,
  mascotGazeDirection: _mascotGazeDirection,
  onHoverOption,
  onHoverOptionEnd,
}: ActivityRendererProps) {
  const [mcqFeedback, setMcqFeedback] = useState<{ choiceId: string; correct: boolean; pulse: number } | null>(null);
  const [tfFeedback, setTfFeedback] = useState<boolean | null>(null);
  const [leftItems, setLeftItems] = useState<WordMatchPair[]>([]);
  const [rightItems, setRightItems] = useState<WordMatchPair[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [wordWrongPulse, setWordWrongPulse] = useState(0);
  const [fillValue, setFillValue] = useState("");
  const [fillWrongPulse, setFillWrongPulse] = useState(0);
  const [fillHintVisible, setFillHintVisible] = useState(false);
  const [segments, setSegments] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);

  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    setMcqFeedback(null);
    setTfFeedback(null);
    setSelectedLeftId(null);
    setMatchedPairs({});
    setWordWrongPulse(0);
    setFillValue("");
    setFillWrongPulse(0);
    setFillHintVisible(false);
    setSegments([]);
    if (wordPairs.length > 0) {
      setLeftItems(shuffleArray(wordPairs));
      setRightItems(shuffleArray(wordPairs));
    } else {
      setLeftItems([]);
      setRightItems([]);
    }
  }, [activity.id, wordPairs]);

  useEffect(() => {
    if (!boardRef.current) {
      setSegments([]);
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const nextSegments = Object.entries(matchedPairs)
      .map(([leftId, rightText]) => {
        const leftElement = leftRefs.current[leftId];
        const rightItem = rightItems.find((item) => item.right === rightText);
        const rightElement = rightItem ? rightRefs.current[rightItem.id] : null;
        if (!leftElement || !rightElement) {
          return null;
        }
        const leftRect = leftElement.getBoundingClientRect();
        const rightRect = rightElement.getBoundingClientRect();
        return {
          x1: leftRect.right - rect.left,
          y1: leftRect.top - rect.top + leftRect.height / 2,
          x2: rightRect.left - rect.left,
          y2: rightRect.top - rect.top + rightRect.height / 2,
        };
      })
      .filter((segment): segment is { x1: number; y1: number; x2: number; y2: number } => segment !== null);

    setSegments(nextSegments);
  }, [matchedPairs, rightItems]);

  useEffect(() => {
    const onResize = () => {
      setSegments((current) => [...current]);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

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

    const next = {
      ...matchedPairs,
      [selectedLeftId]: pair.right,
    };
    setMatchedPairs(next);
    setSelectedLeftId(null);

    if (Object.keys(next).length === wordPairs.length) {
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

  if (activity.type === "MCQ") {
    return (
      <div className="grid gap-3">
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
                animate={isWrongFeedback ? "wobble" : isCorrectFeedback ? "bounceIn" : isWrongFeedback ? "wobble" : "rest"}
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
      <div className="grid gap-3">
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
            <strong>Đúng</strong>
          </button>
          <button
            type="button"
            className={`lesson-wizard-option border-rose-300 ${tfFeedback === false ? "lesson-wizard-option-error" : ""}`}
            onClick={() => handleTrueFalse(false)}
            onMouseEnter={() => onHoverOption("right")}
            onMouseLeave={onHoverOptionEnd}
            disabled={disabled}
          >
            <strong>Sai</strong>
          </button>
        </div>
      </div>
    );
  }

  if (activity.type === "WORD_MATCH") {
    return (
      <div className="grid gap-3">
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
      <div className="grid gap-3">
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
            placeholder="Nhập đáp án"
            disabled={disabled}
          />
          <button
            type="button"
            className="lesson-wizard-secondary-button min-h-10 px-4 text-sm"
            onClick={handleFillBlankSubmit}
            disabled={disabled}
          >
            Kiểm tra
          </button>
        </m.div>
        {fillHintVisible && fillSpec?.hint ? <p className="text-xs text-amber-300">Gợi ý: {fillSpec.hint}</p> : null}
      </div>
    );
  }

  return <p className="lesson-wizard-quiz-copy">Loại hoạt động chưa được hỗ trợ.</p>;
}
