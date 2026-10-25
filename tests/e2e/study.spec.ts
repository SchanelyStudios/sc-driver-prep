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
  await page.getByRole("button", { name: "Explore Basic Driving" }).click();
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
  await page.getByRole("button", { name: "Explore Basic Driving" }).click();
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
  await page.getByRole("button", { name: "Explore Basic Driving" }).click();
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
  await page.getByRole("button", { name: "Explore Basic Driving" }).click();
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
