import type { Attempt, Question } from "../types/index.ts";

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Selection = {
  count: number;
  objectiveIds?: string[];
  sectionQuotas?: Record<string, number>;
  requireImage?: boolean;
};
/** Coverage takes priority over filling a target; invalid blueprints fail loudly. */
export function selectQuestions(
  pool: Question[],
  selection: Selection,
  random = Math.random,
): Question[] {
  if (new Set(pool.map((q) => q.id)).size !== pool.length)
    throw new Error("The question pool contains duplicate IDs.");
  const count = Math.min(selection.count, pool.length);
  const selected: Question[] = [];
  if (selection.sectionQuotas) {
    if (
      Object.values(selection.sectionQuotas).reduce((a, b) => a + b, 0) !==
      selection.count
    )
      throw new Error("The comprehensive quotas do not match its length.");
    for (const [section, quota] of Object.entries(selection.sectionQuotas)) {
      const sectionPool = pool.filter((q) => q.sectionId === section);
      if (sectionPool.length < quota)
        throw new Error(`Not enough questions in ${section}.`);
      selected.push(...shuffle(sectionPool, random).slice(0, quota));
    }
  } else {
    const required = [...new Set(selection.objectiveIds ?? [])];
    if (required.length > count)
      throw new Error(
        "The review is too short to cover its learning objectives.",
      );
    for (const objective of required) {
      const candidates = pool.filter((q) => q.primaryObjectiveId === objective);
      if (!candidates.length)
        throw new Error(`Missing objective: ${objective}.`);
      selected.push(candidates[Math.floor(random() * candidates.length)]);
    }
    const used = new Set(selected.map((q) => q.id));
    selected.push(
      ...shuffle(
        pool.filter((q) => !used.has(q.id)),
        random,
      ).slice(0, count - selected.length),
    );
  }
  if (selection.requireImage && !selected.some((q) => q.kind === "image")) {
    const candidates = pool.filter(
      (q) => q.kind === "image" && !selected.some((item) => item.id === q.id),
    );
    if (!candidates.length)
      throw new Error("A required sign-image question is missing.");
    const image = candidates[Math.floor(random() * candidates.length)];
    const replaceIndex = selected.findIndex((q) =>
      selection.sectionQuotas
        ? q.sectionId === image.sectionId
        : q.primaryObjectiveId === image.primaryObjectiveId,
    );
    if (replaceIndex < 0)
      throw new Error("The image requirement would break coverage.");
    selected[replaceIndex] = image;
  }
  return shuffle(selected, random).map((q) => ({
    ...q,
    choices: shuffle(q.choices, random),
  }));
}

export function score(attempt: Pick<Attempt, "questions" | "answers">) {
  const total = attempt.questions.length;
  const correct = attempt.questions.filter(
    (q) => attempt.answers[q.id] === q.correctChoiceId,
  ).length;
  return {
    total,
    correct,
    percentage: total ? (correct / total) * 100 : 0,
    passed: total > 0 && correct * 100 >= total * 85,
    needed: Math.ceil((total * 85) / 100),
  };
}
export function answerQuestion(
  attempt: Attempt,
  questionId: string,
  choiceId: string,
): Attempt {
  if (attempt.status !== "in-progress") return attempt;
  const question = attempt.questions.find((q) => q.id === questionId);
  if (!question?.choices.some((c) => c.id === choiceId)) return attempt;
  if (attempt.mode === "practice" && attempt.checked.includes(questionId))
    return attempt;
  return {
    ...attempt,
    answers: { ...attempt.answers, [questionId]: choiceId },
  };
}
export function checkPracticeAnswer(attempt: Attempt): Attempt {
  const question = attempt.questions[attempt.cursor];
  if (
    attempt.mode !== "practice" ||
    attempt.status !== "in-progress" ||
    !attempt.answers[question.id] ||
    attempt.checked.includes(question.id)
  )
    return attempt;
  return { ...attempt, checked: [...attempt.checked, question.id] };
}
export function completeAttempt(
  attempt: Attempt,
  now = new Date().toISOString(),
): Attempt {
  if (attempt.status === "completed") return attempt;
  if (
    attempt.mode === "practice" &&
    attempt.checked.length !== attempt.questions.length
  )
    throw new Error("Complete each practice question first.");
  return { ...attempt, status: "completed", completedAt: now };
}
export function sectionStatus(attempts: Attempt[], sectionId: string) {
  const reviews = attempts.filter(
    (a) =>
      a.mode === "review" &&
      a.sectionId === sectionId &&
      a.status === "completed",
  );
  if (reviews.some((a) => score(a).passed)) return "Passed" as const;
  return reviews.length
    ? ("Not yet passed" as const)
    : ("Not started" as const);
}
export function comprehensiveHistory(attempts: Attempt[]) {
  const completed = attempts
    .filter((a) => a.mode === "comprehensive" && a.status === "completed")
    .sort(
      (a, b) =>
        (a.completedAt ?? a.startedAt).localeCompare(
          b.completedAt ?? b.startedAt,
        ) || a.startedAt.localeCompare(b.startedAt),
    );
  return {
    baseline: completed[0],
    latest: completed.at(-1),
    best: completed.reduce<Attempt | undefined>(
      (best, a) =>
        !best || score(a).percentage > score(best).percentage ? a : best,
      undefined,
    ),
  };
}
export function recommendations(attempts: Attempt[]) {
  const completed = attempts
    .filter((a) => a.mode !== "practice" && a.status === "completed")
    .sort((a, b) =>
      (b.completedAt ?? b.startedAt).localeCompare(
        a.completedAt ?? a.startedAt,
      ),
    );
  const ids = [
    ...new Set(
      completed.flatMap((a) => a.questions.map((q) => q.primaryObjectiveId)),
    ),
  ];
  return ids
    .flatMap((id) => {
      const observed = completed
        .filter((a) => a.questions.some((q) => q.primaryObjectiveId === id))
        .slice(0, 3);
      const misses = observed.filter((a) =>
        a.questions.some(
          (q) =>
            q.primaryObjectiveId === id &&
            a.answers[q.id] !== q.correctChoiceId,
        ),
      ).length;
      return misses
        ? [
            {
              objectiveId: id,
              misses,
              observations: observed.length,
              repeated: misses >= 2,
            },
          ]
        : [];
    })
    .sort(
      (a, b) =>
        Number(b.repeated) - Number(a.repeated) ||
        b.misses / b.observations - a.misses / a.observations,
    )
    .slice(0, 4);
}
export function percent(value: number) {
  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value) +
    "%"
  );
}
