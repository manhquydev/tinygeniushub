import type { ActivityFormState, ActivityRow, ActivityType, LessonFormState } from "./admin-content-types";

export function shortText(value: string, max = 50) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function getActivityTypeLabel(type: ActivityType) {
  switch (type) {
    case "MCQ":
      return "Multiple choice";
    case "TRUE_FALSE":
      return "True/False";
    case "WORD_MATCH":
      return "Connect words";
    case "FILL_BLANK":
      return "Fill in the blanks";
    default:
      return type;
  }
}

export function toTrackLabel(code: string) {
  if (code === "ENGLISH") return "English";
  if (code === "MATH") return "Maths";
  if (code === "HABIT") return "Habit";
  return code;
}

export function buildDefaultLessonForm(nextOrderNo = 1): LessonFormState {
  return {
    orderNo: String(nextOrderNo),
    slug: "",
    title: "",
    objective: "",
    estimatedMinutes: "15",
    trialEnabled: false,
    videoSource: "",
    offlineCardMarkdown: "",
    parentScriptMarkdown: "",
  };
}

export function buildDefaultActivityForm(): ActivityFormState {
  return {
    type: "MCQ",
    prompt: "",
    passCriteria: "80",
    mcqChoices: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    mcqCorrectChoiceId: "a",
    trueFalseAnswer: true,
    wordPairs: [{ id: "p1", left: "", right: "" }],
    fillSentence: "",
    fillAnswer: "",
    fillHint: "",
  };
}

export function parseActivityToForm(activity: ActivityRow): ActivityFormState {
  const fallback = buildDefaultActivityForm();
  fallback.type = activity.type;
  fallback.prompt = activity.prompt;
  fallback.passCriteria = String(activity.passCriteria);

  if (activity.type === "MCQ") {
    const spec = activity.spec as { choices?: Array<{ id?: string; text?: string; isCorrect?: boolean }> } | null;
    const raw = Array.isArray(spec?.choices) ? spec.choices : [];
    const choices = raw.length === 4 ? raw : [{ id: "a", text: "", isCorrect: true }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }];
    fallback.mcqChoices = choices.map((choice, index) => ({ id: typeof choice.id === "string" ? choice.id : String.fromCharCode(97 + index), text: typeof choice.text === "string" ? choice.text : "" }));
    fallback.mcqCorrectChoiceId = choices.find((choice) => choice.isCorrect)?.id ?? fallback.mcqChoices[0]?.id ?? "a";
  }

  if (activity.type === "TRUE_FALSE") {
    const spec = activity.spec as { answer?: unknown } | null;
    fallback.trueFalseAnswer = spec?.answer === true;
  }

  if (activity.type === "WORD_MATCH") {
    const spec = activity.spec as { pairs?: Array<{ id?: string; left?: string; right?: string }> } | null;
    const pairs = Array.isArray(spec?.pairs) ? spec.pairs : [];
    fallback.wordPairs = pairs.length > 0 ? pairs.slice(0, 4).map((pair, index) => ({ id: typeof pair.id === "string" ? pair.id : `p${index + 1}`, left: typeof pair.left === "string" ? pair.left : "", right: typeof pair.right === "string" ? pair.right : "" })) : [{ id: "p1", left: "", right: "" }];
  }

  if (activity.type === "FILL_BLANK") {
    const spec = activity.spec as { sentence?: unknown; answer?: unknown; hint?: unknown } | null;
    fallback.fillSentence = typeof spec?.sentence === "string" ? spec.sentence : "";
    fallback.fillAnswer = typeof spec?.answer === "string" ? spec.answer : "";
    fallback.fillHint = typeof spec?.hint === "string" ? spec.hint : "";
  }
  return fallback;
}

export function buildActivitySpec(form: ActivityFormState): Record<string, unknown> {
  if (form.type === "MCQ") {
    return { choices: form.mcqChoices.map((choice) => ({ id: choice.id, text: choice.text.trim(), isCorrect: choice.id === form.mcqCorrectChoiceId })) };
  }
  if (form.type === "TRUE_FALSE") {
    return { answer: form.trueFalseAnswer };
  }
  if (form.type === "WORD_MATCH") {
    return { pairs: form.wordPairs.map((pair) => ({ id: pair.id, left: pair.left.trim(), right: pair.right.trim() })) };
  }
  return { sentence: form.fillSentence.trim(), answer: form.fillAnswer.trim(), hint: form.fillHint.trim() || null };
}
