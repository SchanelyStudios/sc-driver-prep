"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { studyActions } from "../lib/repository";
import { Badge } from "@/components/ui/badge";
import { ActionLink } from "@/components/ui/action-link";
import { Icon } from "@/components/ui/icon";
import { objectives, manualUrl } from "../data";
import { recommendations } from "../lib/engine";
import type { Attempt } from "../types";
const styles = { recommendation: "grid gap-4 md:grid-cols-2" };
export function ReviewRecommendations({ attempts }: { attempts: Attempt[] }) {
  const suggested = recommendations(attempts);
  return (
    <>
      {suggested.length > 0 && (
        <Box>
          <Box gap="xs">
            <Text as="h2" variant="heading">
              Suggested areas to review
            </Text>
            <Text variant="small" tone="muted">
              A little extra attention here can help.
            </Text>
          </Box>
          <div className={styles.recommendation}>
            {suggested.map((item) => {
              const objective = objectives.find(
                (o) => o.id === item.objectiveId,
              );
              if (!objective) return null;
              return (
                <Card key={item.objectiveId}>
                  <Badge tone={item.repeated ? "accent" : "neutral"}>
                    {item.repeated
                      ? "Missed more than once"
                      : "Topic to revisit"}
                  </Badge>
                  <Text as="h3" variant="subheading">
                    {objective.title}
                  </Text>
                  <Text variant="caption" tone="muted">
                    Missed in {item.misses} of {item.observations} recent
                    reviews covering this topic.
                  </Text>
                  <Box direction="row" wrap>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        studyActions.navigate({
                          screen: "section",
                          sectionId: objective.sectionId,
                        })
                      }
                    >
                      Study this section
                    </Button>
                    <ActionLink
                      href={manualUrl(objective.pdfPage)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Manual
                      <Icon name="external" size="sm" />
                    </ActionLink>
                  </Box>
                </Card>
              );
            })}
          </div>
        </Box>
      )}
    </>
  );
}
