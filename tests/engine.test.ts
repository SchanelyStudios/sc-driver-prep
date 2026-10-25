import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  answerQuestion,
  checkPracticeAnswer,
  completeAttempt,
  comprehensiveHistory,
  recommendations,
  score,
  sectionStatus,
  selectQuestions,
} from "../src/features/study/lib/engine.ts";
import { parseSavedData } from "../src/features/study/lib/validation.ts";
import type { Attempt, Question } from "../src/features/study/types/index.ts";
const bank = JSON.parse(
  readFileSync(
    new URL("../src/features/study/data/questions.json", import.meta.url),
    "utf8",
  ),
);
const catalog = JSON.parse(
  readFileSync(
    new URL("../src/features/study/data/catalog.json", import.meta.url),
    "utf8",
  ),
);
const pool: Question[] = bank.questions;
const fixture = (
  questions: Question[],
  mode: Attempt["mode"] = "review",
): Attempt => ({
  id: "attempt",
  mode,
  sectionId: "S05",
  questions,
  answers: {},
  checked: [],
  cursor: 0,
  status: "in-progress",
  startedAt: "2026-01-01T10:00:00.000Z",
  bankVersion: bank.bankVersion,
  sourceVersion: catalog.source.sourceId,
});
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

test("exact 85% threshold uses unrounded answers, including short section sizes", () => {
  for (const [total, passAt] of [
    [20, 17],
    [25, 22],
    [30, 26],
    [40, 34],
    [10, 9],
  ]) {
    const questions = pool.slice(0, total);
    const attempt = fixture(questions);
    for (const question of questions.slice(0, passAt - 1))
      attempt.answers[question.id] = question.correctChoiceId;
    assert.equal(score(attempt).passed, false);
    attempt.answers[questions[passAt - 1].id] =
      questions[passAt - 1].correctChoiceId;
    assert.equal(score(attempt).passed, true);
    assert.equal(score(attempt).needed, passAt);
  }
  assert.equal(score(fixture([])).passed, false);
});

test("section sampling covers every objective without duplicate questions and preserves shuffled answer keys", () => {
  for (const section of catalog.sections.filter(
    (s: { type: string }) => s.type === "instructional",
  )) {
    const candidates = pool.filter((q) => q.sectionId === section.id);
    const sets = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const selected = selectQuestions(
        candidates,
        {
          count: section.reviewCount,
          objectiveIds: section.objectiveIds,
          requireImage: section.id === "S06",
        },
        seeded(seed),
      );
      assert.equal(selected.length, section.reviewCount);
      assert.equal(new Set(selected.map((q) => q.id)).size, selected.length);
      assert.deepEqual(
        new Set(selected.map((q) => q.primaryObjectiveId)),
        new Set(section.objectiveIds),
      );
      assert.ok(
        selected.every((q) =>
          q.choices.some((c) => c.id === q.correctChoiceId),
        ),
      );
      if (section.id === "S06")
        assert.ok(selected.some((q) => q.kind === "image"));
      sets.add(
        selected
          .map((q) => q.id)
          .sort()
          .join(","),
      );
    }
    assert.ok(sets.size > 1, `No fresh selections for ${section.id}`);
  }
});

test("40-question comprehensive sample includes all sections and a sign image", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const selected = selectQuestions(
      pool,
      {
        count: 40,
        sectionQuotas: catalog.comprehensiveQuotas,
        requireImage: true,
      },
      seeded(seed),
    );
    assert.equal(selected.length, 40);
    assert.equal(new Set(selected.map((q) => q.id)).size, 40);
    for (const [section, count] of Object.entries(catalog.comprehensiveQuotas))
      assert.equal(
        selected.filter((q) => q.sectionId === section).length,
        count,
      );
    assert.ok(selected.some((q) => q.kind === "image"));
  }
});

test("missing objectives and image requirements fail instead of silently dropping coverage", () => {
  const questions = pool.filter((q) => q.sectionId === "S05");
  assert.throws(
    () => selectQuestions(questions, { count: 20, objectiveIds: ["missing"] }),
    /Missing objective/,
  );
  assert.throws(
    () => selectQuestions(questions, { count: 1, objectiveIds: ["a", "b"] }),
    /too short/,
  );
  assert.throws(
    () => selectQuestions(questions, { count: 20, requireImage: true }),
    /image/,
  );
});

test("practice locks the first checked answer; reviews allow edits only before submission", () => {
  const question = pool[0];
  const wrong = question.choices.find(
    (c) => c.id !== question.correctChoiceId,
  )!;
  let practice = answerQuestion(
    fixture([question], "practice"),
    question.id,
    wrong.id,
  );
  practice = checkPracticeAnswer(practice);
  practice = answerQuestion(practice, question.id, question.correctChoiceId);
  assert.equal(practice.answers[question.id], wrong.id);
  assert.equal(score(completeAttempt(practice)).correct, 0);
  assert.throws(
    () => completeAttempt(fixture([question], "practice")),
    /Complete each/,
  );
  let review = answerQuestion(fixture([question]), question.id, wrong.id);
  review = answerQuestion(review, question.id, question.correctChoiceId);
  review = completeAttempt(review);
  assert.equal(score(review).correct, 1);
  assert.equal(
    answerQuestion(review, question.id, wrong.id).answers[question.id],
    question.correctChoiceId,
  );
});

test("earned passes survive failed retakes and incomplete attempts do not create results", () => {
  const question = pool[0];
  const passed = completeAttempt(
    answerQuestion(fixture([question]), question.id, question.correctChoiceId),
  );
  assert.equal(
    sectionStatus([passed, completeAttempt(fixture([question]))], "S05"),
    "Passed",
  );
  assert.equal(sectionStatus([fixture([question])], "S05"), "Not started");
  assert.equal(
    sectionStatus([completeAttempt(fixture([question]))], "S05"),
    "Not yet passed",
  );
});

test("baseline stays first completed comprehensive attempt while latest and best evolve", () => {
  const question = pool[0];
  const first = completeAttempt({
    ...fixture([question], "comprehensive"),
    id: "first",
  });
  const best = completeAttempt({
    ...answerQuestion(
      fixture([question], "comprehensive"),
      question.id,
      question.correctChoiceId,
    ),
    id: "best",
    startedAt: "2026-02-01T10:00:00Z",
  });
  const latest = completeAttempt({
    ...fixture([question], "comprehensive"),
    id: "latest",
    startedAt: "2026-03-01T10:00:00Z",
  });
  const history = comprehensiveHistory([
    latest,
    fixture([question], "comprehensive"),
    best,
    first,
  ]);
  assert.equal(history.baseline?.id, "first");
  assert.equal(history.best?.id, "best");
  assert.equal(history.latest?.id, "latest");
});

test("recommendations use independent completed reviews, not multiple questions or practice as separate attempts", () => {
  const question = pool[0];
  const fail = (id: string) => completeAttempt({ ...fixture([question]), id });
  const practice = completeAttempt({
    ...fixture([question], "practice"),
    checked: [question.id],
    answers: {
      [question.id]: question.choices.find(
        (c) => c.id !== question.correctChoiceId,
      )!.id,
    },
  });
  assert.equal(recommendations([fail("one"), practice])[0].repeated, false);
  assert.equal(
    recommendations([fail("one"), fail("two"), practice])[0].repeated,
    true,
  );
});

test("persisted attempts preserve snapshots/order and reject damaged keys or schema versions", () => {
  const attempt = fixture(
    selectQuestions(
      pool.filter((q) => q.sectionId === "S05"),
      { count: 20 },
    ),
  );
  const data = {
    version: 1,
    activeProfileId: "profile",
    profiles: [
      {
        id: "profile",
        email: "student@example.com",
        createdAt: attempt.startedAt,
        view: { screen: "attempt", attemptId: attempt.id },
        attempts: [attempt],
      },
    ],
  };
  assert.deepEqual(
    parseSavedData(JSON.stringify(data)).profiles[0].attempts[0].questions,
    attempt.questions,
  );
  assert.throws(() => parseSavedData(JSON.stringify({ ...data, version: 99 })));
  data.profiles[0].attempts[0].answers = {
    [attempt.questions[0].id]: "invalid-choice",
  };
  assert.throws(() => parseSavedData(JSON.stringify(data)));
});

test("syntactically valid but corrupt attempt scopes are rejected before rendering", () => {
  const attempt = fixture(
    pool.filter((q) => q.sectionId === "S05").slice(0, 1),
  );
  const data = {
    version: 1,
    activeProfileId: "profile",
    profiles: [
      {
        id: "profile",
        email: "student@example.com",
        createdAt: attempt.startedAt,
        view: { screen: "attempt", attemptId: attempt.id },
        attempts: [attempt],
      },
    ],
  };
  assert.doesNotThrow(() => parseSavedData(JSON.stringify(data)));
  data.profiles[0].attempts[0].sectionId = "S99";
  assert.throws(() => parseSavedData(JSON.stringify(data)));
  data.profiles[0].attempts[0].sectionId = "S01";
  assert.throws(() => parseSavedData(JSON.stringify(data)));
});
