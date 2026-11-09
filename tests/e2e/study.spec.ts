import { test, expect, type Page } from "@playwright/test";
const KEY = "sc-driver-prep:v1";
async function signIn(page: Page, email = "learner@example.com") {
  await page.goto("/");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Let's get started" }).click();
  await expect(
    page.getByRole("heading", { name: "Your road ahead." }),
  ).toBeVisible();
}
async function openSection(page: Page, number: string) {
  await page
    .getByRole("navigation", { name: "Study sections" })
    .getByRole("button", { name: new RegExp(`^${number} `) })
    .click();
}
async function confirmComprehensive(page: Page) {
  const dialog = page.getByRole("dialog", {
    name: "Start a new comprehensive review?",
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Start comprehensive review", exact: true })
    .click();
}
async function currentQuestion(page: Page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const profile = state.profiles.find(
      (p: { id: string }) => p.id === state.activeProfileId,
    );
    const attempt = profile.attempts.find(
      (a: { id: string }) => a.id === profile.view.attemptId,
    );
    return attempt.questions[attempt.cursor] as {
      id: string;
      prompt: string;
      correctChoiceId: string;
      choices: { id: string; text: string }[];
      explanation: string;
    };
  }, KEY);
}
async function selectAnswer(page: Page, correct: boolean) {
  const q = await currentQuestion(page);
  const choice = q.choices.find((c) =>
    correct ? c.id === q.correctChoiceId : c.id !== q.correctChoiceId,
  )!;
  await page.getByRole("radio", { name: choice.text, exact: true }).click();
  return q;
}

test("guided feedback, locked first answers, refresh/resume, and profile isolation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page);
  await openSection(page, "05");
  await page.getByRole("button", { name: "Start guided practice" }).click();
  const q = await selectAnswer(page, false);
  await expect(page.getByText(q.explanation, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Not quite. Let’s make it stick.")).toBeVisible();
  await expect(page.getByText(q.explanation, { exact: true })).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.reload();
  await expect(page.getByText(q.explanation, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  const next = await currentQuestion(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: next.prompt })).toBeVisible();
  await page.getByRole("button", { name: "Save & leave" }).click();
  await expect(
    page.getByRole("heading", { name: "Your road ahead." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Switch profile", exact: true })
    .last()
    .click();
  await page.getByLabel("Email address").fill("other@example.com");
  await page.getByRole("button", { name: "Let's get started" }).click();
  await expect(
    page.getByRole("button", { name: "Resume session" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Switch profile", exact: true })
    .last()
    .click();
  await page.getByLabel("Email address").fill(" LEARNER@example.com ");
  await page.getByRole("button", { name: "Let's get started" }).click();
  await page.getByRole("button", { name: "Resume session" }).click();
  await expect(page.getByRole("heading", { name: next.prompt })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a section review passes at 17/20 and a failed retake never removes the pass", async ({
  page,
}) => {
  await signIn(page);
  await openSection(page, "05");
  await page.getByRole("button", { name: "Start section review" }).click();
  for (let i = 0; i < 20; i++) {
    const q = await selectAnswer(page, i < 17);
    await expect(page.getByText(q.explanation, { exact: true })).toHaveCount(0);
    await page
      .getByRole("button", {
        name: i < 19 ? "Next question" : "Submit review",
        exact: true,
      })
      .click();
  }
  await expect(page.getByText("Review passed", { exact: true })).toBeVisible();
  await expect(page.getByText("17 / 20", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try a fresh review" }).click();
  await page
    .getByRole("button", { name: "Finish review", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Submit anyway" }).click();
  await expect(
    page.getByText("Not yet passed", { exact: true }).last(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "My learning", exact: true })
    .last()
    .click();
  await openSection(page, "05");
  await expect(
    page.getByText("Your section pass is earned and stays earned.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("mobile flyout traps focus, closes with Escape, and navigates to reference material", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await dialog.getByRole("button", { name: /Test Your Knowledge/ }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Test your knowledge." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Read the official samples" }),
  ).toHaveAttribute("href", /#page=140$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("comprehensive baseline is retained across retakes and reset affects only the active profile", async ({
  page,
}) => {
  await signIn(page);
  await page
    .getByRole("button", { name: "Take comprehensive review", exact: true })
    .click();
  await confirmComprehensive(page);
  await page
    .getByRole("button", { name: "Finish review", exact: true })
    .click();
  await page.getByRole("button", { name: "Submit anyway" }).click();
  await expect(
    page.getByText("This is your starting point.", { exact: false }),
  ).toBeVisible();
  const baseline = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    return state.profiles[0].attempts[0].id;
  }, KEY);
  await page.getByRole("button", { name: "Try a fresh review" }).click();
  await confirmComprehensive(page);
  await selectAnswer(page, true);
  await page
    .getByRole("button", { name: "Finish review", exact: true })
    .click();
  await page.getByRole("button", { name: "Submit anyway" }).click();
  await expect(
    page.getByText("A change of +2.5 percentage points", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).profiles[0].attempts[0].id,
      KEY,
    ),
  ).toBe(baseline);
  await page
    .getByRole("button", { name: "Clear progress", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep my progress" }).click();
  await expect(page.getByText("Your progress, in perspective")).toBeVisible();
  await page
    .getByRole("button", { name: "Clear progress", exact: true })
    .click();
  await page.getByRole("button", { name: "Clear saved data" }).click();
  await expect(
    page.getByRole("heading", { name: "Your road ahead." }),
  ).toBeVisible();
});

test("corrupt persisted data is preserved until explicit reset", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (key) => localStorage.setItem(key, "unreadable-original-data"),
    KEY,
  );
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "Saved progress" }),
  ).toContainText("Existing data has been left intact");
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    "unreadable-original-data",
  );
  await page
    .getByRole("button", { name: "Reset unreadable local data" })
    .click();
  await page.getByRole("button", { name: "Clear saved data" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Saved progress" }),
  ).toHaveCount(0);
  await page.getByLabel("Email address").fill("recovered@example.com");
  await page.getByRole("button", { name: "Let's get started" }).click();
  await expect(
    page.getByRole("heading", { name: "Your road ahead." }),
  ).toBeVisible();
});

test("quota failures keep the current session usable and announce that progress is unsaved", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "sc-driver-prep:v1")
        throw new DOMException("Storage full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await signIn(page);
  await expect(
    page.getByRole("alert").filter({ hasText: "could not be saved" }),
  ).toBeVisible();
  await openSection(page, "05");
  await page.getByRole("button", { name: "Start guided practice" }).click();
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(
    page.getByText("Question 2 / 40", { exact: true }),
  ).toBeVisible();
});

async function events(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("sc-driver-prep:events:v1") ?? '{"events":[]}',
      ).events,
  ) as Promise<import("../../src/features/study/analytics/types").StudyEvent[]>;
}

test("dashboard confirms new reviews, resumes without creating another, and confirms cancellation", async ({
  page,
}) => {
  await signIn(page);
  await expect(page.getByText("A little progress, every time.")).toHaveCount(0);
  await expect(page.getByText("Your pace. Your path.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Open section/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "How road-ready are you?" }),
  ).toBeVisible();
  await expect(page.getByText("A good place to continue")).toHaveCount(0);
  await page.getByRole("button", { name: "Take pretest", exact: true }).click();
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).profiles[0].attempts.length,
      KEY,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Take pretest", exact: true }).click();
  await confirmComprehensive(page);
  await selectAnswer(page, true);
  await page.getByRole("button", { name: "Save & leave" }).click();
  await expect(
    page.getByRole("button", { name: "Resume session" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Take comprehensive review", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).profiles[0].attempts.length,
      KEY,
    ),
  ).toBe(1);
  await page.getByRole("button", { name: "Save & leave" }).click();
  await page
    .getByRole("main")
    .getByRole("button", { name: "Cancel review", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Keep review" })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume session" }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("button", { name: "Cancel review", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel review", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume session" }),
  ).toHaveCount(0);
  const cancelled = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).profiles[0].attempts[0],
    KEY,
  );
  expect(cancelled.status).toBe("cancelled");
  expect(cancelled.cancelledAt).toBeTruthy();
  expect(
    (await events(page)).filter((e) => e.name === "review_cancelled"),
  ).toHaveLength(1);
  expect(
    (await events(page)).filter((e) => e.name === "review_completed"),
  ).toHaveLength(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "How road-ready are you?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Take pretest", exact: true }).click();
  await confirmComprehensive(page);
  await page
    .getByRole("button", { name: "Finish review", exact: true })
    .click();
  await page.getByRole("button", { name: "Submit anyway" }).click();
  await page
    .getByRole("button", { name: "My learning", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "How road-ready are you?" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "The Driver’s License", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore section", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "The Driver’s License" }),
  ).toBeVisible();
  await openSection(page, "04");
  await page.getByRole("button", { name: "Start guided practice" }).click();
  await page.getByRole("button", { name: "Save & leave" }).click();
  await expect(
    page.getByRole("heading", { name: "Before You Drive", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue section", exact: true }),
  ).toBeVisible();
});

test("question instrumentation records visits, answer timing, completions and pause/resume without email", async ({
  page,
}) => {
  await signIn(page);
  await openSection(page, "05");
  await page.getByRole("button", { name: "Start guided practice" }).click();
  const q = await selectAnswer(page, false);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  const log = await events(page);
  const relevant = log.filter((e) => e.questionId === q.id);
  expect(relevant.map((e) => e.name)).toEqual([
    "question_viewed",
    "answer_selected",
    "answer_checked",
    "question_completed",
    "question_continued",
  ]);
  expect(
    relevant.every(
      (e) =>
        Number.isFinite(Date.parse(e.occurredAt)) &&
        e.profileId &&
        e.attemptId &&
        e.bankVersion &&
        e.questionRevision,
    ),
  ).toBe(true);
  expect(
    relevant.filter((e) => e.name === "question_completed")[0].data,
  ).toMatchObject({ correct: false, completion: "practice-check" });
  expect(JSON.stringify(log)).not.toContain("learner@example.com");
  expect(log.filter((e) => e.name === "section_first_accessed")).toHaveLength(
    1,
  );
  await page.getByRole("button", { name: "Save & leave" }).click();
  await page.getByRole("button", { name: "Resume session" }).click();
  const resumed = await events(page);
  expect(resumed.filter((e) => e.name === "session_paused")).toHaveLength(1);
  expect(resumed.filter((e) => e.name === "session_resumed")).toHaveLength(1);
  const timing = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).profiles[0].attempts[0].timing,
    KEY,
  );
  expect(timing.questions[q.id].firstViewedAt).toBeTruthy();
  expect(timing.questions[q.id].checkedAt).toBeTruthy();
  expect(timing.questions[q.id].lastContinuedAt).toBeTruthy();
});

test("first section milestones survive retakes and question completion is recorded only once", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await signIn(page);
  await openSection(page, "05");
  await page.getByRole("button", { name: "Start guided practice" }).click();
  for (let i = 0; i < 40; i++) {
    await selectAnswer(page, true);
    await page
      .getByRole("button", { name: "Check answer", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: i < 39 ? "Next question" : "Complete practice",
        exact: true,
      })
      .click();
  }
  const before = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).profiles[0].sectionMilestones.S05,
    KEY,
  );
  expect(before.practiceCompletedAt).toBeTruthy();
  await page
    .getByRole("button", { name: "Take section review", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finish review", exact: true })
    .click();
  await page.getByRole("button", { name: "Submit anyway" }).click();
  const completed = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).profiles[0].sectionMilestones.S05,
    KEY,
  );
  expect(completed.firstAccessedAt).toBe(before.firstAccessedAt);
  expect(completed.practiceCompletedAt).toBe(before.practiceCompletedAt);
  expect(completed.reviewStartedAt).toBeTruthy();
  expect(completed.reviewCompletedAt).toBeTruthy();
  await page
    .getByRole("button", { name: "Try a fresh review", exact: true })
    .click();
  const after = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).profiles[0].sectionMilestones.S05,
    KEY,
  );
  for (const key of [
    "firstAccessedAt",
    "practiceCompletedAt",
    "reviewStartedAt",
    "reviewCompletedAt",
  ])
    expect(after[key]).toBe(completed[key]);
  const log = await events(page);
  expect(
    log.filter((e) => e.name === "section_practice_completed"),
  ).toHaveLength(1);
  expect(
    log.filter((e) => e.name === "section_review_first_started"),
  ).toHaveLength(1);
  expect(
    log.filter((e) => e.name === "section_review_first_completed"),
  ).toHaveLength(1);
  expect(
    log.filter(
      (e) =>
        e.name === "question_completed" &&
        e.data.completion === "practice-check",
    ),
  ).toHaveLength(40);
});

test("teach me reveals neutral feedback, persists, and is absent in reviews", async ({
  page,
}) => {
  await signIn(page);
  await openSection(page, "05");
  await page.getByRole("button", { name: "Start guided practice" }).click();
  const q = await selectAnswer(page, false);
  await page.getByRole("button", { name: "Not sure; teach me!" }).click();
  await expect(page.getByText("Let’s learn this together.")).toBeVisible();
  await expect(page.getByText(q.explanation, { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveClass(/bg-info-soft/);
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.reload();
  await expect(page.getByText("Let’s learn this together.")).toBeVisible();
  const saved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("sc-driver-prep:v1")!);
    const a = s.profiles[0].attempts[0];
    const events = JSON.parse(
      localStorage.getItem("sc-driver-prep:events:v1")!,
    ).events;
    return {
      taught: a.taught,
      answers: a.answers,
      completed: events.filter(
        (e: { name: string }) => e.name === "question_completed",
      ),
    };
  });
  expect(saved.taught).toContain(q.id);
  expect(saved.answers[q.id]).toBeUndefined();
  expect(saved.completed).toHaveLength(1);
  expect(saved.completed[0].data).toEqual({
    answerId: null,
    correct: null,
    completion: "practice-teach",
  });
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(
    page.getByRole("button", { name: "Not sure; teach me!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save & leave" }).click();
  await openSection(page, "05");
  await page.getByRole("button", { name: "Start section review" }).click();
  await expect(
    page.getByRole("button", { name: "Not sure; teach me!" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Save & leave" }).click();
  await page.getByRole("button", { name: "Take pretest", exact: true }).click();
  await confirmComprehensive(page);
  await expect(
    page.getByRole("button", { name: "Not sure; teach me!" }),
  ).toHaveCount(0);
});
