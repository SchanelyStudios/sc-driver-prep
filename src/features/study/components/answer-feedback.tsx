import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ActionLink } from "@/components/ui/action-link";
import { classes } from "@/lib/classes";
import { manualUrl } from "../data";
import type { Question } from "../types";
const styles = {
  base: "rounded-xl border p-5",
  success: "border-success/20 bg-success-soft",
  incorrect: "border-accent/30 bg-accent-soft",
  title: "flex items-center gap-2",
  body: "text-sm leading-6",
  citation: "text-xs",
};
export function AnswerFeedback({
  question,
  answer,
  live = false,
}: {
  question: Question;
  answer?: string;
  live?: boolean;
}) {
  const correct = answer === question.correctChoiceId;
  const expected = question.choices.find(
    (c) => c.id === question.correctChoiceId,
  )!;
  return (
    <Box
      gap="sm"
      className={classes(
        styles.base,
        correct ? styles.success : styles.incorrect,
      )}
      role={live ? "status" : undefined}
    >
      <Text
        variant="subheading"
        tone={correct ? "success" : "accent"}
        className={styles.title}
      >
        <Icon name={correct ? "check" : "book"} size="sm" />
        {correct
          ? "You’ve got it."
          : answer
            ? "Not quite. Let’s make it stick."
            : "You left this one unanswered."}
      </Text>
      {!correct && (
        <Text variant="small">
          <strong>Correct answer:</strong> {expected.text}
        </Text>
      )}
      <Text className={styles.body}>{question.explanation}</Text>
      <ActionLink
        className={styles.citation}
        href={manualUrl(question.source.pdfStartPage)}
        target="_blank"
        rel="noreferrer"
      >
        Manual · {question.source.heading} ·{" "}
        {question.source.printedPages.join("–")}
        <Icon name="external" size="sm" />
      </ActionLink>
    </Box>
  );
}
