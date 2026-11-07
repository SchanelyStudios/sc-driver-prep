"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { instructionalSections } from "../data";
import {
  comprehensiveHistory,
  percent,
  score,
  sectionStatus,
} from "../lib/engine";
import { ComprehensiveProgress } from "./comprehensive-progress";
import { ReviewRecommendations } from "./review-recommendations";
import { ResumeSessionCard } from "./resume-session-card";
import { NextStudyCard } from "./next-study-card";
import type { Mode, Profile } from "../types";
const styles = {
  root: "gap-8",
  intro: "max-w-xl",
  metrics: "grid gap-5 sm:grid-cols-2",
  metricCard: "gap-3",
  reviewCard: "gap-6 sm:flex-row sm:items-center sm:justify-between",
  reviewText: "max-w-lg gap-2",
  inverseMuted: "text-surface/75",
};
export function Dashboard({
  profile,
  onStart,
}: {
  profile: Profile;
  onStart: (mode: Mode, sectionId: string | null) => void;
}) {
  const passed = instructionalSections.filter(
    (s) => sectionStatus(profile.attempts, s.id) === "Passed",
  ).length;
  const history = comprehensiveHistory(profile.attempts);
  const pending = profile.attempts
    .filter((a) => a.status === "in-progress")
    .sort((a, b) =>
      (a.updatedAt ?? a.startedAt).localeCompare(b.updatedAt ?? b.startedAt),
    )
    .at(-1);
  return (
    <Box className={styles.root}>
      <Box gap="sm" className={styles.intro}>
        <Text variant="eyebrow" tone="muted">
          South Carolina · Learner&apos;s permit
        </Text>
        <Text as="h1" variant="display" tabIndex={-1} data-page-heading>
          Your road ahead.
        </Text>
        <Text tone="muted">
          Small steps today. More confidence on test day. Pick up where you left
          off, or find out what you already know.
        </Text>
      </Box>
      {pending && <ResumeSessionCard attempt={pending} />}
      <div className={styles.metrics}>
        <Card className={styles.metricCard}>
          <Text variant="small" tone="muted">
            Your milestones
          </Text>
          <Box direction="row" align="end" gap="sm">
            <Text variant="metric">{passed}</Text>
            <Text variant="small" tone="muted">
              of 11 sections passed
            </Text>
          </Box>
          <Progress value={passed} max={11} label="Overall section progress" />
        </Card>
        <Card className={styles.metricCard}>
          <Text variant="small" tone="muted">
            Best comprehensive review
          </Text>
          <Text variant="metric">
            {history.best ? percent(score(history.best).percentage) : "—"}
          </Text>
          <Text variant="caption" tone="muted">
            {history.best
              ? "Keep building on what you know."
              : "Take a pretest to set your starting point."}
          </Text>
        </Card>
      </div>
      {history.baseline ? (
        <NextStudyCard profile={profile} />
      ) : (
        <Card tone="brand" className={styles.reviewCard}>
          <Box className={styles.reviewText}>
            <Text variant="eyebrow" tone="inverse">
              Find your starting point
            </Text>
            <Text as="h2" variant="heading" tone="inverse">
              How road-ready are you?
            </Text>
            <Text variant="small" className={styles.inverseMuted}>
              Try 40 questions from across the manual as a pretest. There&apos;s
              no need to study first—this is your starting point, not your final
              destination.
            </Text>
          </Box>
          <Button
            variant="accent"
            onClick={() => onStart("comprehensive", null)}
          >
            {pending?.mode === "comprehensive"
              ? "Resume pretest"
              : "Take pretest"}
            <Icon name="arrow" size="sm" />
          </Button>
        </Card>
      )}
      <Card className={styles.reviewCard}>
        <Box className={styles.reviewText}>
          <Text variant="eyebrow" tone="muted">
            Practice for the big picture
          </Text>
          <Text as="h2" variant="heading">
            Take a comprehensive review.
          </Text>
          <Text variant="small" tone="muted">
            Use this 40-question review as a study tool along the way. Aim for
            at least 85%—34 correct—before taking the official knowledge test at
            the DMV.
          </Text>
          <Text variant="caption" tone="muted">
            Our practice goal is not a guarantee of passing the official test.
          </Text>
        </Box>
        <Button onClick={() => onStart("comprehensive", null)}>
          Take comprehensive review
          <Icon name="arrow" size="sm" />
        </Button>
      </Card>
      <ComprehensiveProgress attempts={profile.attempts} />
      <ReviewRecommendations attempts={profile.attempts} />
    </Box>
  );
}
