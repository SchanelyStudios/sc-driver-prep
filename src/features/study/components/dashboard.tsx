"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { instructionalSections } from "../data";
import {
  comprehensiveHistory,
  percent,
  score,
  sectionStatus,
} from "../lib/engine";
import { studyActions } from "../lib/repository";
import { ComprehensiveProgress } from "./comprehensive-progress";
import { ReviewRecommendations } from "./review-recommendations";
import { SectionGrid } from "./section-grid";
import type { Mode, Profile } from "../types";
const styles = {
  root: "gap-8",
  intro: "max-w-xl",
  overview: "grid gap-5 xl:grid-cols-[1.5fr_1fr]",
  hero: "relative overflow-hidden min-h-64 justify-between",
  heroTop: "max-w-sm gap-3",
  heroActions: "relative z-10",
  heroIcon:
    "absolute -bottom-7 -right-4 rotate-12 text-brand/10 [&>svg]:size-44",
  metrics: "grid grid-cols-2 gap-5 xl:grid-cols-1",
  metricCard: "gap-3",
  reviewCard: "gap-6 sm:flex-row sm:items-center sm:justify-between",
  reviewText: "max-w-lg gap-2",
  inverseMuted: "text-surface/75",
  resume: "border-accent/40",
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
      {pending && (
        <Card className={styles.resume}>
          <Box direction="row" wrap align="center" justify="between">
            <Box gap="xs">
              <Text variant="subheading">You have a session in progress</Text>
              <Text variant="small" tone="muted">
                {pending.mode === "comprehensive"
                  ? "Comprehensive review"
                  : `${pending.mode === "practice" ? "Guided practice" : "Section review"} · ${instructionalSections.find((s) => s.id === pending.sectionId)?.title}`}{" "}
                · Question {pending.cursor + 1} of {pending.questions.length}
              </Text>
            </Box>
            <Button
              onClick={() =>
                studyActions.navigate({
                  screen: "attempt",
                  attemptId: pending.id,
                })
              }
            >
              Resume session
              <Icon name="arrow" size="sm" />
            </Button>
          </Box>
        </Card>
      )}
      <div className={styles.overview}>
        <Card tone="accent" className={styles.hero}>
          <Box className={styles.heroTop}>
            <Badge tone="accent">A good place to start</Badge>
            <Text as="h2" variant="title">
              Start with the basics.
            </Text>
            <Text variant="small" tone="muted">
              Get comfortable with starting, stopping, steering, and backing up.
              One question at a time.
            </Text>
          </Box>
          <Box
            direction="row"
            align="center"
            wrap
            className={styles.heroActions}
          >
            <Button
              onClick={() =>
                studyActions.navigate({ screen: "section", sectionId: "S05" })
              }
            >
              Explore Basic Driving
              <Icon name="arrow" size="sm" />
            </Button>
            <Text variant="caption" tone="accent">
              Section 05
            </Text>
          </Box>
          <div className={styles.heroIcon}>
            <Icon name="road" />
          </div>
        </Card>
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
            <Progress
              value={passed}
              max={11}
              label="Overall section progress"
            />
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
      </div>
      <Card tone="brand" className={styles.reviewCard}>
        <Box className={styles.reviewText}>
          <Text variant="eyebrow" tone="inverse">
            The big picture
          </Text>
          <Text as="h2" variant="heading" tone="inverse">
            How road-ready are you?
          </Text>
          <Text variant="small" className={styles.inverseMuted}>
            40 questions from across the manual. Try it now as a pretest, then
            come back to see how far you&apos;ve come. 34 correct passes.
          </Text>
        </Box>
        <Button variant="accent" onClick={() => onStart("comprehensive", null)}>
          Take comprehensive review
          <Icon name="arrow" size="sm" />
        </Button>
      </Card>
      <ComprehensiveProgress attempts={profile.attempts} />
      <ReviewRecommendations attempts={profile.attempts} />
      <SectionGrid attempts={profile.attempts} />
    </Box>
  );
}
