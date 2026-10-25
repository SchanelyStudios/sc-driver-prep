"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Disclosure } from "@/components/ui/disclosure";
import { sections, bankVersion } from "../data";
import { percent, score, comprehensiveHistory } from "../lib/engine";
import { studyActions } from "../lib/repository";
import { QuestionImage } from "./question-image";
import { AnswerFeedback } from "./answer-feedback";
import type { Attempt, Mode, Profile } from "../types";
const styles = {
  root: "mx-auto w-full max-w-3xl gap-7",
  hero: "items-center gap-5 text-center",
  icon: "flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand",
  actions: "justify-center",
  split: "grid gap-4 sm:grid-cols-2",
  answerTitle: "flex flex-1 items-start gap-3",
  answerStatus: "shrink-0 pt-1",
  correct: "text-success",
  incorrect: "text-accent-ink",
  heading: "max-w-xl",
  comparison: "border-t border-line pt-4",
  caption: "text-muted",
};
export function Results({
  attempt,
  profile,
  onStart,
}: {
  attempt: Attempt;
  profile: Profile;
  onStart: (mode: Mode, sectionId: string | null) => void;
}) {
  const result = score(attempt);
  const practice = attempt.mode === "practice";
  const section = sections.find((s) => s.id === attempt.sectionId);
  const history = comprehensiveHistory(profile.attempts);
  const baseline = history.baseline && score(history.baseline);
  const compatible = history.baseline?.bankVersion === attempt.bankVersion;
  return (
    <Box className={styles.root}>
      <Card className={styles.hero}>
        <span className={styles.icon}>
          <Icon name={practice || result.passed ? "check" : "book"} size="lg" />
        </span>
        <Badge tone={practice || result.passed ? "success" : "accent"}>
          {practice
            ? "Practice complete"
            : result.passed
              ? "Review passed"
              : "Not yet passed"}
        </Badge>
        <Text
          as="h1"
          variant="title"
          tabIndex={-1}
          data-page-heading
          className={styles.heading}
        >
          {practice
            ? "A little wiser. A step closer."
            : result.passed
              ? "That’s a milestone worth keeping."
              : "You’re learning. Keep going."}
        </Text>
        <Text tone="muted">{section?.title ?? "Comprehensive review"}</Text>
        <Text variant="metric">
          {result.correct} / {result.total}
        </Text>
        <Text variant="small" tone="muted">
          {percent(result.percentage)} correct on your first answers.{" "}
          {practice
            ? "Practice builds understanding; a section review earns your pass."
            : `${result.needed} correct needed to pass this ${result.total}-question review.`}
        </Text>
        <Box direction="row" wrap className={styles.actions}>
          <Button
            onClick={() =>
              onStart(practice ? "review" : attempt.mode, attempt.sectionId)
            }
          >
            {practice ? "Take section review" : "Try a fresh review"}
            <Icon name="arrow" size="sm" />
          </Button>
          {!practice && section && (
            <Button
              variant="secondary"
              onClick={() => onStart("practice", section.id)}
            >
              Guided practice
            </Button>
          )}
          <Button
            variant="quiet"
            onClick={() => studyActions.navigate({ screen: "dashboard" })}
          >
            My learning
          </Button>
        </Box>
      </Card>
      {attempt.mode === "comprehensive" && baseline && (
        <Card>
          <Text as="h2" variant="subheading">
            Your progress, in perspective
          </Text>
          <div className={styles.split}>
            <Box gap="xs">
              <Text variant="caption" tone="muted">
                First comprehensive review
              </Text>
              <Text variant="heading">{percent(baseline.percentage)}</Text>
            </Box>
            <Box gap="xs">
              <Text variant="caption" tone="muted">
                This review
              </Text>
              <Text variant="heading">{percent(result.percentage)}</Text>
            </Box>
          </div>
          <Text variant="small" tone="muted">
            {history.baseline?.id === attempt.id
              ? "This is your starting point. Your first completed score will stay here as you learn."
              : compatible
                ? `A change of ${result.percentage - baseline.percentage >= 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(result.percentage - baseline.percentage)} percentage points from your first review.`
                : "These reviews use different content versions, so a direct score comparison may not reflect the same material."}
          </Text>
          <Text variant="caption" tone="muted">
            This is a sampled practice assessment. Repeat attempts can also
            reflect familiarity with questions.
          </Text>
        </Card>
      )}
      {attempt.bankVersion !== bankVersion && (
        <Text variant="caption" tone="muted">
          This result retains the questions and answers from its original
          content version.
        </Text>
      )}
      <Box>
        <Text as="h2" variant="heading">
          {practice ? "Your practice notes" : "Let’s go through your answers."}
        </Text>
        <Text variant="small" tone="muted">
          Open any question to see your answer, a short explanation, and the
          manual reference.
        </Text>
        {attempt.questions.map((question, index) => {
          const answer = attempt.answers[question.id];
          const correct = answer === question.correctChoiceId;
          return (
            <Disclosure
              key={question.id}
              title={
                <span className={styles.answerTitle}>
                  <span className={correct ? styles.correct : styles.incorrect}>
                    <Icon name={correct ? "check" : "book"} size="sm" />
                  </span>
                  <span>
                    {index + 1}. {question.prompt}
                  </span>
                </span>
              }
            >
              <Box gap="sm">
                <QuestionImage question={question} />
                <Text variant="small" tone="muted">
                  Your answer:{" "}
                  {question.choices.find((c) => c.id === answer)?.text ??
                    "Unanswered"}
                </Text>
                <AnswerFeedback question={question} answer={answer} />
              </Box>
            </Disclosure>
          );
        })}
      </Box>
    </Box>
  );
}
