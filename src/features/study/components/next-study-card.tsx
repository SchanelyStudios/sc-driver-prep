"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { instructionalSections } from "../data";
import { nextStudySection } from "../lib/progression";
import { studyActions } from "../lib/repository";
import type { Profile } from "../types";
const styles = {
  card: "relative overflow-hidden gap-6",
  text: "max-w-lg gap-3",
  actions: "relative z-10",
  icon: "absolute -bottom-7 -right-4 rotate-12 text-brand/10 [&>svg]:size-44",
};
export function NextStudyCard({ profile }: { profile: Profile }) {
  const section = nextStudySection(profile, instructionalSections);
  const started =
    section &&
    profile.attempts.some(
      (a) => a.sectionId === section.id && a.status !== "cancelled",
    );
  return (
    <Card tone="accent" className={styles.card}>
      <Box className={styles.text}>
        <Badge tone="accent">
          {section ? "A good place to continue" : "Look how far you’ve come"}
        </Badge>
        <Text as="h2" variant="title">
          {section ? section.title : "Every section. A milestone earned."}
        </Text>
        <Text variant="small" tone="muted">
          {section
            ? started
              ? "Pick up this section where you left off. Your practice and review progress is ready when you are."
              : `Your next step is section ${section.number}. Explore its guided questions, or try the section review to see what you know.`
            : "You’ve passed all 11 sections. Use the comprehensive review below to keep your knowledge fresh before test day."}
        </Text>
      </Box>
      {section && (
        <Box direction="row" align="center" wrap className={styles.actions}>
          <Button
            onClick={() =>
              studyActions.navigate({
                screen: "section",
                sectionId: section.id,
              })
            }
          >
            {started ? "Continue section" : "Explore section"}
            <Icon name="arrow" size="sm" />
          </Button>
          <Text variant="caption" tone="accent">
            Section {String(section.number).padStart(2, "0")}
          </Text>
        </Box>
      )}
      <div className={styles.icon}>
        <Icon name="road" />
      </div>
    </Card>
  );
}
