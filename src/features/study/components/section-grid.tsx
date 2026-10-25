"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { studyActions } from "../lib/repository";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { instructionalSections } from "../data";
import { sectionStatus } from "../lib/engine";
import type { Attempt } from "../types";
const styles = {
  list: "grid gap-4 md:grid-cols-2",
  sectionCard: "gap-4",
  sectionNumber:
    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-sm font-semibold text-muted",
  sectionTitle: "min-h-12",
};
export function SectionGrid({ attempts }: { attempts: Attempt[] }) {
  const profile = { attempts };
  return (
    <Box>
      <Box gap="xs">
        <Text as="h2" variant="heading">
          Make the manual yours.
        </Text>
        <Text variant="small" tone="muted">
          Study in any order. Pass a section review with 85% or higher to earn
          its milestone.
        </Text>
      </Box>
      <div className={styles.list}>
        {instructionalSections.map((section) => {
          const status = sectionStatus(profile.attempts, section.id);
          return (
            <Card key={section.id} className={styles.sectionCard}>
              <Box direction="row" align="center" justify="between">
                <span className={styles.sectionNumber}>
                  {String(section.number).padStart(2, "0")}
                </span>
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
              <Text as="h3" variant="heading" className={styles.sectionTitle}>
                {section.title}
              </Text>
              <Box direction="row" justify="between" align="center">
                <Text variant="caption" tone="muted">
                  {section.reviewCount} review questions
                </Text>
                <Button
                  variant="quiet"
                  size="sm"
                  aria-label={`Open section ${section.number}: ${section.title}`}
                  onClick={() =>
                    studyActions.navigate({
                      screen: "section",
                      sectionId: section.id,
                    })
                  }
                >
                  Explore
                  <Icon name="arrow" size="sm" />
                </Button>
              </Box>
            </Card>
          );
        })}
      </div>
    </Box>
  );
}
