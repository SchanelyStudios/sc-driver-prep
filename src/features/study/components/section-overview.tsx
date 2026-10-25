"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ActionLink } from "@/components/ui/action-link";
import {
  instructionalSections,
  manualUrl,
  objectives,
  questions,
} from "../data";
import { percent, score, sectionStatus } from "../lib/engine";
import { studyActions } from "../lib/repository";
import type { Mode, Profile, Section } from "../types";
const styles = {
  root: "gap-8",
  intro: "max-w-2xl gap-4",
  cards: "grid gap-5 md:grid-cols-2",
  objectiveList: "grid gap-3 md:grid-cols-2",
  objective: "flex items-start gap-3 rounded-xl bg-canvas p-4",
  icon: "pt-1 text-brand",
  actions: "mt-auto",
  secondary: "max-w-2xl",
  preview: "border-dashed",
  listTitle: "min-h-14",
  baseline: "text-muted",
};
export function SectionOverview({
  section,
  profile,
  onStart,
}: {
  section: Section;
  profile: Profile;
  onStart: (mode: Mode, sectionId: string | null) => void;
}) {
  if (section.type === "reference")
    return (
      <Box gap="lg">
        <Text variant="eyebrow" tone="muted">
          Section 12 · Reference
        </Text>
        <Text as="h1" variant="title" tabIndex={-1} data-page-heading>
          Test your knowledge.
        </Text>
        <Card>
          <Text>
            This part of the manual includes ten official sample questions and a
            reference to SCDMV&apos;s practice app. It is reference material, so
            there is no separate section pass to earn.
          </Text>
          <Box direction="row" wrap>
            <ActionLink
              href={manualUrl(section.pdfStart)}
              target="_blank"
              rel="noreferrer"
            >
              Read the official samples
              <Icon name="external" size="sm" />
            </ActionLink>
            <Button onClick={() => onStart("comprehensive", null)}>
              Take our comprehensive review
              <Icon name="arrow" size="sm" />
            </Button>
          </Box>
        </Card>
      </Box>
    );
  const pool = questions.filter((q) => q.sectionId === section.id);
  const status = sectionStatus(profile.attempts, section.id);
  const latest = profile.attempts
    .filter(
      (a) =>
        a.mode === "review" &&
        a.sectionId === section.id &&
        a.status === "completed",
    )
    .at(-1);
  const practice = profile.attempts
    .filter((a) => a.mode === "practice" && a.sectionId === section.id)
    .at(-1);
  const nextSection = instructionalSections.find(
    (s) => s.number === section.number + 1,
  );
  return (
    <Box className={styles.root}>
      <Button
        variant="quiet"
        size="sm"
        onClick={() => studyActions.navigate({ screen: "dashboard" })}
      >
        <Icon name="back" size="sm" />
        My learning
      </Button>
      <Box className={styles.intro}>
        <Box direction="row" wrap align="center">
          <Text variant="eyebrow" tone="muted">
            Section {String(section.number).padStart(2, "0")}
          </Text>
          <Badge
            tone={
              status === "Passed"
                ? "success"
                : status === "Not yet passed"
                  ? "danger"
                  : "neutral"
            }
          >
            {status}
          </Badge>
        </Box>
        <Text as="h1" variant="title" tabIndex={-1} data-page-heading>
          {section.title}
        </Text>
        <Text tone="muted">
          Learn at your own pace, or jump straight into a review. You can come
          back as often as you need.
        </Text>
        <ActionLink
          href={manualUrl(section.pdfStart)}
          target="_blank"
          rel="noreferrer"
        >
          Read this section in the manual
          <Icon name="external" size="sm" />
        </ActionLink>
        {latest && (
          <Text variant="small" tone="muted">
            Latest review: {percent(score(latest).percentage)}.{" "}
            {status === "Passed"
              ? "Your section pass is earned and stays earned."
              : "Keep practicing, then try a fresh review."}
          </Text>
        )}
      </Box>
      <div className={styles.cards}>
        <Card>
          <Badge tone="brand">Learn as you go</Badge>
          <Text as="h2" variant="heading">
            Guided practice
          </Text>
          <Text variant="small" tone="muted">
            Work through {pool.length} questions. Get feedback straight away,
            with a short explanation and a place to read more.
          </Text>
          {practice && (
            <Text variant="caption" tone="muted">
              Latest practice: {practice.checked.length} of{" "}
              {practice.questions.length} checked. Practice completion is
              separate from passing.
            </Text>
          )}
          <Button
            className={styles.actions}
            onClick={() => onStart("practice", section.id)}
          >
            {practice?.status === "in-progress"
              ? "Resume guided practice"
              : "Start guided practice"}
            <Icon name="arrow" size="sm" />
          </Button>
        </Card>
        <Card tone="soft">
          <Badge tone="brand">See what you know</Badge>
          <Text as="h2" variant="heading">
            Section review
          </Text>
          <Text variant="small" tone="muted">
            {section.reviewCount} randomized questions covering the
            section&apos;s learning topics. Get{" "}
            {Math.ceil(section.reviewCount * 0.85)} correct to pass. Answers and
            explanations appear after you submit.
          </Text>
          <Button
            variant="secondary"
            className={styles.actions}
            onClick={() => onStart("review", section.id)}
          >
            Start section review
            <Icon name="arrow" size="sm" />
          </Button>
        </Card>
      </div>
      <Box>
        <Text as="h2" variant="heading">
          What you&apos;ll cover
        </Text>
        <div className={styles.objectiveList}>
          {objectives
            .filter((o) => o.sectionId === section.id)
            .map((objective) => (
              <div key={objective.id} className={styles.objective}>
                <span className={styles.icon}>
                  <Icon name="check" size="sm" />
                </span>
                <Box gap="xs">
                  <Text variant="subheading">{objective.title}</Text>
                </Box>
              </div>
            ))}
        </div>
      </Box>
      {section.id === "S09" && (
        <Card className={styles.preview}>
          <Text variant="small" tone="muted">
            Our stuck-accelerator question covers repairing the problem before
            driving again. It does not assess the emergency recovery sequence.
            Read the manual and your vehicle&apos;s instructions for full
            details.
          </Text>
        </Card>
      )}
      <Card className={styles.secondary}>
        <Text as="h2" variant="subheading">
          There&apos;s no wrong place to begin.
        </Text>
        <Text variant="small" tone="muted">
          Every section is available now. A passed review lets you skip
          practice, and you can always return for a refresher.
        </Text>
        {nextSection && (
          <Button
            variant="quiet"
            size="sm"
            onClick={() =>
              studyActions.navigate({
                screen: "section",
                sectionId: nextSection.id,
              })
            }
          >
            Explore next: {nextSection.title}
            <Icon name="arrow" size="sm" />
          </Button>
        )}
      </Card>
    </Box>
  );
}
