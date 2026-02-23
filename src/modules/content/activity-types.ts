export type ActivityType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "MATCH_PAIRS"
  | "SORT_ORDER"
  | "LISTEN_IDENTIFY";

export interface MultipleChoiceSpec {
  type: "MULTIPLE_CHOICE";
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface TrueFalseSpec {
  type: "TRUE_FALSE";
  statement: string;
  isTrue: boolean;
  explanation?: string;
}

export interface FillBlankSpec {
  type: "FILL_BLANK";
  sentence: string;
  answer: string;
  hint?: string;
}

export interface MatchPairsSpec {
  type: "MATCH_PAIRS";
  pairs: { left: string; right: string }[];
}

export interface SortOrderSpec {
  type: "SORT_ORDER";
  items: string[];
  correctOrder: number[];
}

export interface ListenIdentifySpec {
  type: "LISTEN_IDENTIFY";
  audioUrl: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export type ActivitySpec =
  | MultipleChoiceSpec
  | TrueFalseSpec
  | FillBlankSpec
  | MatchPairsSpec
  | SortOrderSpec
  | ListenIdentifySpec;

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid activity spec: expected object");
  }

  return raw as Record<string, unknown>;
}

function asStringArray(raw: unknown, fieldName: string): string[] {
  if (!Array.isArray(raw) || raw.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid activity spec: ${fieldName} must be string[]`);
  }

  return raw;
}

function asNumberArray(raw: unknown, fieldName: string): number[] {
  if (!Array.isArray(raw) || raw.some((item) => typeof item !== "number")) {
    throw new Error(`Invalid activity spec: ${fieldName} must be number[]`);
  }

  return raw;
}

function normalizeType(rawType: string): ActivityType {
  switch (rawType) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE":
    case "FILL_BLANK":
    case "MATCH_PAIRS":
    case "SORT_ORDER":
    case "LISTEN_IDENTIFY":
      return rawType;
    case "MCQ":
      return "MULTIPLE_CHOICE";
    case "WORD_MATCH":
      return "MATCH_PAIRS";
    default:
      throw new Error(`Invalid activity spec: unsupported type ${rawType}`);
  }
}

export function parseActivityType(rawType: string): ActivityType {
  return normalizeType(rawType);
}

export function parseActivitySpec(raw: unknown, fallbackType?: string): ActivitySpec {
  const spec = asRecord(raw);
  const resolvedType = normalizeType(
    typeof spec.type === "string" ? spec.type : fallbackType ?? "",
  );

  if (resolvedType === "MULTIPLE_CHOICE") {
    const choices = spec.choices;
    if (Array.isArray(choices)) {
      const normalizedChoices = choices
        .map((choice) => {
          if (!choice || typeof choice !== "object" || Array.isArray(choice)) {
            return null;
          }
          const value = choice as { text?: unknown; isCorrect?: unknown };
          if (typeof value.text !== "string" || typeof value.isCorrect !== "boolean") {
            return null;
          }
          return value;
        })
        .filter((item): item is { text: string; isCorrect: boolean } => item !== null);

      const correctIndex = normalizedChoices.findIndex((item) => item.isCorrect);
      if (normalizedChoices.length > 1 && correctIndex >= 0) {
        return {
          type: "MULTIPLE_CHOICE",
          question: typeof spec.question === "string" ? spec.question : "",
          options: normalizedChoices.map((item) => item.text),
          correctIndex,
          explanation: typeof spec.explanation === "string" ? spec.explanation : undefined,
        };
      }
    }

    const options = asStringArray(spec.options, "options");
    if (typeof spec.correctIndex !== "number") {
      throw new Error("Invalid activity spec: correctIndex must be number");
    }

    return {
      type: "MULTIPLE_CHOICE",
      question: typeof spec.question === "string" ? spec.question : "",
      options,
      correctIndex: spec.correctIndex,
      explanation: typeof spec.explanation === "string" ? spec.explanation : undefined,
    };
  }

  if (resolvedType === "TRUE_FALSE") {
    const isTrue = typeof spec.isTrue === "boolean" ? spec.isTrue : spec.answer;
    if (typeof isTrue !== "boolean") {
      throw new Error("Invalid activity spec: isTrue must be boolean");
    }

    return {
      type: "TRUE_FALSE",
      statement: typeof spec.statement === "string" ? spec.statement : "",
      isTrue,
      explanation: typeof spec.explanation === "string" ? spec.explanation : undefined,
    };
  }

  if (resolvedType === "FILL_BLANK") {
    if (typeof spec.sentence !== "string" || typeof spec.answer !== "string") {
      throw new Error("Invalid activity spec: fill blank fields are invalid");
    }

    return {
      type: "FILL_BLANK",
      sentence: spec.sentence,
      answer: spec.answer,
      hint: typeof spec.hint === "string" ? spec.hint : undefined,
    };
  }

  if (resolvedType === "MATCH_PAIRS") {
    if (!Array.isArray(spec.pairs)) {
      throw new Error("Invalid activity spec: pairs must be an array");
    }

    const pairs = spec.pairs
      .map((pair) => {
        if (!pair || typeof pair !== "object" || Array.isArray(pair)) {
          return null;
        }
        const value = pair as { left?: unknown; right?: unknown };
        if (typeof value.left !== "string" || typeof value.right !== "string") {
          return null;
        }
        return {
          left: value.left,
          right: value.right,
        };
      })
      .filter((item): item is { left: string; right: string } => item !== null);

    if (pairs.length === 0) {
      throw new Error("Invalid activity spec: pairs must have at least one pair");
    }

    return {
      type: "MATCH_PAIRS",
      pairs,
    };
  }

  if (resolvedType === "SORT_ORDER") {
    return {
      type: "SORT_ORDER",
      items: asStringArray(spec.items, "items"),
      correctOrder: asNumberArray(spec.correctOrder, "correctOrder"),
    };
  }

  return {
    type: "LISTEN_IDENTIFY",
    audioUrl: typeof spec.audioUrl === "string" ? spec.audioUrl : "",
    question: typeof spec.question === "string" ? spec.question : "",
    options: asStringArray(spec.options, "options"),
    correctIndex: typeof spec.correctIndex === "number" ? spec.correctIndex : -1,
  };
}
