"use client";
import { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { classes } from "@/lib/classes";
import { studyActions } from "../lib/repository";
import { sections } from "../data";
import { QuestionImage } from "./question-image";
import { AnswerFeedback } from "./answer-feedback";
import type { Attempt } from "../types";
const styles = {
  root: "mx-auto w-full max-w-3xl gap-7",
  top: "gap-4",
  hint: "max-w-xl",
  question: "rounded-card border border-line bg-surface p-5 shadow-card sm:p-8",
  questionBody: "gap-6",
  prompt: "text-xl leading-8 sm:text-2xl",
  footer: "border-t border-line pt-6",
  nav: "flex flex-wrap gap-2",
  navButton:
    "flex size-9 items-center justify-center rounded-lg border border-line text-xs font-semibold",
  answered: "bg-brand-soft text-brand",
  current: "ring-2 ring-brand ring-offset-2",
  image:
    "mx-auto h-auto max-h-56 w-auto rounded-lg border border-line bg-surface object-contain p-2",
  modalContent: "pt-4",
  save: "flex items-center gap-1.5",
  status: "sr-only",
};
export function QuizSession({ attempt }: { attempt: Attempt }) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const question = attempt.questions[attempt.cursor];
  const checked = attempt.checked.includes(question.id);
  const practice = attempt.mode === "practice";
  const answered = Object.keys(attempt.answers).length;
  const done = practice ? attempt.checked.length : answered;
  const title =
    attempt.mode === "comprehensive"
      ? "Comprehensive review"
      : sections.find((s) => s.id === attempt.sectionId)!.title;
  useEffect(() => {
    document.getElementById("question-prompt")?.focus();
  }, [attempt.cursor, attempt.id]);
  const finish = () => {
    if (!practice && answered < attempt.questions.length) {
      setSubmitOpen(true);
      return;
    }
    studyActions.complete(attempt.id);
  };
  return (
    <Box className={styles.root}>
      <Box direction="row" wrap align="center" justify="between">
        <Button
          variant="quiet"
          size="sm"
          onClick={() => studyActions.navigate({ screen: "dashboard" })}
        >
          <Icon name="back" size="sm" />
          Save & leave
        </Button>
        <Text variant="caption" tone="muted" className={styles.save}>
          <Icon name="clock" size="sm" />
          No timer. Take your time.
        </Text>
      </Box>
      <Box className={styles.top}>
        <Box direction="row" justify="between" align="center" wrap>
          <Badge tone="brand">
            {practice ? "Guided practice" : "Knowledge review"}
          </Badge>
          <Text variant="caption" tone="muted">
            {done} of {attempt.questions.length}{" "}
            {practice ? "checked" : "answered"}
          </Text>
        </Box>
        <Text as="h1" variant="heading" data-page-heading tabIndex={-1}>
          {title}
        </Text>
        <Progress
          value={done}
          max={attempt.questions.length}
          label={
            practice
              ? "Practice questions checked"
              : "Review questions answered"
          }
        />
        <Text variant="small" tone="muted" className={styles.hint}>
          {practice
            ? "Choose an answer, then check it. Each explanation is a chance to learn."
            : "You can change answers before submitting. Explanations appear after the review. Score 85% or higher to pass."}
        </Text>
      </Box>
      <Box className={styles.question}>
        <Box className={styles.questionBody}>
          <Text variant="eyebrow" tone="muted">
            Question {attempt.cursor + 1} / {attempt.questions.length}
          </Text>
          <Text as="h2" variant="question" id="question-prompt" tabIndex={-1}>
            {question.prompt}
          </Text>
          <QuestionImage question={question} />
          <ChoiceGroup
            key={question.id}
            labelledBy="question-prompt"
            options={question.choices}
            value={attempt.answers[question.id]}
            disabled={practice && checked}
            onChange={(choice) =>
              studyActions.answer(attempt.id, question.id, choice)
            }
          />
          {practice && checked && (
            <AnswerFeedback
              question={question}
              answer={attempt.answers[question.id]}
              live
            />
          )}
        </Box>
        <Box
          direction="row"
          wrap
          justify="between"
          align="center"
          className={styles.footer}
        >
          <Button
            variant="quiet"
            disabled={attempt.cursor === 0}
            onClick={() => studyActions.cursor(attempt.id, attempt.cursor - 1)}
          >
            <Icon name="back" size="sm" />
            Previous
          </Button>
          {practice && !checked ? (
            <Button
              disabled={!attempt.answers[question.id]}
              onClick={() => studyActions.check(attempt.id)}
            >
              Check answer
              <Icon name="check" size="sm" />
            </Button>
          ) : attempt.cursor < attempt.questions.length - 1 ? (
            <Button
              onClick={() =>
                studyActions.cursor(attempt.id, attempt.cursor + 1)
              }
            >
              Next question
              <Icon name="arrow" size="sm" />
            </Button>
          ) : (
            <Button onClick={finish}>
              {practice ? "Complete practice" : "Submit review"}
              <Icon name="flag" size="sm" />
            </Button>
          )}
        </Box>
      </Box>
      {!practice && (
        <Box gap="sm">
          <Text variant="caption" tone="muted">
            Jump to a question. Filled buttons have an answer.
          </Text>
          <nav aria-label="Review questions" className={styles.nav}>
            {attempt.questions.map((q, index) => (
              <Button
                key={q.id}
                variant="quiet"
                size="none"
                className={classes(
                  styles.navButton,
                  !!attempt.answers[q.id] && styles.answered,
                  index === attempt.cursor && styles.current,
                )}
                aria-label={`Question ${index + 1}${attempt.answers[q.id] ? ", answered" : ", unanswered"}`}
                aria-current={index === attempt.cursor ? "step" : undefined}
                onClick={() => studyActions.cursor(attempt.id, index)}
              >
                {index + 1}
              </Button>
            ))}
          </nav>
          <Button variant="secondary" onClick={finish}>
            Finish review
          </Button>
        </Box>
      )}
      <Dialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Submit with unanswered questions?"
      >
        <Box className={styles.modalContent}>
          <Text variant="small" tone="muted">
            You have {attempt.questions.length - answered} unanswered questions.
            They will count as incorrect. Once submitted, answers cannot be
            changed.
          </Text>
          <Box direction="row" wrap justify="end">
            <Button variant="secondary" onClick={() => setSubmitOpen(false)}>
              Keep reviewing
            </Button>
            <Button
              onClick={() => {
                setSubmitOpen(false);
                studyActions.complete(attempt.id);
              }}
            >
              Submit anyway
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
