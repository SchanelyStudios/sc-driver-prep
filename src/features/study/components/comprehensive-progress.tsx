"use client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { studyActions } from "../lib/repository";
import { comprehensiveHistory, percent, score } from "../lib/engine";
import type { Attempt } from "../types";
const styles = { history: "grid grid-cols-3 gap-4 border-t border-line pt-4" };
export function ComprehensiveProgress({ attempts }: { attempts: Attempt[] }) {
  const history = comprehensiveHistory(attempts);
  return (
    <>
      {history.baseline && (
        <Card>
          <Text as="h2" variant="subheading">
            Your comprehensive progress
          </Text>
          <div className={styles.history}>
            {(
              [
                ["First", history.baseline],
                ["Latest", history.latest],
                ["Best", history.best],
              ] as const
            ).map(([label, attempt]) => (
              <Box key={label} gap="xs">
                <Text variant="caption" tone="muted">
                  {label}
                </Text>
                <Text variant="heading">
                  {attempt ? percent(score(attempt).percentage) : "—"}
                </Text>
                {attempt && (
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() =>
                      studyActions.navigate({
                        screen: "attempt",
                        attemptId: attempt.id,
                      })
                    }
                  >
                    View result
                  </Button>
                )}
              </Box>
            ))}
          </div>
          <Text variant="caption" tone="muted">
            Your first completed review stays as your baseline. These scores
            measure practice performance; repeated questions may become
            familiar.
          </Text>
        </Card>
      )}
    </>
  );
}
