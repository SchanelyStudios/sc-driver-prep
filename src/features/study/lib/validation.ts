import type {
  Attempt,
  Profile,
  Question,
  SavedData,
  View,
} from "../types/index.ts";
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");
const date = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
function isQuestion(value: unknown): value is Question {
  if (
    !record(value) ||
    typeof value.id !== "string" ||
    !/^S(0[1-9]|1[01])$/.test(String(value.sectionId)) ||
    typeof value.primaryObjectiveId !== "string" ||
    typeof value.prompt !== "string" ||
    typeof value.explanation !== "string" ||
    !["text", "image"].includes(String(value.kind))
  )
    return false;
  if (
    !Array.isArray(value.choices) ||
    value.choices.length !== 4 ||
    !value.choices.every(
      (c) =>
        record(c) && typeof c.id === "string" && typeof c.text === "string",
    ) ||
    new Set(value.choices.map((c) => c.id)).size !== 4 ||
    !value.choices.some((c) => c.id === value.correctChoiceId)
  )
    return false;
  const source = value.source;
  if (
    !record(source) ||
    typeof source.sourceId !== "string" ||
    typeof source.heading !== "string" ||
    !stringArray(source.printedPages) ||
    !Number.isInteger(source.pdfStartPage) ||
    !Number.isInteger(source.pdfEndPage) ||
    Number(source.pdfStartPage) < 1 ||
    Number(source.pdfEndPage) > 141 ||
    Number(source.pdfEndPage) < Number(source.pdfStartPage)
  )
    return false;
  // Persisted text is rendered as text; links/images are always rebuilt from trusted source/asset paths.
  return (
    value.kind !== "image" ||
    (record(value.image) &&
      typeof value.image.alt === "string" &&
      typeof value.image.path === "string" &&
      /^assets\/sign-\d{2}\.png$/.test(value.image.path))
  );
}
function isAttempt(value: unknown): value is Attempt {
  if (
    !record(value) ||
    typeof value.id !== "string" ||
    !["practice", "review", "comprehensive"].includes(String(value.mode)) ||
    !["in-progress", "completed"].includes(String(value.status))
  )
    return false;
  if (
    !(value.mode === "comprehensive"
      ? value.sectionId === null
      : /^S(0[1-9]|1[01])$/.test(String(value.sectionId))) ||
    !Array.isArray(value.questions) ||
    value.questions.length < 1 ||
    value.questions.length > 500 ||
    !value.questions.every(isQuestion)
  )
    return false;
  const questions = value.questions as Question[];
  if (
    value.mode !== "comprehensive" &&
    questions.some((q) => q.sectionId !== value.sectionId)
  )
    return false;
  if (
    new Set(questions.map((q) => q.id)).size !== questions.length ||
    !Number.isInteger(value.cursor) ||
    Number(value.cursor) < 0 ||
    Number(value.cursor) >= questions.length ||
    !stringArray(value.checked) ||
    new Set(value.checked).size !== value.checked.length ||
    !record(value.answers)
  )
    return false;
  if (
    !Object.entries(value.answers).every(([id, choice]) =>
      questions.some(
        (q) => q.id === id && q.choices.some((c) => c.id === choice),
      ),
    )
  )
    return false;
  if (
    !value.checked.every(
      (id) =>
        questions.some((q) => q.id === id) &&
        Object.hasOwn(value.answers as object, id),
    )
  )
    return false;
  if (
    value.status === "completed" &&
    (!date(value.completedAt) ||
      (value.mode === "practice" && value.checked.length !== questions.length))
  )
    return false;
  return (
    date(value.startedAt) &&
    typeof value.bankVersion === "string" &&
    typeof value.sourceVersion === "string"
  );
}
function isView(value: unknown, attempts: Attempt[]): value is View {
  return (
    record(value) &&
    (value.screen === "dashboard" ||
      (value.screen === "section" &&
        /^S(0[1-9]|1[0-2])$/.test(String(value.sectionId))) ||
      (value.screen === "attempt" &&
        attempts.some((a) => a.id === value.attemptId)))
  );
}
function isProfile(value: unknown): value is Profile {
  return (
    record(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    value.email.length <= 254 &&
    date(value.createdAt) &&
    Array.isArray(value.attempts) &&
    value.attempts.every(isAttempt) &&
    new Set(value.attempts.map((a) => a.id)).size === value.attempts.length &&
    isView(value.view, value.attempts)
  );
}
export function parseSavedData(raw: string): SavedData {
  const data: unknown = JSON.parse(raw);
  if (
    !record(data) ||
    data.version !== 1 ||
    !Array.isArray(data.profiles) ||
    !data.profiles.every(isProfile) ||
    new Set(data.profiles.map((p) => p.id)).size !== data.profiles.length ||
    !(
      data.activeProfileId === null ||
      data.profiles.some((p) => p.id === data.activeProfileId)
    )
  )
    throw new Error("Unsupported or damaged saved progress.");
  return data as SavedData;
}
